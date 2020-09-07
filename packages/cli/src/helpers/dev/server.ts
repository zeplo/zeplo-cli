import http, { IncomingMessage, ServerResponse } from 'http'
import chalk from 'chalk'
import internalIp from 'internal-ip'
import { size, isString } from 'lodash'
import output from '../output'
import pkg from '../../../package.json'
import bulk from './bulk'
import queue from './queue'
import { resetSavedJobs } from './jobs'
import { parseMessage } from './parse'
import worker from './worker'
import {
  listRequests, getRequestById, pauseRequest, playRequest, getRequestBody, getResponseBody,
} from './requests'
import { getDevPath, setConfig } from '../config'
import createError from './errors'

const HTTP_REGEX = /^\/https?:\/\/[^#.\/]*[.]/
const PATH_REGEX = /^\/[^#.\/]*[.]/
const LOCAL_REGEX = /^\/(https?:\/\/)?localhost/

export default function startServer (args: any) {
  const port = args.p || args.port || 4747
  const workspace = args.w || args.workspace || args.dev || 'default'

  setConfig(getDevPath(args), workspace, { url: `http://localhost:${port}` })

  const server = http.createServer(async function requestHandler (request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Content-Type', 'application/json')
    const send = async (data: any|Promise<any>) => response.end(JSON.stringify(await data))

    try {
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

      if (req.path === '/favicon.ico') {
        response.statusCode = 204
        return response.end()
      }

      const isQueuePath = req.path && (
        HTTP_REGEX.test(req.path) ||
      PATH_REGEX.test(req.path) ||
      LOCAL_REGEX.test(req.path)
      )

      const [_, token] = (args.workspace || 'default').split(':')
      if (token && req.params?._token !== token) {
        throw createError('permission-denied')
      }

      if (isQueuePath) {
        return send(await queue(args, req))
      }

      if (req.path === '/bulk') {
        return send(await bulk(args, req))
      }

      if (req.path === '/requests') {
        const filterParam = isString(req.params?.filters) ? req.params?.filters : null
        const filters = filterParam && JSON.parse(filterParam)
        return send(await listRequests(filters))
      }

      if (req.path === '/requests/reset' && req.method === 'POST') {
        await resetSavedJobs(args, req.params?.hard === '1')
        return send({ status: 'DONE' })
      }

      if (req.path.startsWith('/requests/')) {
        const parts = req.path.substring(1).split('/')
        if (size(parts) === 2 && parts[1] && req.method === 'GET') {
          return send(await getRequestById(parts[1]))
        }
        if (size(parts) === 3 && parts[1] && parts[2] === 'inactive' && ['PATCH', 'POST', 'PUT'].indexOf(req.method) > -1) {
          return send(await pauseRequest(parts[1]))
        }
        if (size(parts) === 3 && parts[1] && parts[2] === 'active' && ['PATCH', 'POST', 'PUT'].indexOf(req.method) > -1) {
          return send(await playRequest(parts[1]))
        }
        if (size(parts) === 3 && parts[1] && parts[2] === 'request.body' && req.method === 'GET') {
          return getRequestBody(parts[1], response)
        }
        if (size(parts) === 3 && parts[1] && parts[2] === 'response.body' && req.method === 'GET') {
          return getResponseBody(parts[1], response)
        }
      }
    } catch (e) {
      if (!e.statusCode) {
        response.statusCode = 500
        return send({ error: { message: 'Internal server error', __dev_error: e.message } })
      }

      response.statusCode = e.statusCode
      return send({ error: { message: e.message, reason: e.reason, code: e.code } })
    }

    response.statusCode = 404
    send({ error: { message: 'Not found' } })
  })

  const stopWorker = worker(args)
  const internalIpAddr = internalIp.v4.sync()

  // server.setTimeout(15 * 60 * 60 * 1000)

  server.listen(port, () => {
    output.space(args)
    output('-----------------------------------------------', args)
    output.space(args)
    output.success(`Ralley DEV queue for ${workspace} workspace is ready!`, args)
    output.space(args)
    output.accent(`${chalk.bold('Local:')}            http://localhost:${port}`, args)
    if (internalIpAddr) output.accent(`${chalk.bold('On your network:')}  http://${internalIp.v4.sync()}:${port}`, args)
    output.space(args)
    output('-----------------------------------------------', args)
  })

  process.on('SIGINT', () => {
    output.info('Stopping server', args)
    server.close()
    setConfig(getDevPath(args), workspace, undefined)
    stopWorker()
    output.info('Successfull exited', args)
  })
}
