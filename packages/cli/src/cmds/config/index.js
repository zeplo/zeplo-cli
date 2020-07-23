// import yargs from 'yargs'
import get from './get'
import set from './set'

export default {
  command: 'config',
  desc: 'Configure CLI',
  builder: (yargs) => {
    return yargs
      .command(set)
      .command(get)
  },
}
