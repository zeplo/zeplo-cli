import { map } from 'lodash'
import { RequestRequest } from '#/request'
import queue from './queue'

export default function bulk (args: any, request: RequestRequest) {
  const body = Buffer.from(request.body || '', 'base64').toString('utf8')
  const json = JSON.parse(body)
  return map(json, (req) => queue(args, req))
}
