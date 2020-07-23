import { CommandModule } from 'yargs'
import request from '../../helpers/request'
import output from '../../helpers/output'
import { setBasicConfig } from '../../helpers/config'

export async function handler (args: any) {
  const space = await request(args, {
    method: 'POST',
    url: '/spaces',
    data: {
      name: args.name,
    },
  })

  if (args.default) {
    await setBasicConfig(args, 'user.defaultSpace', space.id)
  }

  output.success(`Created space: ${space.name}`, args)
  // output.block(createTable(columns, tasks))
}

export default {
  command: 'create [name]',
  desc: 'Create a new workspace',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('name', {
        describe: 'name of the new space',
      })
      .option('default', {
        alias: 'd',
        describe: 'Set the new space as the default',
      })
  },
} as CommandModule
