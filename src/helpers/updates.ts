import axios from 'axios'
import semver from 'semver'
import chalk from 'chalk'
import output from './output'
import { getBasicConfig, setBasicConfig } from './config'
import pkg from '../../package.json'

const CLI_RELEASES_URL = 'https://zeplo-cli-releases.zeplo.io'
const CHECK_EVERY_HOUR = 60 * 60 * 1000

export default async function updateCheck (args: any) {
  const newVersion = await updateAvailable(args)
  if (newVersion) {
    output.space(args)
    output.accent(`${chalk.white.bgRed.bold('UPDATE AVAILABLE')} Zeplo CLI latest version is ${newVersion} (installed v${pkg.version})`, args)
    output.accent(`Upgrade details can be found at ${chalk.cyan('https://zeplo.io/docs/cli')}`, args)
    output.space(args)
  }
  return newVersion
}

export async function updateAvailable (args: any) {
  const config = await getBasicConfig(args, 'cli') || {}

  if (config.lastUpdateCheck && Date.now() < config.lastUpdateCheck + CHECK_EVERY_HOUR) {
    return null
  }

  const res = await axios({
    url: CLI_RELEASES_URL,
    method: 'GET',
  }).catch((err: Error) => {
    if (process.env.NODE_ENV === 'development') {
      throw err
    }
    // We don't care if the request fails, we'll try again later
    return null
  })

  const data = res?.data

  // Ignore if no result
  if (!data || !data.stable) return null

  // Check versions
  if (semver.gt(data.stable.tag, pkg.version)) {
    return data.stable.tag
  }

  // Stop performing checks for 1 hr
  await setBasicConfig(args, 'cli.lastUpdateCheck', Date.now())

  return null
}
