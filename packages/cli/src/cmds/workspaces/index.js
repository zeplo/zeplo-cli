// import yargs from 'yargs'
import list, { handler } from './list'
import create from './create'

export default {
  scriptName: 'zeplo namespaces',
  command: 'namespaces',
  desc: 'Manage namespaces',
  builder: (yargs) => {
    return yargs
      .command(list)
      .command(create)
  },
  handler,
}
