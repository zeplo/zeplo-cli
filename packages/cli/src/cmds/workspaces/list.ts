import { CommandModule } from 'yargs'
import output from '#/helpers/output'

const columns = [{
  name: 'ID',
  key: 'id',
}, {
  name: 'Worksapce',
  key: 'name',
}, {
  name: 'Type',
  key: ({ type }: any) => (type === 'ORGANIZATION' ? 'Organization' : 'User (default)'),
}]

export async function handler (args: any) {
  const list: any = [] // await request(args)
  output.table(columns, list, args)
}

export default {
  command: 'list',
  desc: 'List worksapces',
  handler,
} as CommandModule
