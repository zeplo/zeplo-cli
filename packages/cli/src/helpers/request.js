import request from 'request-promise-native'
import getAuth from './auth'

const { EXTERNAL_CORE_ENDPOINT } = process.env

export default async function requestRest (args, req, requireAuth = true) {
  const token = await getAuth(args, requireAuth)

  const endpoint = args.endpoint || EXTERNAL_CORE_ENDPOINT

  const reqObj = {
    baseUrl: `${endpoint}/v1`,
    json: true,
    auth: requireAuth && token && {
      bearer: token,
    },
    ...req,
  }

  const resp = await request(reqObj)

  return resp.data
}
