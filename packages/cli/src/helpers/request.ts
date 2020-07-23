import axios, { AxiosRequestConfig } from 'axios'
// import { Arguments } from 'yargs'
import getAuth from './auth'

const { API_URL } = process.env

export default async function requestWithAuth (args: any, config: AxiosRequestConfig, requireAuth = true) {
  const token = await getAuth(args, requireAuth)

  const endpoint = args.endpoint || API_URL

  const reqObj = {
    ...config,
    baseURL: endpoint,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  } as AxiosRequestConfig

  const resp = await axios(reqObj)

  return resp.data
}
