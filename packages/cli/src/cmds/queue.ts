import { CommandModule } from 'yargs'
import axios, { AxiosRequestConfig } from 'axios'
import output from '#/helpers/output'

const { QUEUE_URL } = process.env

export async function handler (args: any) {
  const req = {
    baseURL: QUEUE_URL,
    url: args.url,
    headers: {},
    data: args.d || args.body,
    method: args.method || 'GET',
  } as AxiosRequestConfig

  if (args.header) {
    const headerArr = Array.isArray(args.header) ? args.header : [args.header]
    headerArr.forEach((header: string) => {
      const [name, val] = header.split(':')
      req.headers[name] = val
    })
  }

  if (args.delay) {
    req.headers['X-Ralley-Delay-Until'] = Math.floor(Date.now() / 1000) + args.delay
  }

  if (args.retry) {
    req.headers['X-Ralley-Retry'] = args.retry
  }

  const res = await axios(req)

  output(res.data, args)
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
