import axios, { AxiosRequestConfig, AxiosError, AxiosRequestHeaders } from 'axios'
import getAuth, { AUTH_MSG } from './auth'
import output from './output'
import { getDevUrl } from './dev/config'

const { API_URL } = process.env

export default async function requestWithAuth (args: any, config: AxiosRequestConfig, requireAuth = true, captureError = true) {
  const token = await getAuth(args, requireAuth && !args.dev)

  const edev = await getDevUrl(args)
  const endpoint = args.endpoint || args.e || edev || API_URL
  const headers: AxiosRequestHeaders = config.headers || {}
  if (token) {
    headers['X-Zeplo-Token'] = token
  }

  const reqObj = {
    responseType: 'json',
    ...config,
    baseURL: endpoint,
    headers,
  } as AxiosRequestConfig

  const resp = await axios(reqObj).catch((err: AxiosError) => {
    if (!captureError) throw err
    if (err.response?.status === 401) {
      output.error('Invalid credentials, please login agiain', args, false)
      output(AUTH_MSG, args)
      process.exit(1)
    }
    output.error(err.message, args)
    return null
  })

  return resp?.data
}
