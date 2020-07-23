import { CommandModule } from 'yargs'
import output from '../helpers/output'

async function handler (args: any) {
  // output(logs && logs.map(({ message }) => message).join(''))
}

export default {
  command: 'requests',
  desc: 'Log of queued requests',
  handler,
} as CommandModule
