import { CommandModule } from 'yargs'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import output from '#/helpers/output'
import { getDevUrl } from '#/helpers/dev/config'
// import requestWithAuth from '#/helpers/request'

const { QUEUE_URL = 'https://zeplo.to' } = process.env

export async function handler (args: any) {
  const queueUrl = (await getDevUrl(args)) || QUEUE_URL

  const req = {
    url: args.url.startsWith('/') ? `${queueUrl}/${args.url}` : `${queueUrl}/${args.url}`,
    headers: {},
    data: args.d || args.body,
    method: args.method || 'GET',
  } as AxiosRequestConfig

  console.log('req', req)

  if (args.header) {
    const headerArr = Array.isArray(args.header) ? args.header : [args.header]
    headerArr.forEach((header: string) => {
      const [name, val] = header.split(':')
      if (req.headers) req.headers[name] = val
    })
  }

  if (args.delay && req.headers) {
    req.headers['X-Zeplo-Delay-Until'] = Math.floor(Date.now() / 1000) + args.delay
  }

  if (args.retry && req.headers) {
    req.headers['X-Zeplo-Retry'] = args.retry
  }

  if ((args.t || args.token) && req.headers) {
    req.headers['X-Zeplo-Token'] = args.t || args.token
  }

  const res = await axios(args).catch((err: AxiosError) => {
    if (err?.isAxiosError && err.response?.status === 403) {
      output.error('Please provide your workspace token', args)
      return
    }
    output(err?.response?.data, args)
    output.error(err.message, args)
  })

  if (res) output(res.data, args)
}

export default {
  command: 'queue <url>',
  desc: 'Send a queued request to a service',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('url', {
        describe: 'URL to send queued request',
      })
      .option('method', {
        alias: 'X',
        describe: 'Specify request command method to use',
      })
      .option('header', {
        alias: 'H',
        describe: 'Pass custom header LINE to serve',
      })
      .option('delay', {
        describe: 'Delay the request (in seconds)',
      })
      .option('retry', {
        describe: 'Retry X times if request fails',
      })
      .option('body', {
        alias: 'd',
        describe: 'Add a body to the request',
      })
  },
} as CommandModule
