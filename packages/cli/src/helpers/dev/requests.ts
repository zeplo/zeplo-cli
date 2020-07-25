import { merge, map, orderBy } from 'lodash'
import { jobs, RequestJob } from './jobs'
import createError from './errors'

export async function getRequestById (requestId: string) {
  const job = await jobs[requestId]
  return formatJob(merge({}, job))
}

export async function listRequests () {
  return orderBy(map(jobs, formatJob), ['start'], ['desc'])
    .slice(0, 30)
}

export async function pauseRequest (requestId: string) {
  const job = jobs[requestId]

  // Validate
  if (!job) throw createError('not-found')

  const validState = job.request.status === 'PENDING' || (
    job.request.status === 'ACTIVE' && job.request.source === 'REQUEST' &&
    (job.request.cron || job.request.interval)
  )
  if (!validState) throw createError('requests/invalid-state')

  job.request.status = 'INACTIVE'

  return formatJob(job)
}

export async function playRequest (requestId: string) {
  const job = jobs[requestId]

  // Validate
  if (!job) throw createError('not-found')
  if (job.request.status !== 'INACTIVE') throw createError('requests/invalid-state')

  job.request.status = 'INACTIVE'
  job.request.start = Date.now() / 1000

  return formatJob(job)
}

export function formatJob (job: RequestJob) {
  if (!job) return null
  const r = merge({}, job.request)
  delete r.request.body
  delete r._source
  return r
}
