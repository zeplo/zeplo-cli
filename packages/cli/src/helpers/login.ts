import firebase from '#/config/firebase'
import request from './request'
import { addAuthConfig } from '../helpers/config'
import output from './output'

const { API_URL } = process.env

export default async function login (args: any, email: string, password: string) {
  await firebase?.auth().signInWithEmailAndPassword(email, password)
  const token = await firebase?.auth().currentUser?.getIdToken()

  // Exchange Firebase token for a user token
  const data = await request(args, {
    baseURL: API_URL,
    url: '/users/me/token',
    method: 'GET',
    responseType: 'json',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }, false, false).catch((e) => {
    output.error(e.message, args)
    process.exit(1)
  })

  await addAuthConfig(args, email, data.token)

  return token
}
