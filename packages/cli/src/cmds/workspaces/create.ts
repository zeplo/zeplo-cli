import { CommandModule } from 'yargs'
import prompt from 'prompt'
import util from 'util'
import request from '#/helpers/request'
import output from '#/helpers/output'
import { setBasicConfig } from '#/helpers/config'
import { AxiosError } from 'axios'

const { WEB_URL } = process.env

const promptGet = util.promisify(prompt.get)

export async function handler (args: any) {
  prompt.start()
  let name = args.name
  let id = args.id

  if (!name) {
    const res = await promptGet({ properties: { name: { description: 'Name' } } })
    name = res.name
  }

  if (!id) {
    const res = await promptGet({ properties: { id: { description: 'ID' } } })
    id = res.id
  }

  const workspace = await request(args, {
    method: 'POST',
    url: '/workspaces',
    data: {
      slug: id,
      name,
    },
  }, true, false).catch((err: AxiosError) => {
    if (err.response?.status === 409) {
      output.error('Workspace ID is taken, please try another', args)
    }
    output.error(err.message, args)
  })

  if (args.default) {
    await setBasicConfig(args, 'user.defaultWorkspace', id)
  }
  output.space(args)
  output.success(`Created workspace ${workspace.name}`, args)
  output.space(args)
  output('View workspace console:', args)
  output.accent(`${WEB_URL}/w/${id}`, args)
  output.space(args)
}

export default {
  command: 'create',
  desc: 'Create a new workspace',
  handler,
  builder: (yargs) => {
    return yargs
      .option('id', {
        describe: 'id of workspace',
      })
      .option('name', {
        describe: 'name of workspace',
      })
      .option('default', {
        alias: 'd',
        describe: 'Set as the default workspace',
      })
  },
} as CommandModule
