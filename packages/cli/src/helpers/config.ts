import { homedir } from 'os'
import fs from 'fs-extra'
import path from 'path'
import loadJsonFile from 'load-json-file'
import writeJsonFile from 'write-json-file'
import { get, set } from 'lodash'
import { AuthConfig } from '../types'

const { CONFIG_DIR = '.ralley', CONFIG_SUFFIX = '' } = process.env

const DEFAULT_AUTH_CONFIG = {
  _: 'This is your Ralley credentials file. DON\'T SHARE!',
  credentials: {},
  defaultAuth: null,
}

const configSuffix = (args: any) =>
  (args.endpoint
    ? `[${args.endpoint.replace(/https?:\/\//, '')}]`
    : CONFIG_SUFFIX)

const getAuthConfigPath = (args: any) => {
  return path.resolve(getConfigPath(args), `./auth${configSuffix(args)}.json`)
}

const getBasicConfigPath = (args: any) =>
  path.resolve(getConfigPath(args), `./config${configSuffix(args)}.json`)

export default function getConfigPath (args: any) {
  const { configPath } = args
  if (configPath) {
    return path.resolve(configPath)
  }
  return path.resolve(homedir(), `./${CONFIG_DIR}`)
}

export async function getAuthConfig (args: any): Promise<AuthConfig|null> {
  const authPath = getAuthConfigPath(args)
  return fs.existsSync(authPath)
    ? loadJsonFile(authPath)
    : null
}

export async function addAuthConfig (args: any, username: string, token: string) {
  const authPath = getAuthConfigPath(args)

  let auth = await getAuthConfig(args)

  if (!auth) {
    auth = DEFAULT_AUTH_CONFIG
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

export async function removeAuthConfig (args: any) {
  const authPath = getAuthConfigPath(args)

  const auth = await getAuthConfig(args)
  if (!auth) return null

  auth.credentials = {}
  auth.defaultAuth = null

  await setBasicConfig(args, 'user', {})

  return writeJsonFile(authPath, auth)
}

export async function setBasicConfig (args: any, key: string, value: any) {
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

export async function getBasicConfig (args: any, key: string) {
  const configPath = getBasicConfigPath(args)
  if (!fs.existsSync(configPath)) return null
  const json = await fs.readJson(configPath)
  return get(json, key)
}
