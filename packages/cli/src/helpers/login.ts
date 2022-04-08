import request from './request'
import { addAuthConfig } from '../helpers/config'
import output from './output'

const { API_URL = 'https://zeplo.to' } = process.env

export default async function login (args: any, email: string, password: string) {
  const userResp = await request(args, {
    baseURL: API_URL,
    url: '/users/login',
    method: 'POST',
    data: {
      email,
      password,
    },
  }, false)

  const token = userResp.data?.token

  // Exchange Firebase token for a user token
  // const data = await request(args, {
  //   baseURL: API_URL,
  //   url: '/users/me/token',
  //   method: 'GET',
  //   responseType: 'json',
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // }, false, false).catch((e) => {
  //   output.error(e.message, args)
  //   process.exit(1)
  // })

  await addAuthConfig(args, email, token)

  return token
}
