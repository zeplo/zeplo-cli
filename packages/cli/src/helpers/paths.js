import path from 'path'
import fs from 'fs-extra'
import uniq from 'lodash/uniq'
import findUp from 'find-up'
import { glob } from 'glob-gitignore'
import ignore from 'ignore'
// import ignoreByDefault from 'ignore-by-default'
import { getEnvFile, getCwd } from './args'
import { getServiceConfig } from './service.config'

const ignoreFiles = ['.dockerignore', '.gitignore', '.npmignore']
const ignoreByDefault = [
  '.git',
  '.nyc_output',
  '.sass-cache',
  'bower_components',
  'coverage',
  'node_modules',
  '.DS_Store',
  '.DS_Store?',
  '*.log',
  '._*',
  '.Trashes',
]

export async function getPaths (args) {
  const cwd = getCwd(args)
  const config = await getServiceConfig(args) || {}
  const include = config.build && config.build.include

  const ignorer = ignore()

  if (config.build && config.build.exclude) {
    ignorer.add(config.build.exclude)
  } else {
    // Find a .gitignore/.dockerignore
    const ignoresPromises = ignoreFiles.map(async (name) => {
      const ignorePath = await findUp(name, {
        cwd,
      })
      return (ignorePath && fs.readFileSync(ignorePath).toString()) || null
    })

    const ignores = await Promise.all(ignoresPromises)

    ignorer
      .add(ignores.join('\n'))
      .add(ignoreByDefault)
  }

  const includePaths = await glob(include || ['**', '.*'], {
    cwd,
    nodir: true,
    realpath: true,
    ignore: ignorer,
  })

  // Add env file to include paths
  const envFile = getEnvFile(args, config)
  if (envFile) {
    includePaths.push(path.resolve(cwd, envFile))
  }

  return uniq(includePaths)
}

export async function getRootPaths (args) {
  const cwd = getCwd(args)

  // Look for all json, yml and yaml files in root directory
  const paths = await glob(['*', '.*'], {
    cwd,
    nodir: true,
  })

  return paths
}
