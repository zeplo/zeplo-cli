import { GraphQLClient } from 'graphql-request'
import getAuth from './auth'

const { EXTERNAL_CORE_ENDPOINT } = process.env

export default async function graphqlRequest (args, query, variables, requireAuth = true) {
  const token = await getAuth(args, requireAuth)
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const endpoint = args.endpoint || EXTERNAL_CORE_ENDPOINT

  const client = new GraphQLClient(`${endpoint}/v1/graphql`, { headers })
  return client.request(query, variables)
}
