import http, { IncomingMessage, ServerResponse } from 'http'
import chalk from 'chalk'
import internalIp from 'internal-ip'
import output from '../output'
import pkg from '../../../package.json'
import bulk from './bulk'
import queue from './queue'
import { parseMessage } from './parse'
import worker from './worker'

const HTTP_REGEX = /^\/https?:\/\/[^#.\/]*[.]/
const PATH_REGEX = /^\/[^#.\/]*[.]/
const LOCAL_REGEX = /^\/(https?:\/\/)?localhost/

export default function startServer (args: any) {
  const port = args.p || args.port || 4747

  const server = http.createServer(async function requestHandler (request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Content-Type', 'application/json')
    const send = (obj: any) => response.end(JSON.stringify(obj))

    const req = await parseMessage(request)

    if (req.path === '/') {
      send({
        url: 'https://ralley.io',
        name: 'Ralley',
        version: pkg.version,
        env: process.env.NODE_ENV || 'development',
      })
      return
    }

    const isQueuePath = req.path && (
      HTTP_REGEX.test(req.path) ||
      PATH_REGEX.test(req.path) ||
      LOCAL_REGEX.test(req.path)
    )

    if (isQueuePath) {
      return send(queue(args, req))
    }

    if (req.path === '/bulk') {
      return send(bulk(args, req))
    }

    response.statusCode = 404
    response.end(JSON.stringify({
      error: { message: 'Not found' },
    }))
  })

  const stopWorker = worker(args)

  server.listen(port, () => {
    output.space(args)
    output('-----------------------------------------------', args)
    output.space(args)
    output.success('Ralley DEV queue is ready!', args)
    output.space(args)
    output.accent(`${chalk.bold('Local:')}            http://localhost:${port}`, args)
    output.accent(`${chalk.bold('On your network:')}  http://${internalIp.v4.sync()}:${port}`, args)
    output.space(args)
    output('-----------------------------------------------', args)
  })

  server.on('close', () => {
    stopWorker()
  })
}
