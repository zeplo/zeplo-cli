#!/usr/bin/env node

import yargs from 'yargs'
import * as Sentry from '@sentry/node'
import workspaces from './cmds/workspaces'
import login from './cmds/login'
import signup from './cmds/signup'
import logout from './cmds/logout'
import queue from './cmds/queue'
import logs from './cmds/requests'
import config from './cmds/config'
import dev from './cmds/dev'
import output from './helpers/output'
import updateCheck from './helpers/updates'

const updateCheckMiddleware = async (args: any) => {
  if (!args.ignoreUpdates) await updateCheck(args)
  return {}
}

const cli = yargs
  .middleware([updateCheckMiddleware])
  .usage('Usage: ralley <command> [options]')
  .scriptName('ralley')
  .command(workspaces)
  .command(queue)
  .command(logs)
  .command(config)
  .command(login)
  .command(logout)
  .command(signup)
  .command(dev)
  .option('token', {
    alias: 't',
    describe: 'Authentication token',
  })
  .option('workspace', {
    alias: 'w',
    describe: 'Workspace to target',
  })
  .option('quiet', {
    alias: 'q',
    describe: 'Quiet mode (no stdout)',
  })
  .option('debug', {
    describe: 'Debug mode (more stdout)',
  })
  .option('json', {
    describe: 'Format response as JSON (only valid for list commands)',
  })
  .strict()
  .demandCommand(1)
  .fail((msg: string, err: any, args: any) => {
    if (err && process.env.NODE_ENV === 'development') {
      console.error(err)
    }

    // eslint-disable-next-line
    if (err) err.args = args
    if (err) Sentry.captureException(err)

    output.space(args)
    if (msg || err) {
      output.error(msg ||
        (err.error && err.error.errors && err.error.errors[0] &&
          err.error.errors[0].message) ||
        (err.message), args)
    }
    if (!err) yargs.showHelp()
  })
  .recommendCommands()
  .help('h')
  .alias('version', 'v')

export default cli
