import firebase from '#/config/firebase'
import axios from 'axios'
import { addAuthConfig } from '../helpers/config'
import output from './output'

const { API_URL } = process.env

export default async function login (args: any, email: string, password: string) {
  await firebase?.auth().signInWithEmailAndPassword(email, password)
  const token = await firebase?.auth().currentUser?.getIdToken()

  // Exchange Firebase token for a user token
  const res = await axios({
    baseURL: API_URL,
    url: '/users/me/token',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch((e) => {
    output.error(e.message, args)
    return null
  })

  await addAuthConfig(args, email, res?.data.token)

  return token
}
