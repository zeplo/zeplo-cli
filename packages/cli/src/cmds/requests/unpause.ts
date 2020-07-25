import { CommandModule } from 'yargs'
import output from '#/helpers/output'
import requestWithAuth from '#/helpers/request'

export async function handler (args: any) {
  const requestId = args.request

  const res = await requestWithAuth(args, {
    method: 'PATCH',
    url: `/requests/${requestId}/active`,
  })

  if (res) {
    output.success(`Successfully unpaused ${res.id}`, args)
  }
}

export default {
  command: 'unpause <id>',
  desc: 'Unpause requests (make ACTIVE)',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('id', {
        describe: 'ID of request to unpause',
      })
  },
} as CommandModule
