import { ServerResponse } from 'http'
import { merge, map, orderBy } from 'lodash'
import { RequestResponse, RequestRequest } from '#/request'
import { jobs, RequestJob } from './jobs'
import createError from './errors'

export async function getRequestById (requestId: string) {
  const job = await jobs[requestId]
  return formatJob(job)
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

export async function getRequestBody (requestId: string, response: ServerResponse) {
  const job = jobs[requestId]
  if (!job?.request?.request) return null
  return formatBody(job?.request?.request, response)
}

export async function getResponseBody (requestId: string, response: ServerResponse) {
  const job = jobs[requestId]
  if (!job?.request?.response) return null
  return formatBody(job?.request?.response, response)
}

export function formatBody (req: RequestResponse|RequestRequest, response: ServerResponse) {
  if (!req.body) return null
  const buffer = Buffer.from(req?.body, 'base64')
  if (req.headers?.['content-type']) response.setHeader('content-type', req.headers['content-type'])
  response.end(buffer)
}

export function formatJob (job: RequestJob) {
  if (!job || !job.request) return null
  const r = merge({}, job.request)
  if (r?.request?.body) delete r.request.body
  if (r?.response?.body) delete r.response.body
  if (r?._source) delete r._source
  return r
}
