import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import { isString } from 'lodash'
import chalk from 'chalk'
import getAuth, { AUTH_MSG } from './auth'
import { getDevPath, getConfig } from './config'
import output from './output'

const { API_URL } = process.env

export default async function requestWithAuth (args: any, config: AxiosRequestConfig, requireAuth = true, captureError = true) {
  const token = await getAuth(args, requireAuth && !args.dev)

  if (args.dev) {
    const workspace = isString(args.dev) ? args.dev : args.workspace || args.w || 'default'
    const url = await getConfig(getDevPath(args), `${workspace}.url`)
    if (!url) {
      output.error(`Dev server "${workspace}" is not running. 

      ${chalk.white(`Use $ ${chalk.cyan(`ralley dev -w ${workspace}`)}`)}
    `, args)
    }
  }

  const edev = args.dev &&
    ((await getConfig(
      getDevPath(args),
      `${isString(args.dev) ? args.dev : 'default'}.url`)
    ) || 'http://localhost:4747')
  const endpoint = args.endpoint || args.e || edev || API_URL

  const reqObj = {
    ...config,
    baseURL: endpoint,
    headers: {
      'X-Ralley-Token': token,
    },
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
