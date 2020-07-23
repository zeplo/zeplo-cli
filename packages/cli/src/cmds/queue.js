import request from 'request-promise-native'
import apiRequest from '../helpers/request'
// import graphql from '../helpers/graphql'
import output from '../helpers/output'
// import getAuth from '../helpers/auth'

const { PROTOCOL = 'https', SERVICE_DOMAIN_1 } = process.env

export async function handler (args) {
  const split = args.service.split('/')
  const service = split[1]
  const namespace = split[0]
  const tag = args.tag ? `@${args.tag}` : ''
  const path = args.path && args.path.charAt(0) !== '/' ? `/${args.path}` : args.path

  const url = `${PROTOCOL}://${namespace}.${SERVICE_DOMAIN_1}/${service}${tag}${path || ''}`

  const req = {
    url,
    headers: {},
    body: args.d || args.body,
    method: args.method || 'GET',
  }

  if (args.header) {
    const headerArr = Array.isArray(args.header) ? args.header : [args.header]
    headerArr.forEach((header) => {
      const [name, val] = header.split(':')
      req.headers[name] = val
    })
  }

  if (args.queue || args.delay || args.queueId) {
    req.headers['X-Zeplo-Queue'] = 'true'
  }

  if (args.delay) {
    req.headers['X-Zeplo-Queue-Delay-Until'] = Math.floor(Date.now() / 1000) + args.delay
  }

  if (args.queueName) {
    req.headers['X-Zeplo-Queue-Name'] = args.queueName
  }

  if (args.retry) {
    req.headers['X-Zeplo-Queue-Retry'] = args.retry
  }

  // Add auth - get a temporary token
  const resp = await apiRequest(args, {
    url: '/tokens/services',
    method: 'POST',
    body: {
      namespace,
      service,
    },
  })
  req.headers['X-Zeplo-Token'] = resp.token
  const res = await request(req)

  output(res)
}

export default {
  command: 'run <service>',
  desc: 'Send a request to a service',
  handler,
  builder: (yargs) => {
    return yargs
      .positional('service', {
        describe: '<namespace/service> for the service to request ',
      })
      .option('tag', {
        describe: 'A tag or version to target request',
      })
      .option('path', {
        describe: 'Resource location path',
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
      .option('queue', {
        describe: 'Queue the request',
      })
      .option('queue-name', {
        describe: 'Queue with a custom name (cannot be re-used while job is active)',
      })
      .option('retry', {
        describe: 'Retry X times if request fails',
      })
      .option('body', {
        alias: 'd',
        describe: 'Add a body to the request',
      })
  },
}
