import request from 'request-promise-native'
import semver from 'semver'
import chalk from 'chalk'
import output from './output'
import { getBasicConfig, setBasicConfig } from './config'
import pkg from '../../package.json'

const CLI_RELEASES_URL = 'https://ralley-cli-releases.ralley.io/'
const CHECK_EVERY_HOUR = 60 * 60 * 1000

export default async function updateCheck (args) {
  const newVersion = await updateAvailable(args)
  if (newVersion) {
    output.space()
    output.accent(`${chalk.white.bgRed.bold('UPDATE AVAILABLE')} Ralley CLI latest version is ${newVersion} (installed v${pkg.version})`)
    output.accent(`Upgrade details can be found at ${chalk.cyan('https://ralley.io/docs/install')}`)
    output.space()
  }
  return newVersion
}

export async function updateAvailable (args) {
  const config = await getBasicConfig(args, 'cli') || {}

  if (config.lastUpdateCheck && Date.now() < config.lastUpdateCheck + CHECK_EVERY_HOUR) {
    return null
  }

  const res = await request({
    url: CLI_RELEASES_URL,
    method: 'GET',
    json: true,
  }).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      throw err
    }
    // We don't care if the request fails, we'll try again later
    return null
  })

  // Ignore if no result
  if (!res || !res.stable) return null

  // Check versions
  if (semver.gt(res.stable.tag, pkg.version)) {
    return res.stable.tag
  }

  // Stop performing checks for 1 hr
  await setBasicConfig(args, 'cli.lastUpdateCheck', Date.now())

  return null
}
