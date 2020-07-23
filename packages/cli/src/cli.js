#!/usr/bin/env node

import yargs from 'yargs'
import * as Sentry from '@sentry/node'
import services from './cmds/services'
import spaces from './cmds/spaces'
import instances from './cmds/instances'
import login from './cmds/login'
import signup from './cmds/signup'
import logout from './cmds/logout'
import traces from './cmds/traces'
import run from './cmds/run'
import logs from './cmds/logs'
import images from './cmds/images'
import variables from './cmds/variables'
import tokens from './cmds/tokens'
import deploy from './cmds/deploy'
import config from './cmds/config'
import init from './cmds/init'
import output from './helpers/output'
import updateCheck from './helpers/updates'

const updateCheckMiddleware = async (args) => {
  if (!args.ignoreUpdates) await updateCheck(args)
  return {}
}

const cli = yargs
  .middleware([updateCheckMiddleware])
  .usage('Usage: zeplo <command> [options]')
  .scriptName('zeplo')
  .command(services)
  .command(spaces)
  .command(traces)
  .command(instances)
  .command(run)
  .command(logs)
  .command(deploy)
  .command(images)
  // .command(scale)
  .command(variables)
  .command(tokens)
  // .command(triggers)
  .command(config)
  .command(login)
  .command(logout)
  .command(signup)
  .command(init)
  .option('token', {
    alias: 't',
    describe: 'Authentication token',
  })
  .option('namespace', {
    alias: 'n',
    describe: 'Namespace to target',
  })
  .option('service', {
    describe: 'Service to target',
  })
  .option('all-namespaces', {
    describe: 'Force all namespaces (if you have set a default namespace)',
  })
  .option('quiet', {
    alias: 'q',
    describe: 'Quiet mode (no stdout)',
  })
  .option('json', {
    describe: 'Format response as JSON (only valid for list commands)',
  })
  .option('endpoint', {
    describe: false,
  })
  .strict()
  .demandCommand(1)
  .fail((msg, err, args) => {
    if (err && process.env.NODE_ENV === 'development') {
      console.error(err)
    }

    // eslint-disable-next-line
    if (err) err.args = args
    if (err) Sentry.captureException(err)

    output.space()
    if (msg || err) {
      output.error(msg ||
        (err.error && err.error.errors && err.error.errors[0]
          && err.error.errors[0].message) ||
        (err.message), args)
    }
    if (!err) yargs.showHelp()
  })
  .recommendCommands()
  .help('h')
  // .version()
  .alias('version', 'v')
  // .help('help')
  // .parse()

export default cli
