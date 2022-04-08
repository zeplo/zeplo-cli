import { homedir } from 'os'
import { readJson, existsSync, outputJson } from 'fs-extra'
import path from 'path'
import { get, set } from 'lodash'
import { AuthConfig } from '../types'

const { CONFIG_DIR = '.zeplo', CONFIG_SUFFIX = '' } = process.env

const DEFAULT_AUTH_CONFIG = {
  _: 'This is your Zeplo credentials file. DON\'T SHARE!',
  credentials: {},
  defaultAuth: null,
}

export const configSuffix = (args: any) =>
  (args.endpoint
    ? `[${args.endpoint.replace(/https?:\/\//, '')}]`
    : CONFIG_SUFFIX)

export const getAuthConfigPath = (args: any) => {
  return path.resolve(getConfigPath(args), `./auth${configSuffix(args)}.json`)
}

export const getBasicConfigPath = (args: any) =>
  path.resolve(getConfigPath(args), `./config${configSuffix(args)}.json`)

export const getDevPath = (args: any) =>
  path.resolve(getConfigPath(args), './dev.json')

export default function getConfigPath (args: any) {
  const { configPath } = args
  if (configPath) {
    return path.resolve(configPath)
  }
  return path.resolve(homedir(), `./${CONFIG_DIR}`)
}

export async function getAuthConfig (args: any): Promise<AuthConfig|null> {
  const authPath = getAuthConfigPath(args)
  return existsSync(authPath)
    ? readJson(authPath)
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
      type: 'token',
      token,
    },
  }
  auth.defaultAuth = username

  await setBasicConfig(args, 'user.defaultWorkspace', null)

  // Save the file
  return outputJson(authPath, auth)
}

export async function removeAuthConfig (args: any) {
  const authPath = getAuthConfigPath(args)

  const auth = await getAuthConfig(args)
  if (!auth) return null

  auth.credentials = {}
  auth.defaultAuth = null

  await setBasicConfig(args, 'user', {})

  return outputJson(authPath, auth)
}

export async function setBasicConfig (args: any, key: string, value: any) {
  const configPath = getBasicConfigPath(args)
  return setConfig(configPath, key, value)
}

export async function getBasicConfig (args: any, key: string) {
  const configPath = getBasicConfigPath(args)
  return getConfig(configPath, key)
}

export async function setConfig (path: string, key: string, value: any) {
  let json = {}
  if (existsSync(path)) {
    json = await readJson(path)
  }
  set(json, key, value)
  await outputJson(path, json, {
    spaces: 2,
  })
  return value
}

export async function getConfig (path: string, key: string) {
  if (!existsSync(path)) return null
  const json = await readJson(path)
  return get(json, key)
}
