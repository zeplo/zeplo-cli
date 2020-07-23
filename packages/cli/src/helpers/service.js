import path from 'path'
import fs from 'fs-extra'
import repoName from 'git-repo-name'
import inquirer from 'inquirer'
import autoCompletePrompt from 'inquirer-autocomplete-prompt'
import matchSorter from 'match-sorter'
import graphql from './graphql'
import { getCwd } from './args'
import { getServiceConfig } from './service.config'
import output from './output'

inquirer.registerPrompt('autocomplete', autoCompletePrompt)

const ServiceQuery = `
  query ServiceQuery ($spaceName: String) {
    services (where: { space: { name: $spaceName } }) {
      id
      name
    }
  }
`

const disallowedChars = /[^a-z0-9-_]/

export async function getServiceNameWithoutConfig (args, force, spaceName) {
  if (args.service) {
    return getServiceFromPathOrName(args.service)
  }

  if (force) {
    return askForService(args, spaceName)
  }

  return undefined
}

export async function getServiceName (args) {
  if (args.service || args.name) {
    return getServiceFromPathOrName(args.service || args.name)
  }

  const cwd = getCwd(args)

  // Otherwise find the name from config
  const config = await getServiceConfig(args)
  if (config && config.name) return getServiceFromPathOrName(config.name)
  if (config && config.service) return getServiceFromPathOrName(config.service)

  // Otherwise use git name (if git repo and remote-url)
  if (fs.existsSync(path.resolve(cwd, '.git'))) {
    let gitName
    try {
      gitName = repoName.sync(cwd)
    } catch (e) {
      output.info('No remote-url found in .git')
    }

    if (gitName) return gitName
  }

  // Otherwise use lang + directory name
  const lang = null // getLanguage(args)
  const parentDir = path.basename(cwd)
  return lang ? `${lang.name}-${parentDir}` : parentDir
}

export function getServiceFromPathOrName (pathOrName = '') {
  let service = pathOrName && pathOrName.includes('/')
    ? pathOrName.split('/').pop()
    : pathOrName

  // Remove the tag if its provided
  if (service.includes('@')) {
    [service] = service.split('@')
  }

  const match = service && service.match(disallowedChars)
  if (match) throw new Error(`Invalid char ${match[0]} in service name ${service}`)
  return service
}

export async function askForService (args, spaceName) {
  const { services } = await graphql(args, ServiceQuery, {
    spaceName,
  })

  if (!services.length) {
    throw new Error(`No services found for namespace ${spaceName}`)
  }

  const answers = await inquirer.prompt([{
    type: 'autocomplete',
    name: 'name',
    message: 'Select a service:',
    source: async (answersSoFar, input) => {
      return !input ? services : matchSorter(services, input)
    },
  }])

  // const selectedSpace = spaces[selectedIndex.id]

  return answers.name
}
