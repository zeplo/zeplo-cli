import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import autoCompletePrompt from 'inquirer-autocomplete-prompt'
import matchSorter from 'match-sorter'
import { glob } from 'glob-gitignore'
import { getServiceName } from '../helpers/service'
import output from '../helpers/output'
import { getCwd } from '../helpers/args'
import { getSpaceName } from '../helpers/space'

// const GIT_URL = 'https://github.com/zeplo/zeplo-cli/tree/v0.2.0/packages/cli/templates'

inquirer.registerPrompt('autocomplete', autoCompletePrompt)

async function handler (args) {
  const prompts = []
  const files = await fs.readdir(path.resolve(__dirname, '../../templates/'))

  // Remove non-exampole files
  let exampleList = files.filter(d => !d.startsWith('.'))

  // Move basic to the top of the list
  exampleList = ['basic', ...exampleList.filter(d => d !== 'basic')]
  // exampleList = [...exampleList, 'custom']

  if (!args.name) {
    prompts.push({
      type: 'input',
      name: 'name',
      message: 'name',
      default: await getServiceName(args),
    })
  }

  // if (!args.space) {
  //   prompts.push({
  //     type: 'input',
  //     name: 'space',
  //     message: 'space',
  //     default: await getSpaceName(args),
  //   })
  // }

  const desc = `
  There are 2 types of template modes - ${chalk.bold('run')} and ${chalk.bold('https')}:
    1. \`run\` - for long running scripts, kind of like your terminal in the cloud
    2. \`https\` - for frequent, short tasks, your template will expose a server to respond to requests\n`

  if (!args.template) {
    prompts.push({
      type: 'autocomplete',
      name: 'template',
      message: `Select a template below...${chalk.reset(desc)}`,
      source: async (answersSoFar, input) => {
        return !input ? exampleList : matchSorter(exampleList, input)
      },
    })
  }

  const shouldPrompt = !(args.s || args.silent) && prompts.length > 0
  const answers = shouldPrompt ? await inquirer.prompt(prompts) : {}

  const name = args.name || answers.name
  const template = args.template || answers.template
  const space = await getSpaceName(args, false)

  if (!exampleList.includes(template)) {
    output.error('Invalid service template specified', args)
  }

  const dest = getCwd(args)

  // Check for existing directory
  if (fs.existsSync(dest) && !(args.force && args.f)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Overwrite existing directory?',
    }])
    if (!overwrite) {
      output.error('Init cancelled!', args)
    }
  }

  output.accent(`Copying template to ${dest}`, args)

  const pkgDir = path.resolve(__dirname, `../../templates/${template}`)
  const filePaths = await glob(['**'], {
    cwd: pkgDir,
    nodir: true,
    // realpath: true,
  })

  filePaths.forEach((filePath) => {
    const buff = fs.readFileSync(path.resolve(pkgDir, filePath), 'utf-8')
    fs.outputFileSync(path.resolve(dest, filePath), buff)
  })

  // await fs.copy(path.resolve(__dirname, `../../templates/${template}`), dest)
  await fs.outputJson(path.resolve(dest, '.zeplorc'), {
    default: {
      namespace: space,
      service: name,
    },
  })

  if (name) output.success(`Service ${name} created`, args)
  else output.success('Service created')
}

export default {
  command: 'init [dir]',
  desc: 'Initialise a new service',
  builder: (yargs) => {
    return yargs
      .positional('dir', {
        describe: 'directory to deploy',
        default: './',
      })
      .option('name', {
        describe: 'Name of the service',
      })
      .option('template', {
        alias: 't',
        describe: 'Template to use for the service',
      })
      .option('force', {
        alias: 'f',
        describe: 'Force init even if existing dir exists',
      })
  },
  handler,
}
