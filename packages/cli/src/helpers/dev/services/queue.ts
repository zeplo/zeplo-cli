import { v4 } from 'uuid'
import ms from 'ms'
import { Request } from 'express'
import { parseRequest } from '@zeplo/util'
// import { parseRequest, getDelayFromOptions } from './parse'
import { jobs } from './jobs'
import output from '../../output'
import { getWorkspace } from './workspace'

export function queue (args: any, request: Request): { id: string } {
  const id = `${v4()}-iow`

  // TODO: should we get args from prop OR from a token?
  const workspace = getWorkspace(args)

  const url = request.url.startsWith('/') ? request.url.substring(1) : request.url
  const req = parseRequest(id, workspace, request, url)

  const delay = req.delayuntil ?? 0

  jobs[id] = ({
    request: req,
  })

  const delaystr = delay > req.received ? `with delay of ${ms((delay - req.received) * 1000)}` : ''
  output.info(`Received request ${id} ${delaystr}`, args)

  return { id }
}
