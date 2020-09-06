import { v4 } from 'uuid'
import ms from 'ms'
import { RequestRequest } from '#/request'
import { parseRequest, getDelayFromOptions } from './parse'
import { jobs } from './jobs'
import output from '../output'

export default function queue (args: any, request: RequestRequest) {
  const id = `${v4()}-iow`

  // TODO: should we get args from prop OR from a token?
  const [workspace] = (args.workspace || args.dev || 'default').split(':')

  const req = parseRequest(id, workspace, {
    ...request,
    // Remove the leading slash
    url: request.url.startsWith('/') ? request.url.substring(1) : request.url,
  })

  const delay = getDelayFromOptions(req, req.received)

  jobs[id] = ({
    delay,
    request: req,
  })

  const delaystr = delay > 0 ? `with delay of ${ms((delay - req.received) * 1000)}` : ''
  output.info(`Received request ${id} ${delaystr}`, args)

  return { id }
}
