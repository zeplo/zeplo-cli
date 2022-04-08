import { CommandModule } from 'yargs'
import output from '#/helpers/output'
import requestWithAuth from '#/helpers/request'

export async function handler (args: any) {
  const requestId = args.request

  const res = await requestWithAuth(args, {
    method: 'PATCH',
    url: `/requests/${requestId}/inactive`,
  })

  if (res) {
    output.success(`Successfully paused ${res.id}`, args)
  }
}

export default {
  command: 'pause <id>',
  desc: 'Pause requests (make INACTIVE)',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('id', {
        describe: 'ID of request to pause',
      })
  },
} as CommandModule
