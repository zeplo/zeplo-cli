import chalk from 'chalk'
import handleError from './errors'
import { getAuthConfig } from './config'
import { AuthArgs } from '../types'

export const AUTH_MSG = `
  Use ${chalk.cyanBright('$ ralley login')} to login
  Or ${chalk.cyanBright('$ ralley signup')} to create a new account
`

export const NO_TOKEN_MSG = `
  ${chalk.red('No authentication token')}
${AUTH_MSG}
`

export default async function getAuth (args: AuthArgs, requireAuth = true) {
  let token = args.t || args.token

  if (!token) {
    // TODO: Get token from the cache
    const auth = await getAuthConfig(args)
    if (auth && auth.defaultAuth) {
      // eslint-disable-next-line
      token = auth.credentials[auth.defaultAuth].token
    }
  }

  if (!token && requireAuth) {
    handleError(NO_TOKEN_MSG)
  }

  return token
}
