import request from './request'
import { addAuthConfig } from '../helpers/config'

const { API_URL = 'https://zeplo.to' } = process.env

export default async function login (args: any, email: string, password?: string, name?: string, skipVerification?: boolean) {
  const userResp = await request(args, {
    baseURL: API_URL,
    url: '/users/login',
    method: 'POST',
    data: {
      name,
      email,
      password,
      skipVerification,
    },
  }, false)

  const token = userResp.token

  await addAuthConfig(args, email, token)

  return token
}
