/* eslint-disable unicorn/no-process-exit */

// Native
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import zlib from 'zlib'

// Packages
import onDeath from 'death'
import fetch from 'node-fetch'
import retry from 'async-retry'
import which from 'which-promise'
import readPkg from 'read-pkg'

// Utilities
import plusxSync from './chmod'
import {
  disableProgress,
  enableProgress,
  info,
  showProgress,
  warn,
} from './log'

fetch.Promise = Promise
global.Promise = Promise
let { platform } = process
if (detectAlpine()) platform = 'alpine'

const packageDir = path.join(__dirname, '..', '..')
const packageJSON = readPkg.sync(packageDir)

const zeplo = path.join(__dirname, 'zeplo')
const targetWin32 = path.join(__dirname, 'zeplo.exe')
const target = platform === 'win32' ? targetWin32 : zeplo
const partial = `${target}.partial`
const backup = `${target}.${packageJSON.version}.backup`

const platformToName = {
  alpine: 'zeplo-alpine',
  darwin: 'zeplo-macos',
  linux: 'zeplo-linux',
  win32: 'zeplo-win.exe',
}

function detectAlpine () {
  if (platform !== 'linux') return false
  // https://github.com/sass/node-sass/issues/1589#issuecomment-265292579
  const ldd = spawnSync('ldd', [process.execPath]).stdout.toString()
  return /\bmusl\b/.test(ldd)
}

async function download () {
  try {
    fs.writeFileSync(
      zeplo,
      '#!/usr/bin/env node\n' +
        'console.log("Please wait until the \'@zeplo/cli\' installation completes!")\n',
    )
  } catch (err) {
    if (err.code === 'EACCES') {
      warn('Please try installing Zeplo CLI again with the `--unsafe-perm` option.')
      info('Example: `npm i -g --unsafe-perm @zeplo/cli`')

      process.exit()
    }

    throw err
  }

  onDeath(() => {
    fs.writeFileSync(
      zeplo,
      '#!/usr/bin/env node\n' +
        'console.log("The \'zeplo\' installation did not complete successfully.")\n' +
        'console.log("Please run \'npm i -g @zeplo/cli\' to reinstall!")\n',
    )
    process.exit()
  })

  info('For the source code, check out: https://github.com/zeplo/zeplo-cli')

  // Print an empty line
  console.log('')

  await retry(async () => {
    enableProgress(`Downloading Zeplo CLI ${packageJSON.version}`)
    showProgress(0)

    try {
      const name = platformToName[platform]
      const url = `https://github.com/zeplo/zeplo-cli/releases/download/v${packageJSON.version}/${name}.gz`
      const resp = await fetch(url, { compress: false })

      if (resp.status !== 200) {
        throw new Error(`${resp.statusText} ${url}`)
      }

      const size = resp.headers.get('content-length')
      const ws = fs.createWriteStream(partial)

      await new Promise((resolve, reject) => {
        let bytesRead = 0

        resp.body
          .on('error', reject)
          .on('data', (chunk) => {
            bytesRead += chunk.length

            if (size) {
              showProgress((100 * bytesRead) / size)
            }
          })

        const gunzip = zlib.createGunzip()

        gunzip
          .on('error', reject)

        resp.body.pipe(gunzip).pipe(ws)

        ws
          .on('error', reject)
          .on('close', () => {
            showProgress(100)
            resolve()
          })
      })
    } finally {
      disableProgress()
    }
  }, {
    retries: 500,
    onRetry: err => console.error(err),
  })

  fs.renameSync(partial, target)
  fs.writeFileSync(backup, fs.readFileSync(target))
}

function modifyGitBashFile (content) {
  return (
    `${'#!/bin/sh\n' +
      'basedir=$(dirname "$(echo "$0" | sed -e \'s,\\\\,/,g\')")\n' +
      '\n' +
      'case `uname` in\n' +
      '    *CYGWIN*) basedir=`cygpath -w "$basedir"`;;\n' +
      'esac\n' +
      '\n'}${
      content.replace('download/dist/zeplo"', 'download/dist/zeplo.exe"')}`)
}

async function main () {
  if (fs.existsSync(backup)) {
    fs.writeFileSync(target, fs.readFileSync(backup))
  } else {
    await download()
  }

  if (platform === 'win32') {
    try {
      fs.writeFileSync(zeplo, '')
      // Workaround for https://github.com/npm/cmd-shim/pull/25
      const globalPath = path.dirname(await which('npm'))
      let gitBashFile = path.join(globalPath, 'zeplo')
      if (!fs.existsSync(gitBashFile)) {
        gitBashFile = path.join(process.env.APPDATA, 'npm/zeplo')
      }

      fs.writeFileSync(gitBashFile, modifyGitBashFile(fs.readFileSync(gitBashFile, 'utf8')))
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // Not a problem. only git cmd will not work
        console.error(err)
      }
    }
  } else {
    plusxSync(zeplo)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
