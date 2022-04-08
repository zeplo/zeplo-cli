import { CommandModule } from 'yargs'
import list, { handler } from './list'
import pause from './pause'
import unpause from './unpause'

export default {
  scriptName: 'zeplo requests',
  command: 'requests',
  desc: 'Manage requests',
  builder: (yargs) => {
    return yargs
      .command(list)
      .command(pause)
      .command(unpause)
  },
  handler,
} as CommandModule
