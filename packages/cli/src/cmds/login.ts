import { CommandModule } from 'yargs'
import chalk from 'chalk'
import prompt from 'prompt'
import util from 'util'
import output from '#/helpers/output'
import login from '#/helpers/login'

const promptGet = util.promisify(prompt.get)

const schema = {
  properties: {
    email: {
      description: 'E-mail',
    },
    password: {
      description: 'Password',
      hidden: true,
    },
  },
}

async function handler (args: any) {
  // Get the login details
  prompt.start()

  const {
    email, password,
  } = await promptGet(schema)

  // Login with user
  await login(args, email, password)

  output(chalk.green('Successful login'), args)
}

export default {
  command: 'login',
  desc: 'Login to Zeplo',
  handler,
} as CommandModule
