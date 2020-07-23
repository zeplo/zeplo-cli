// import yargs from 'yargs'
import request from '../../helpers/graphql'
import output from '../../helpers/output'

const SPACE_QUERY = `
  query {
    spaces {
      id
      name
      type
    }
  }
`

const columns = [{
  name: 'ID',
  key: 'id',
  width: 28,
}, {
  name: 'Namespace',
  key: 'name',
  width: 26,
}, {
  name: 'Type',
  key: ({ type }) => (type === 'ORGANIZATION' ? 'Organization' : 'User (default)'),
}]

export async function handler (args) {
  const list = await request(args, SPACE_QUERY)
  output.table(columns, list.spaces, args)
}

export default {
  command: 'list',
  desc: 'List namespaces',
  handler,
}
