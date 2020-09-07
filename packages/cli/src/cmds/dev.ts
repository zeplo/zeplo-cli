import { CommandModule } from 'yargs'
import startServer from '#/helpers/dev/server'

export async function handler (args: any) {
  startServer(args)
}

export default {
  command: 'dev',
  desc: 'Start dev queue server',
  builder: (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        describe: 'Port to serve queue',
      })
      .option('retain', {
        describe: 'Retain request log (0 = no retain)',
        default: '7d',
      })
      .option('pollInterval', {
        describe: 'Determines the frequency of job loop',
        hidden: true,
      })
  },
  handler,
} as CommandModule
