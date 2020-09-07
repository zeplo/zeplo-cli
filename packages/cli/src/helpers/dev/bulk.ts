import { map, isPlainObject, isArray } from 'lodash'
import { RequestRequest } from '#/request'
import queue from './queue'

export default function bulk (args: any, request: RequestRequest) {
  if (!request.body) return []
  const body = Buffer.from(request.body, 'base64').toString('utf8')
  const json = JSON.parse(body)
  return map(json, (req) => {
    // Format string body
    if (req.body) {
      if (!req.headers) req.headers = {}

      if (!req.headers['content-type']) {
        if (isPlainObject(req.body) || isArray(req.body)) req.headers['content-type'] = 'application/json'
        else req.headers['content-type'] = 'text/plain'
      }

      if (isPlainObject(req.body) || isArray(req.body)) {
        req.body = JSON.stringify(req.body)
      }

      req.body = Buffer.from(req.body).toString('base64')
    }

    return queue(args, req)
  })
}
