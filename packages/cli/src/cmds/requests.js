import graphql from '../helpers/graphql'
import output from '../helpers/output'

export const InstanceQuery = `
  query InstanceQuery ($instanceId: ID!) {
    instance (where: { id: $instanceId }) {
      id
      log
    }
  }
`

async function handler (args) {
  const resp = await graphql(args, InstanceQuery, { instanceId: args.instanceId })
  const logs = resp.instance && resp.instance.log

  output(logs && logs.map(({ message }) => message).join(''))
}

export default {
  command: 'logs <instanceId>',
  desc: 'Logs for a specific request',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('instanceId', {
        describe: 'ID for the instance',
      })
  },
}
