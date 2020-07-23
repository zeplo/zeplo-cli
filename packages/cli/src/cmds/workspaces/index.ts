import { CommandModule } from 'yargs'
import list, { handler } from './list'
import create from './create'

export default {
  scriptName: 'ralley workpsaces',
  command: 'workpsaces',
  desc: 'Manage workpsaces',
  builder: (yargs) => {
    return yargs
      .command(list)
      .command(create)
  },
  handler,
} as CommandModule
