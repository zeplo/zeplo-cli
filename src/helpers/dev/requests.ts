import { jsonRequestHandler } from '@zeplo/util'
import { Router, Request } from 'express'
import { isString } from 'lodash'
import {
  listRequests, getRequestById, pauseRequest, playRequest, getRequestBody, getResponseBody,
} from './services/requests'
import { resetSavedJobs } from './services/jobs'

export function requestRouter (args: any) {
  const router = Router()

  router.get('/requests', jsonRequestHandler(async (req: Request) => {
    const filterParam = isString(req.query?.filters) ? req.query?.filters : null
    const filters = filterParam && JSON.parse(filterParam)
    return listRequests(filters)
  }))

  router.post('/requests/reset', jsonRequestHandler(async (req) => {
    await resetSavedJobs(args, req.params?.hard === '1')
    return { status: 'OK' }
  }))

  router.get('/requests/:requestId', jsonRequestHandler(async (req) => {
    return getRequestById(req.params.requestId)
  }))

  router.patch('/requests/:requestId/inactive', jsonRequestHandler((req) => pauseRequest(req.params.requestId)))
  router.post('/requests/:requestId/inactive', jsonRequestHandler((req) => pauseRequest(req.params.requestId)))
  router.put('/requests/:requestId/inactive', jsonRequestHandler((req) => pauseRequest(req.params.requestId)))

  router.patch('/requests/:requestId/active', jsonRequestHandler((req) => playRequest(req.params.requestId)))
  router.post('/requests/:requestId/active', jsonRequestHandler((req) => playRequest(req.params.requestId)))
  router.put('/requests/:requestId/active', jsonRequestHandler((req) => playRequest(req.params.requestId)))

  router.get('/requests/:requestId/request.body', (req, res) => getRequestBody(req.params.requestId, res))
  router.get('/requests/:requestId/response.body', (req, res) => getResponseBody(req.params.requestId, res))

  return router
}

export default requestRouter
