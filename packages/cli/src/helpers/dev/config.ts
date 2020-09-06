import { isString } from 'lodash'
import chalk from 'chalk'
import { getDevPath, getConfig } from '../config'
import output from '../output'

export async function getDevUrl (args: any) {
  if (!args.dev) return null
  const workspace = isString(args.dev) ? args.dev : (args.workspace || args.w || 'default').split(':')[0]
  const url = await getConfig(getDevPath(args), `${workspace}.url`)
  if (!url) {
    output.error(`Dev server "${workspace}" is not running. 

      ${chalk.white(`Use $ ${chalk.cyan(`ralley dev -w ${workspace}`)}`)}
    `, args)
  }
  return url
}
