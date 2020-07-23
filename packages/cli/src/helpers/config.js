import { homedir } from 'os'
import fs from 'fs-extra'
import path from 'path'
import loadJsonFile from 'load-json-file'
import writeJsonFile from 'write-json-file'
import get from 'lodash/get'
import set from 'lodash/set'

const { CONFIG_DIR, CONFIG_SUFFIX = '' } = process.env

const defaultAuth = {
  _: 'This is your Ralley credentials file. DON\'T SHARE!',
  credentials: {},
}

const configSuffix = args => (args.endpoint ? `[${args.endpoint.replace(/https?:\/\//, '')}]` : CONFIG_SUFFIX)

const getAuthConfigPath = (args) => {
  return path.resolve(getConfigPath(args), `./auth${configSuffix(args)}.json`)
}

const getBasicConfigPath = args =>
  path.resolve(getConfigPath(args), `./config${configSuffix(args)}.json`)

export default function getConfigPath (args) {
  const { configPath } = args
  if (configPath) {
    return path.resolve(configPath)
  }
  return path.resolve(homedir(), `./${CONFIG_DIR}`)
}

export async function getAuthConfig (args) {
  const authPath = getAuthConfigPath(args)
  return fs.existsSync(authPath)
    ? loadJsonFile(authPath)
    : null
}

export async function addAuthConfig (args, username, token) {
  const authPath = getAuthConfigPath(args)

  let auth = await getAuthConfig(args)

  if (!auth) {
    auth = defaultAuth
  }

  auth.credentials = {
    [username]: {
      type: 'jwt',
      token,
    },
  }
  auth.defaultAuth = username

  await setBasicConfig(args, 'user.defaultWorkspace', null)

  // Save the file
  return writeJsonFile(authPath, auth)
}

export async function removeAuthConfig (args) {
  const authPath = getAuthConfigPath(args)

  const auth = await getAuthConfig(args)
  if (!auth) return null

  auth.credentials = {}
  auth.defaultAuth = null

  await setBasicConfig(args, 'user', {})

  return writeJsonFile(authPath, auth)
}

export async function setBasicConfig (args, key, value) {
  const configPath = getBasicConfigPath(args)
  let json = {}
  if (fs.existsSync(configPath)) {
    json = await fs.readJson(configPath)
  }
  set(json, key, value)
  await fs.outputJson(configPath, json, {
    spaces: 2,
  })
  return value
}

export async function getBasicConfig (args, key) {
  const configPath = getBasicConfigPath(args)
  if (!fs.existsSync(configPath)) return null
  const json = await fs.readJson(configPath)
  return get(json, key)
}
