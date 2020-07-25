import { CommandModule } from 'yargs'
import list, { handler } from './list'
import pause from './pause'

export default {
  scriptName: 'ralley requests',
  command: 'requests',
  desc: 'Manage requests',
  builder: (yargs) => {
    return yargs
      .command(list)
      .command(pause)
  },
  handler,
} as CommandModule
