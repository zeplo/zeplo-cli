import { CommandModule } from 'yargs'
import moment from 'moment'
import ms from 'ms'
import output from '#/helpers/output'
import request from '#/helpers/request'
import { Request } from '#/request'

const columns = [{
  name: 'ID',
  key: 'id',
}, {
  name: 'Status',
  key: 'status',
}, {
  name: 'Source',
  key: 'source',
}, {
  name: 'Features',
  key: ({ delay, delayuntil, cron, interval, retry }: Request) => {
    const features = []
    if (delay) features.push(`Delay=${ms(delay * 1000)}`)
    if (delayuntil) features.push('Delay Until')
    if (cron) features.push(`CRON=${cron.join(' ')}`)
    if (interval) features.push(`Interval=${ms(interval * 1000)}`)
    if (retry) features.push(`Retry=${retry.max}`)
    return features.length ? features.join(', ') : '-'
  },
}, {
  name: 'Start',
  key: ({ start }: Request) => moment(start * 1000).format('DD-MMM-YYYY@HH:mm:ss'),
}]

export async function handler (args: any) {
  const workspace = args.w || args.workspace

  if (!workspace) {
    output.error('Workspace is required, use --workspace', args)
  }

  const list: any = await request(args, {
    method: 'get',
    url: '/requests',
    params: {
      workspace,
    },
  })

  output.table(columns, list, args)
}

export default {
  command: 'requests',
  desc: 'Log of requests',
  handler,
} as CommandModule
