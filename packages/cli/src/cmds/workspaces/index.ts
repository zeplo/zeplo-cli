import { CommandModule } from 'yargs'
import list, { handler } from './list'
import create from './create'

export default {
  scriptName: 'ralley workspaces',
  command: 'workspaces',
  desc: 'Manage workspaces',
  builder: (yargs) => {
    return yargs
      .command(list)
      .command(create)
  },
  handler,
} as CommandModule
