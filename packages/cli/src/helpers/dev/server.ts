import http, { IncomingMessage, ServerResponse } from 'http'
import chalk from 'chalk'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { createError, ApiError } from '@zeplo/errors'
import internalIp from 'internal-ip'
import output from '../output'
import pkg, { name, version } from '../../../package.json'
import worker from './services/worker'
import { getDevPath, setConfig } from '../config'
import queueRouter from './queue'
import requestRouter from './requests'

// const HTTP_REGEX = /^\/https?:\/\/[^#.\/]*[.]/
// const PATH_REGEX = /^\/[^#.\/]*[.]/
// const LOCAL_REGEX = /^\/(https?:\/\/)?localhost/

export default async function startServer (args: any) {
  const port = args.p || args.port || 4747
  const workspace = args.w || args.workspace || args.dev || 'default'

  setConfig(getDevPath(args), workspace, { url: `http://localhost:${port}` })

  const app = express()

  app.use(cors({
    allowedHeaders: '*',
  }))

  app.get('/', (req, res) => {
    res.send({
      version,
      name,
      host: process.env.HOSTNAME,
      date: new Date(),
    })
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendStatus(204)
  })

  app.use(queueRouter(args))
  app.use(requestRouter(args))

  // Error handler
  app.use((originalError: any, req: Request, res: Response, next: NextFunction) => {
    let error: ApiError = originalError

    if (!(error instanceof ApiError)) {
      error = createError('server-error', {
        originalError: error,
      })
    }

    console.log(error.toJSON())

    const {
      code, message, data, reason, statusCode,
    } = error?.toJSON() ?? {}

    const out = {
      error: {
        code,
        message,
        data,
        reason,
      },
    }

    res.status(statusCode ?? 500).json(out)
  })

  const stopWorker = worker(args)
  const internalIpAddr = internalIp.v4.sync()

  // server.setTimeout(15 * 60 * 60 * 1000)
  const server = http.createServer(app)
  server.listen(port, () => {
    output.space(args)
    output('-----------------------------------------------', args)
    output.space(args)
    output.success(`Zeplo DEV queue for ${workspace} workspace is ready!`, args)
    output.space(args)
    output.accent(`${chalk.bold('Local:')}            http://localhost:${port}`, args)
    if (internalIpAddr) output.accent(`${chalk.bold('On your network:')}  http://${internalIpAddr}:${port}`, args)
    output.space(args)
    output('-----------------------------------------------', args)
  })

  process.on('SIGINT', () => {
    output.info('Stopping server', args)
    server.close()
    setConfig(getDevPath(args), workspace, undefined)
    stopWorker().then(() => {
      output.info('Successfull exited', args)
    })
  })
}
