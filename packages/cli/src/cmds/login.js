import chalk from 'chalk'
import prompt from 'prompt'
import { promisify } from 'promise-callbacks'
import request from '../helpers/request'
import output from '../helpers/output'
import { addAuthConfig } from '../helpers/config'

const promptGet = promisify.method(prompt, 'get')

const schema = {
  properties: {
    username: {
      description: 'Username',
      // pattern: /^[0-9a-zA-Z@.\-]+$/,
      // message: 'Username should be your e-mail address',
      required: true,
    },
    password: {
      description: 'Password',
      hidden: true,
    },
  },
}

async function handler (args) {
  // Get the login details
  prompt.start()

  const { username, password } = await promptGet(schema)

  const login = await request(args, {
    method: 'POST',
    url: '/login',
    body: {
      username,
      password,
    },
  }, false).catch((err) => {
    if (err.statusCode > 499) throw err
    throw new Error(chalk.red('Invalid credentials'))
  })

  if (login) {
    await addAuthConfig(args, username, login.token, login.username)
  }

  output(chalk.green('Successful login'), args)
}

export default {
  command: 'login',
  desc: 'Login to Zeplo',
  builder: {
    dir: {
      default: '.',
    },
  },
  handler,
}
