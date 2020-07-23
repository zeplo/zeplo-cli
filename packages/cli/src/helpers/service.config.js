import path from 'path'
import fs from 'fs-extra'
import yml from 'js-yaml'
import merge from 'lodash/merge'
import { normalize } from '@zeplo/validator'
import schema from './schema'
import { getCwd } from './args'
import { getRootPaths } from './paths'
import { matchArr } from './util'

export async function getServiceConfig (args) {
  const config = await getRawServiceConfig(args)
  if (!config) return null
  return normalize(schema, config, { filter: false })
}

async function getRawServiceConfig (args) {
  const cwd = getCwd(args)

  // Look for all json, yml and yaml files in root directory
  const paths = await getRootPaths(args)

  const zeplorc = await getZeplorc(args)

  // A zeplo file
  const zeploMatch = matchArr(paths, /(^.*\.)?zeplo\.(json|ya?ml)$/)
  if (zeploMatch) {
    const file = await getJsonFromFile(cwd, zeploMatch) || {}
    if (file) return merge(normalize(schema, file), zeplorc || {})
  }

  // A package manager file
  const packageMatch = matchArr(paths, /^(package|app|composor)\.(json|ya?ml)$/)
  if (packageMatch) {
    const file = await getJsonFromFile(cwd, packageMatch)
    const parent = {
      name: file.name,
    }
    if (file && file.zeplo) return merge(parent, normalize(schema, file.zeplo), zeplorc || {})
  }

  return zeplorc
}

export async function getZeplorc (args) {
  const cwd = getCwd(args)

  // Look for all json, yml and yaml files in root directory
  const paths = await getRootPaths(args)

  // .zeplorc will be merged with zepo.yml - .zeplorc takes precendence as it
  // it env related service definition
  const zeplorcMatch = matchArr(paths, /^\.zeplorc(\.(json|ya?ml))?$/)
  if (zeplorcMatch) {
    const file = await getJsonFromFile(cwd, zeplorcMatch)
    const selection = file[args.context || args.tag || 'latest']
    // We will extract the env config based on args.use or use default
    if (selection) return normalize(schema, selection, { filter: false })
  }

  return null
}

async function getJsonFromFile (cwd, fileName) {
  const ext = fileName.split('.').pop()
  const filePath = path.resolve(cwd, fileName)

  if (ext === 'json') {
    return fs.readJsonSync(filePath, { throw: false })
  }

  if (ext === 'yml' || ext === 'yaml' || fileName.startsWith('.zeplorc')) {
    return yml.safeLoad(fs.readFileSync(filePath, 'utf8'))
  }

  return null
}
