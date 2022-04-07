import { map, isPlainObject, isArray } from 'lodash'
import { Request } from 'express'
import { queue } from './queue'

export function bulkHandler (args: any, request: Request): { id: string }[] {
  if (!request.body) return []

  return map(request.body, (request) => {
    return queue(args, request)
  })
}
