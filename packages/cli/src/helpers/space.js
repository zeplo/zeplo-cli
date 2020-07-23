// import fs from 'fs-extra'
// import path from 'path'
import inquirer from 'inquirer'
import autoCompletePrompt from 'inquirer-autocomplete-prompt'
import matchSorter from 'match-sorter'
import graphql from './graphql'
import { getServiceConfig } from './service.config'
import { getBasicConfig } from './config'
import output from './output'

inquirer.registerPrompt('autocomplete', autoCompletePrompt)

const CreateSpaceMutation = `
  mutation CreateSpaceMutation ($input: CreateMutationInput!) {
    createSpace (input: $input) {
      id
      name
    }
  }
`

const SpacesQuery = `
  query SpacesQuery {
    spaces {
      id
      name
    }
  }
`

const disallowedChars = /[^a-z0-9-_]/

export async function getSpaceName (args, force) {
  // If we need a space/site then we should
  // ask the user for it (as no default is present)
  const space = await searchForSpaceName(args, true)

  const invalidChar = space && space.match(disallowedChars)
  if (space && invalidChar) {
    throw new Error(`Invalid char ${invalidChar[0]} in namespace ${space}`)
  }

  if (space) return space

  // We don't have a space still
  if (force) {
    return askForSpace(args)
  }

  // We couldn't find a spaceName
  return undefined
}

export async function getSpaceNameWithoutConfig (args, force) {
  // If we need a space/site then we should
  // ask the user for it (as no default is present)
  const space = await searchForSpaceName(args, false)

  const invalidChar = space && space.match(disallowedChars)
  if (space && invalidChar) {
    throw new Error(`Invalid char ${invalidChar[0]} in namespace ${space}`)
  }


  if (space) return space

  // We don't have a space still
  if (force) {
    return askForSpace(args)
  }

  // We couldn't find a spaceName
  return undefined
}

// export async function setSpaceDefaultName (args, spaceName) {
//   const cwd = getCwd(args)
//   const zeplorcPath = path.resolve(cwd, '.zeplorc')
//
//   if (fs.existsSync(zeplorcPath)) {
//     const zeplorc = await fs.readJson(path.resolve(cwd, '.zeplorc'), { throws: false })
//     if (zeplorc && !zeplorc.space) {
//       zeplorc.space = spaceName
//       await fs.outputJson(path.resolve(cwd, '.zeplorc'), zeplorc, { throws: false })
//     }
//   }
// }

export async function searchForSpaceName (args, checkConfig) {
  if (args.allNamespaces) return undefined

  // 1. Use the flag
  if (args.n || args.namespace) return args.n || args.namespace

  if (args.service && args.service.includes('/')) return args.service.split('/')[0]

  if (!checkConfig) return null

  // 2. Use the directory .zeplorc
  const config = await getServiceConfig(args)
  if (checkConfig && config && config.name && config.name.includes('/')) return config.name.split('/')[0]

  // 3. Use the default for the user (unless the user has requested to use all namespaces)
  return getBasicConfig(args, 'user.defaultSpace')
}

export async function askForSpace (args) {
  const { spaces } = await graphql(args, SpacesQuery)

  if (!spaces || !spaces.length) {
    output.accent('No namespaces detected.', args)
    output('Create a new namespaces:', args)
    const space = await createSpace(args)

    if (!space) {
      output.error('Namespace is required for `deploy` command')
    }

    return space.name
  }

  const answers = await inquirer.prompt([{
    type: 'autocomplete',
    name: 'name',
    message: 'Select a space:',
    source: async (answersSoFar, input) => {
      return !input ? spaces : matchSorter(spaces, input)
    },
  }])

  return answers.name
}

export async function createSpace (args) {
  const answers = await inquirer.prompt([{
    name: 'name',
    type: 'input',
    message: 'name',
  }])

  if (!answers.name) {
    return null
  }

  const resp = await graphql(args, CreateSpaceMutation, {
    input: {
      name: answers,
    },
  })

  return resp.space
}
