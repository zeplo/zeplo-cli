#!/usr/bin/env node
import * as Sentry from '@sentry/node'
import './setup'
import pkg from '../package.json'
import cli from './cli'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://c3fedd715c0c449096a1278564487215@sentry.io/1281652',
    release: pkg.version,
  })
}

cli.parse()
