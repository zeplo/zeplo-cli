import { ServerResponse } from 'http'
import { merge, map, orderBy, every, filter, toString, get, forEach } from 'lodash'
import { RequestResponse, RequestRequest } from '#/request'
import { jobs, RequestJob } from './jobs'
import createError from './errors'

export async function getRequestById (requestId: string) {
  const job = await jobs[requestId]

  if (!job) throw createError('not-found')

  return formatJob(job)
}

export async function listRequests (filters: null|Record<string, string>) {
  let list = map(jobs, formatJob)
  if (filters) {
    list = filter(list, (req: any) => !!req &&
      (every(filters, (val, key) => get(req, key) && toString(get(req, key)) === toString(val))))
  }
  return orderBy(list, ['start'], ['desc'])
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
  delete job.cursor

  const requests = await listRequests({ trace: requestId, status: 'PENDING' })
  forEach(requests, (request) => {
    if (!request?.id) return
    jobs[request.id].request.status = 'INACTIVE'
  })

  return formatJob(job)
}

export async function playRequest (requestId: string) {
  const job = jobs[requestId]

  // Validate
  if (!job) throw createError('not-found')
  if (job.request.status !== 'INACTIVE') throw createError('requests/invalid-state')

  job.request.status = 'PENDING'
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
  if (r?.request?.body !== undefined) delete r.request.body
  if (r?.response?.body !== undefined) delete r.response.body
  if (r?._source) delete r._source
  return r
}
