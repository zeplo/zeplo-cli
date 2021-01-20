import { Method } from 'axios'
import { URL } from 'url'
import { size, toNumber, isObject, merge, isPlainObject, isArray } from 'lodash'
import { IncomingMessage } from 'http'
import queryString from 'query-string'
import { Request, RequestRequest } from '#/request'

export async function parseMessage (request: IncomingMessage): Promise<RequestRequest> {
  const queryPos = request.url?.indexOf('?') || -1
  const path = queryPos > -1 ? request?.url?.substring(0, queryPos) || '/' : request.url || '/'
  const query = queryPos > -1 ? queryString.parseUrl(request?.url?.substring(queryPos) || '') : null

  return {
    method: (request.method || 'post').toUpperCase() as Method,
    url: request.url || '/',
    headers: (request.headers || {}) as any,
    scheme: 'http',
    host: 'test',
    path,
    params: query?.query || {},
    body: await getBody(request),
  }
}

export async function getBody (request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const body: any[] = []
    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      const buffer = Buffer.concat(body)
      resolve(buffer.toString('base64'))
    })
  })
}

export function parseRequest (id: string, workspace: string, request: RequestRequest) {
  let fullUrl = request.url
  if (!fullUrl.startsWith('http')) {
    fullUrl = `https://${fullUrl}`
  }

  const parsedUrl = new URL(fullUrl)
  const mergedParams = merge({}, queryString.parseUrl(fullUrl).query, request.params)
  const options = getRawOptionsFromHeaderAndParams(request.headers || {}, mergedParams)
  const format = formatRawOptions(options)
  const received = Date.now() / 1000
  const delay = getDelayFromOptions(options, received)

  const headers = cleanHeaders(request.headers || {})
  const params = cleanParams(mergedParams, request.headers || {})
  const modUrl = queryString.parseUrl(fullUrl, { parseFragmentIdentifier: true })
  const method = request.method || 'POST'

  // Normalize request body
  if (request.body) {
    request.hasbody = true
  }

  return {
    id,
    status: 'PENDING',
    workspace,
    source: 'REQUEST',
    request: {
      ...request,
      method,
      headers,
      params,
      url: queryString.stringifyUrl({
        url: modUrl.url,
        query: params,
        fragmentIdentifier: modUrl.fragmentIdentifier,
      }),
      host: parsedUrl.host,
      scheme: parsedUrl.protocol.replace(':', ''),
      path: parsedUrl.pathname,
    },
    start: delay > 0 ? delay : received,
    received: received,
    attempts: 0,
    ...format,
  } as Request
}

export function getRawOptionsFromHeaderAndParams (headers?: any, params?: any) {
  let p = params
  if (headers['x-zeplo-no-conflict']) {
    p = {}
  }
  return {
    key: headers['x-zeplo-key'] || p._key || 'default',
    delay: headers['x-zeplo-delay'] || p._delay,
    delayuntil: headers['x-zeplo-delay-until'] || p._delay_until,
    retry: headers['x-zeplo-retry'] || p._retry,
    interval: headers['x-zeplo-interval'] || p._interval,
    cron: headers['x-zeplo-cron'] || p._cron,
    throttle: headers['x-zeplo-throttle'] || p._throttle,
    timezone: headers['x-zeplo-timezone'] || p._timezone,
    trace: headers['x-zeplo-trace'] || p._trace,
    env: headers['x-zeplo-env'] || p._env,
  }
}

export function getDelayFromOptions (options: any, start: number): number {
  if (options.delayuntil) return options.delayuntil
  if (options.delay) return options.delay + start
  return 0
}

export function formatRawOptions (options: any) {
  if (options.delayuntil) {
    options.delayuntil = toNumber(options.delayuntil)
  }

  if (options.delay) {
    options.delay = toNumber(options.delay)
  }

  if (options.retry) {
    // TODO: will this work with null params?
    const [max = 1, backoff = 'FIXED', time = 1] = (options.retry || '').split('|')
    const parsedMax = parseInt(max, 10)
    const parsedTime = parseInt(time, 10)
    options.retry = {
      max: isNaN(parsedMax) ? 1 : parsedMax,
      backoff: backoff ? backoff.toUpperCase() : 'FIXED',
      time: isNaN(parsedTime) ? 1 : parsedTime,
    }
    if (['FIXED', 'IMMEDIATE', 'EXPONENTIAL'].indexOf(options.retry.backoff) === -1) {
      options.retry.backoff = 'FIXED'
    }
  }

  if (options.cron) {
    options.cron = options.cron.split(',').map((c: string) => c.split(/[| ]/))
  }

  if (options.interval) {
    options.interval = toNumber(options.interval)
  }

  return options
}

export function cleanParams (params?: any, headers?: any) {
  if (!params) return params
  if (headers?.['x-zeplo-no-conflict'] === '1') return params
  delete params._key
  delete params._delay
  delete params._delay_until
  delete params._retry
  delete params._interval
  delete params._cron
  delete params._throttle
  delete params._timezone
  delete params._trace
  delete params._token
  delete params._env
  if (!size(params)) return undefined
  return params
}

export function cleanHeaders (headers: any) {
  delete headers.host
  delete headers['x-zeplo-key']
  delete headers['x-zeplo-delay']
  delete headers['x-zeplo-delay-until']
  delete headers['x-zeplo-retry']
  delete headers['x-zeplo-interval']
  delete headers['x-zeplo-cron']
  delete headers['x-zeplo-throttle']
  delete headers['x-zeplo-timezone']
  delete headers['x-zeplo-trace']
  delete headers['x-zeplo-token']
  delete headers['x-zeplo-env']

  delete headers.connection
  delete headers.forwarded
  delete headers['x-forwarded-proto']
  delete headers['accept-encoding']

  if (!size(headers)) return undefined
  return headers
}
