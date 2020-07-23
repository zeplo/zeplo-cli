import { removeAuthConfig } from '../helpers/config'
import output from '../helpers/output'

async function handler (args) {
  await removeAuthConfig(args)

  output.space(args)
  output.success('Logout succes!')
  output.space(args)
}

export default {
  command: 'logout',
  desc: 'Logout (and delete user config)',
  handler,
}
