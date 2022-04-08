import { CommandModule } from 'yargs'
import get, { handler } from './get'
import set from './set'

export default {
  command: 'config',
  desc: 'Configure CLI',
  builder: (yargs) => {
    return yargs
      .command(set)
      .command(get)
  },
  handler,
} as CommandModule
