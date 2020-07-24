import { CommandModule } from 'yargs'
import output from '#/helpers/output'
import request from '#/helpers/request'

const columns = [{
  name: 'ID',
  key: 'id',
}, {
  name: 'Worksapce',
  key: 'name',
}]

export async function handler (args: any) {
  const list: any = await request(args, {
    method: 'get',
    url: 'workspaces',
  })

  output.table(columns, list, args)
}

export default {
  command: 'list',
  desc: 'List workspaces',
  handler,
} as CommandModule
