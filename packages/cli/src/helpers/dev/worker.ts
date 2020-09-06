import axios from 'axios'
import { v4 } from 'uuid'
import { merge, map } from 'lodash'
import ms from 'ms'
import { jobs, saveJobs, loadSavedJobs } from './jobs'
import { Request } from '#/request'
import { getNextSchedule } from './util'
import output from '../output'
import pkg from '../../../package.json'

let timer: NodeJS.Timeout|null = null

export default function worker (args: any) {
  loadSavedJobs(args).then(() => {
    timer = setTimeout(() => { tick(args) }, 1000)
  })
  return async () => {
    output.info('Closing queue and persisting jobs', args)
    if (timer) clearTimeout(timer)
    await saveJobs(args)
  }
}

export async function tick (args: any) {
  const now = Date.now() / 1000
  const retain: string = args.retain || args.r || '7d'
  const retainFor = ms(retain) / 1000

  map(jobs, (job, jobId) => {
    if (job.delay && job.delay > now) return

    // Delete expired successful jobs
    if ((job.request.status === 'ERROR' ||
         job.request.status === 'SUCCESS') &&
         job.request.end &&
        (job.request.end + retainFor) < now
    ) {
      delete jobs[jobId]
    }

    if (job.request.status !== 'PENDING') return

    return process(args, job.request).catch((e) => {
      output.error(e.message, args, false)
    }).then(() => {
      // if (args.retain === '0' || args.r === '0' || ms(retain) === 0) {
      //   delete jobs[jobId]
      // }
    })
  })

  await saveJobs(args)
  timer = setTimeout(() => { tick(args) }, 1000)
}

export async function process (args: any, request: Request) {
  output.info(`Processing request ${request.id} ${request.trace ? `for ${request.trace}` : ''}`, args)
  request.status = 'ACTIVE'

  const { id, start, trace, source, _source } = request
  const { url, method, headers, body } = request.request
  const { cron, interval } = _source || request
  const now = Date.now() / 1000

  if ((cron || interval) && start) {
    const next = getNextSchedule(request)
    if (next) {
      const nextId = scheduleNextJob(request, 'SCHEDULE', next)
      const parentId = source === 'REQUEST' ? id : trace
      output.info(`Scheduling next job for ${parentId} in ${ms((next - start) * 1000)} as ${nextId}`, args)
    }

    if (source === 'REQUEST') return
  }

  let response
  try {
    response = await axios({
      url,
      method,
      headers: {
        'User-Agent': `${pkg.name}@${pkg.version}`,
        ...headers,
        'X-Ralley-Start': now,
        'X-Ralley-Id': request.id,
      },
      // params,
      data: body ? Buffer.from(body, 'base64') : undefined,
      // Timeout after 24 hours
      timeout: 24 * 60 * 60 * 1000,
      // 15mb limit
      maxContentLength: 15 * 1000000,
      responseType: 'arraybuffer',
    })

    request.status = 'SUCCESS'

    output.info(`Job success ${request.id}`, args)
  } catch (e) {
    // TODO: we should output the error somewhere
    output.warn(`Job error ${request.id}: ${e.message}`, args)
    request.status = 'ERROR'

    if (request.retry && request.retry.max < (request._source?.attempts || 0)) {
      const { backoff, time } = request.retry
      let next = 0
      if (backoff === 'FIXED') {
        next = time || 1
      } else if (backoff === 'EXPONENTIAL') {
        next = ((request._source?.attempts || 0) ** (time || 1))
      }

      const nextId = scheduleNextJob(request, 'RETRY', next + now)
      output.info(`Retrying failed job ${request.id} in ${ms(next * 1000)} as ${nextId}`, args)
    }

    response = e.response
  }

  const responseBody = response?.data ? response.data.toString('base64') : undefined
  request.response = {
    status: response?.status,
    statusText: response?.statusText,
    headers: response?.headers,
    body: responseBody,
    hasbody: !!responseBody,
  }
  const end = Date.now() / 1000
  request.end = end
  request.duration = Math.round((end - start) * 1000) / 1000

  return response
}

export function scheduleNextJob (request: Request, source: 'RETRY'|'SCHEDULE', delaytime: number) {
  const id = `${v4()}-iow`
  const now = Date.now() / 1000

  const {
    // Remove delay and delayuntil as its only relevant on the first
    // job - and any additional delay will be provided
    cron,
    interval,
    delay,
    delayuntil,
    _source,
    ...rest
  } = request

  const _nextSource = merge({}, {
    cron,
    interval,
    delay,
    delayuntil,
  }, _source, { attempts: (request?._source?.attempts || 0) + 1 })

  jobs[id] = ({
    delay: delaytime,
    request: {
      ...rest,
      id,
      start: delaytime > 0 ? delaytime : now,
      received: Date.now() / 1000,
      status: delaytime > 0 ? 'PENDING' : 'ACTIVE',
      source,
      trace: request.source === 'REQUEST' ? request.id : request.trace,
      _source: _nextSource, // { attempts: (request?._source?.attempts || 0) + 1 },
    },
  })

  return id
}
