// import yargs from 'yargs'
import jwt, { handler } from './jwt'

export default {
  command: 'tokens',
  desc: 'Manage tokens',
  builder: (yargs) => {
    return yargs
      .command(jwt)
  },
  handler,
}
