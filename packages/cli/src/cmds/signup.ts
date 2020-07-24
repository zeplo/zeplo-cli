import { CommandModule } from 'yargs'
import chalk from 'chalk'
import prompt from 'prompt'
import util from 'util'
import request from '#/helpers/request'
import output from '#/helpers/output'
import login from '#/helpers/login'

const promptGet = util.promisify(prompt.get)

const schema = {
  properties: {
    name: {
      description: 'Name',
    },
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
    email, password, name,
  } = await promptGet(schema)

  // Signup user
  await request(args, {
    method: 'POST',
    url: '/signup',
    data: {
      name,
      email,
      password,
    },
  }, false)

  // Login with user
  await login(args, email, password)

  output(chalk.green('Successful signup! Welcome!'), args)
}

export default {
  command: 'signup',
  desc: 'Sign up to Ralley',
  handler,
} as CommandModule
