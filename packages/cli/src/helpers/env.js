import path from 'path'
import fs from 'fs-extra'
import map from 'lodash/map'
import isString from 'lodash/isString'
import filter from 'lodash/filter'
import merge from 'lodash/merge'
import keyBy from 'lodash/keyBy'
import { getCwd } from './args'
import graphql from './graphql'

const VariableNameInQuery = `
  query VariableNameInQuery ($where: VariableWhereInput!) {
    variables (where: $where) {
      id
      name
    }
  }
`

export async function validateEnvVars (args, spaceName, config) {
  if (!config || !config.requires) {
    return false
  }

  const envVars = {}
  const cwd = getCwd(args)

  // Get the env_file (if provided)
  const envFile = args.env_file || args.environment_file || config.environment_file

  if (envFile) {
    const envFileContent = await fs.readFile(path.resolve(cwd, envFile))
    const envParsed = parseSync(envFileContent)
    merge(envVars, envParsed)
  }

  // Get a list of all inline env vars (config or args)
  const envInline = [].concat([], config.environment || [], args.e || [], args.env || [])
  const normalized = normalizeEnvVars(envInline)

  // Split the vars into local and global vars
  const localVars = filter(normalized, ({ value }) => !!value)

  // We need to check if global vars are actually set
  const globalVars = filter(normalized, ({ valueFromGlobal }) => !!valueFromGlobal)
    .map(({ name }) => name)
  const globalVarsCheck = await checkForGlobalVars(args, spaceName, globalVars)

  // Merge all the env vars together
  merge(envVars, keyBy(localVars, 'name'), keyBy(globalVarsCheck, 'name'))

  // Normalize the format of requires
  const requires = isString(config.requires[0])
    ? config.requires : config.requires.map(r => r.name)

  // Check that all required env vars are present
  const missing = filter(requires, key => !envVars[key])

  return missing.length === 0 ? false : missing
}

// Looks up global vars to see if they are available
export async function checkForGlobalVars (args, spaceName, varsList) {
  if (!varsList || !varsList.length) return []
  const res = await graphql(args, VariableNameInQuery, {
    where: {
      names_in: varsList,
      space: { name: spaceName },
    },
  })
  return res.variables
}

export function normalizeEnvVars (envVars) {
  return map(envVars, (envVar) => {
    // Handle ENV_NAME=ENV_VALUE format
    if (isString(envVar)) {
      const split = envVar.split('=')
      if (split.length === 1) {
        return {
          name: split[0],
          valueFromGlobal: split[0],
        }
      }
      return {
        name: split[0],
        value: split.slice(1).join('='),
      }
    }
    return envVar
  })
}

export function getRequiresConfig (requires, name) {
  return requires.filter(r => r.name === name || r === name).map((r) => {
    if (r.name) return r
    return { name: r }
  }).pop()
}

export function parseSync (src) {
  // Try parse JSON
  try {
    return JSON.parse(src.toString())
  } catch (err) {
    // Try parse envfile string
    const result = {}
    const lines = src.toString().split('\n')
    lines.forEach((line) => {
      const match = line.match(/^([^=:#]+?)[=:](.*)/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        result[key] = value
      }
    })
    return result
  }
}
