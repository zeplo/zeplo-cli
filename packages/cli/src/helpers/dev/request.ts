import { Method } from 'axios'

export type RequestStatus = 'ACTIVE'|'PENDING'|'ERROR'|'SUCCESS'|'INACTIVE'
export type RequestSource = 'REQUEST'|'SCHEDULE'|'RETRY'

export interface Request extends RequestFeatures {
  /**
   * Unique ID in format <uuidv4>-<3-letter-zone>
   *
   * @minimum 0
   * @TJS-type string
   */
  id: string
  key: string
  trace?: string
  workspace: string
  status: RequestStatus
  source: RequestSource
  message?: string
  // TODO: needs to be added
  received: number
  start: number
  end: number
  duration: number
  env?: string
  request: RequestRequest
  response?: RequestResponse
  ignored?: boolean
  _source: RequestFeatures
}

export interface RequestRequest {
  method: Method
  url: string
  headers?: { [key: string]: string|string[] }
  scheme: 'http' | 'https'
  host: string
  path: string
  // TODO: how does router handle this?
  params?: { [key: string]: string|string[]|null|undefined }
  body?: string
  hasbody?: boolean
}

export interface RequestResponse {
  status: number
  statusText: string
  headers: any
  body?: any
  start?: number
  end?: number
  hasbody?: boolean
}

export interface RequestFeatures {
  retry?: RequestRetry
  delay?: number
  delayuntil?: number
  interval?: number
  cron?: string[][]
  attempts: number
  timezone?: string
}

export type RequestRetryBackoff = 'FIXED'|'EXPONENTIAL'|'IMMEDIATE'

export interface RequestRetry {
  max: number
  backoff: RequestRetryBackoff
  time?: number
}
