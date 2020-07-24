import { CommandModule } from 'yargs'
import startServer from '../helpers/dev/server'

async function handler (args: any) {
  startServer(args)
}

export default {
  command: 'dev',
  desc: 'Start a queue server for dev',
  builder: (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        describe: 'Port to serve queue',
      })
  },
  handler,
} as CommandModule
