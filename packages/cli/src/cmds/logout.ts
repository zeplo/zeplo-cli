import { CommandModule } from 'yargs'
import { removeAuthConfig } from '../helpers/config'
import output from '../helpers/output'

async function handler (args: any) {
  await removeAuthConfig(args)

  output.space(args)
  output.success('Logout succes!', args)
  output.space(args)
}

export default {
  command: 'logout',
  desc: 'Logout (and delete user config)',
  handler,
} as CommandModule
