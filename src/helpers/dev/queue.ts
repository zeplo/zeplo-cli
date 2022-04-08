import { Router } from 'express'
import bodyParser from 'body-parser'
// import contentType from 'content-type'
import expressAsyncHandler from 'express-async-handler'
import getRawBody from 'raw-body'
import { jsonRequestHandler } from '@zeplo/util'
import { queue } from './services/queue'
import { bulkHandler } from './services/bulk'
import { stepHandler } from './services/steps'

export function queueRouter (args: any) {
  const router = Router()

  router.use(expressAsyncHandler(async (req, res, next) => {
    const isPushUrl = /^\/https?:\/[^#./]*./.test(req.path) || /^\/[^#./]*\./.test(req.path)
    if (isPushUrl) {
      req.body = await getRawBody(req, {
        limit: '15mb',
        length: req.headers['content-length'],
        // encoding: contentType.parse(req).parameters.charset,
      })
      const json = await queue(args, req)
      res.json(json)
    } else {
      next()
    }
  }))

  router.all('/bulk', bodyParser.json({ limit: '15mb' }), jsonRequestHandler(async (req) => bulkHandler(args, req)))
  router.all('/step', bodyParser.json({ limit: '15mb' }), jsonRequestHandler(async (req) => stepHandler(args, req)))

  return router
}

export default queueRouter
