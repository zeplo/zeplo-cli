import axios from 'axios'
import moment from 'moment'
import { v4 } from 'uuid'
import { merge, map, forEach } from 'lodash'
import ms from 'ms'
import { jobs, saveJobs, loadSavedJobs } from './jobs'
import { Request } from '@zeplo/types/request'
import { getNextSchedule } from './util'
import output from '../../output'
import pkg from '../../../../package.json'

let timer: NodeJS.Timeout|null = null

const { NODE_ENV } = process.env
let ending = false

export default function worker (args: any) {
  loadSavedJobs(args).then(() => {
    timer = setTimeout(() => { tick(args) }, args.pollInterval ? parseInt(args.pollInterval) : 1000)
  })
  return async () => {
    ending = true
    output.info('Closing queue and persisting jobs', args)
    if (timer) clearTimeout(timer)
    await saveJobs(args)
    ending = false
  }
}

export async function tick (args: any) {
  const now = Date.now() / 1000
  const retain: string = args.retain || args.r || '7d'
  const retainFor = ms(retain) / 1000

  await Promise.all(map(jobs, async (job, jobId) => {
    const { start, trace, status, source, end, step, steps, requires } = job.request

    // Queue is ending
    if (ending) return

    // Job is not scheduled yet
    if (start > now) return

    // Steps request itself is never run (all child jobs are scheduled immediately)
    if (steps) return

    // If cursor is present, then this is a schedule parent, that has already been scheduled
    if (job.cursor) return

    // If this is a step that not should run yet
    if (step && trace && requires && jobs[trace]?.request.steps?.[step]?.started !== 1) {
      return
    }

    // Delete expired successful jobs
    if ((status === 'ERROR' ||
         status === 'SUCCESS') &&
         end &&
        (end + retainFor) < now
    ) {
      delete jobs[jobId]
    }

    const parentJob = trace ? jobs[trace] : null
    const allowRun = status === 'PENDING' || status === 'ACTIVE' ||
     (status === 'INACTIVE' && source === 'SCHEDULE' && parentJob?.cursor === jobId)
    if (!allowRun) return

    return processRequest(args, job.request).catch((e) => {
      output.error(e.message, args, false)
      if (NODE_ENV === 'development') output.error(e.stack, args, false)
    }).then(() => {
      if ((args.retain === '0' || args.r === '0' || ms(retain) === 0) &&
          (job.request.status === 'SUCCESS' || job.request.status === 'ERROR')) {
        delete jobs[jobId]
      }
    })
  }))

  if (ending) return

  await saveJobs(args)
  timer = setTimeout(() => { tick(args) }, 1000)
}

export async function processRequest (args: any, request: Request) {
  output.info(`Processing ${request.id} ${request.trace ? `for ${request.trace}` : ''}`, args)

  const { id, status, start, trace, source, step, _source } = request
  const { url, method, headers, body } = request.request
  const { cron, interval } = _source || request
  const now = Date.now() / 1000

  if (status === 'PENDING') request.status = 'ACTIVE'

  let response
  try {
    if ((cron || interval) && start) {
      const next = getNextSchedule(request)
      if (next) {
        const nextId = scheduleNextJob('SCHEDULE', request, next)
        const parentId = source === 'REQUEST' ? id : trace

        // Update the cursor on the parent
        if (parentId && jobs[parentId]) jobs[parentId].cursor = nextId
        output.info(`Scheduling ${nextId} at ${moment(next * 1000).format('YYYYMMDD:HH:mm:ss')} (+${ms((next - start) * 1000)}) for ${parentId}`, args)

        // Trigger another tick, in case we've got behind and need to run this
        // scheduled job immedietely
        // setTimeout(() => tick(args), 0)
      }

      if (source === 'REQUEST' || request.status === 'INACTIVE') return
    }

    response = await axios({
      url,
      method,
      headers: {
        'User-Agent': `${pkg.name}@${pkg.version}`,
        ...headers,
        'X-Zeplo-Start': now,
        'X-Zeplo-Id': request.id,
      },
      // params,
      data: body ? Buffer.from(body, 'base64') : undefined,
      // Timeout after 24 hours
      timeout: 24 * 60 * 60 * 1000,
      // 15mb limit
      maxContentLength: 15 * 1000000,
      responseType: 'arraybuffer',
    })

    request.attempts += 1
    request.status = 'SUCCESS'

    output.info(`Job success ${request.id}`, args)
  } catch (e: any) {
    // TODO: we should output the error somewhere
    output.warn(`Job error ${request.id}: ${e.message}`, args)

    const { retry, attempts = 0 } = _source || request
    const totalAttempts = attempts + 1

    request.status = 'ERROR'
    request.message = e?.message
    request.attempts = 1

    if (request.source !== 'REQUEST' && request.trace && jobs[request.trace]) {
      jobs[request.trace].request.attempts += 1
    }

    if (retry && retry.max >= totalAttempts) {
      const { backoff, time } = retry
      let next = 0

      if (backoff === 'FIXED') {
        next = time || 1
      } else if (backoff === 'EXPONENTIAL') {
        next = totalAttempts ** (time || 1)
      }

      const nextId = scheduleNextJob('RETRY', request, next + now)
      output.info(`Retrying failed job ${request.id} in ${ms(next * 1000)} as ${nextId}`, args)
    }

    response = e?.response
  }

  const responseBody = response?.data ? response.data.toString('base64') : undefined
  request.response = {
    status: response?.status,
    statustext: response?.statusText,
    headers: response?.headers,
    body: responseBody,
    hasbody: !!responseBody,
  }
  const end = Date.now() / 1000
  request.end = end
  request.duration = Math.round((end - start) * 1000) / 1000

  if (source === 'STEP' && step && trace && request.status === 'SUCCESS') {
    await createNextSteps(trace, step)
  }

  return response
}

export function scheduleNextJob (source: 'RETRY'|'SCHEDULE', request: Request, delaytime: number) {
  const id = `${v4()}-iow`
  const now = Date.now() / 1000

  const {
    // Remove delay and delayuntil as its only relevant on the first
    // job - and any additional delay will be provided
    cron,
    interval,
    delay,
    delayuntil,
    retry,
    _source,
    ...rest
  } = request

  const _nextSource = merge({}, {
    cron,
    interval,
    delay,
    delayuntil,
    retry: source === 'RETRY' ? retry : undefined,
  }, _source, { attempts: (_source?.attempts || 0) + 1 })

  jobs[id] = ({
    request: {
      ...rest,
      id,
      start: delaytime > 0 ? delaytime : now,
      received: Date.now() / 1000,
      status: delaytime > 0 ? 'PENDING' : 'ACTIVE',
      source,
      trace: request.source === 'REQUEST' ? request.id : request.trace,
      retry: source === 'SCHEDULE' ? retry : undefined,
      _source: _nextSource,
    },
  })

  return id
}

export function createNextSteps (parentStepId: string, completedStepId: string) {
  const parentStep = jobs[parentStepId]
  if (!parentStep?.request?.steps) return

  const steps = parentStep.request.steps
  steps[completedStepId].complete = 1
  let allStepsCompleted = true

  forEach(steps, (step, stepId) => {
    if (!step.complete) allStepsCompleted = false
    if (!step.complete && !step.started && step.requires?.[completedStepId]) {
      let ready = true
      forEach(step.requires, (_, requiredStepId) => {
        if (steps[requiredStepId].complete !== 1) ready = false
      })
      if (ready) {
        // This will allow the job to be picked up
        steps[stepId].started = 1
      }
    }
  })

  if (allStepsCompleted) {
    parentStep.request.status = 'SUCCESS'
  }
}
