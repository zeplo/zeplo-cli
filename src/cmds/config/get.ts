import { getBasicConfig } from '../../helpers/config'
import output from '../../helpers/output'

export async function handler (args: any) {
  const value = await getBasicConfig(args, `user.${args.key}`)
  output.space(args)
  output.accent(value, args)
  output.space(args)
}

export default {
  command: 'get <key>',
  desc: 'Get config for CLI',
  handler,
}
