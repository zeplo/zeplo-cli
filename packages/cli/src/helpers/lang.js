import inquirer from 'inquirer'
import { getRootPaths } from './paths'
import { getServiceConfig } from './service.config'
import { forEach } from './util'
import output from './output'

const buildersMap = ['nodejs', 'go', 'python', 'python-2.7', 'java-mvn', 'php', 'ruby', 'docker', 'shell']

const rootLanguageMap = [
  { lang: 'docker', file: 'Dockerfile' },
  { lang: 'nodejs', file: 'package.json' },
  { lang: 'ruby', file: 'Gemfile' },
  { lang: 'php', file: 'composer.json' },
  { lang: 'java-mvn', file: 'pom.xml' },
  { lang: 'go', file: 'main.go' },
  { lang: 'python', file: 'Pipfile' },
  { lang: 'python', file: 'main.py' },
  { lang: 'python', file: 'index.py' },
  { lang: 'nodejs', file: 'index.js' },
  { lang: 'php', file: 'main.php' },
  { lang: 'shell', file: 'main.sh' },
  { lang: 'ruby', file: 'main.rb' },
]

const validBuilder = builder => buildersMap.indexOf(builder) > -1

// const extMap = {
//   js: 'nodejs',
//   php: 'php',
//   rb: 'ruby',
//   ru: 'ruby',
//   java: 'java-mvn',
// }

export async function getLanguage (args) {
  const serviceConfig = await getServiceConfig(args)

  if (serviceConfig && !serviceConfig.build && serviceConfig.image) {
    return 'docker'
  }

  if (args.builder && validBuilder(args.builder)) return args.builder
  else if (args.builder) {
    throw new Error(`Invalid builder: ${args.builder}`)
  }

  if (serviceConfig && serviceConfig.build && serviceConfig.build.builder) {
    if (validBuilder(serviceConfig.build.builder)) return serviceConfig.build.builder
    throw new Error(`Invalid builder: ${serviceConfig.build.builder}`)
  }

  const paths = await getRootPaths(args)

  // Look in root paths
  const res = forEach(rootLanguageMap, ({ lang, file }) => {
    if (paths.filter(path => path.match(file)).length > 0) return lang
    return undefined
  })

  // Look in context path for files based on extention
  // if (!res) {
  //   const deployPaths = await getPaths(args)
  //   res = forEach(deployPaths, (path) => {
  //     const ext = path.split('.').pop()
  //     if (extMap[ext]) return extMap[ext]
  //     return undefined
  //   })
  // }

  return res
}

export async function askForLanguage (args, force) {
  output.accent('Could not determine language automatically')
  const resp = await inquirer.prompt([{
    name: 'lang',
    message: 'Please select your runtime language:',
    type: 'list',
    choices: buildersMap,
  }])

  if (!resp.lang && force) {
    output.error('Could not determine runtime engine', args)
  }

  return resp.lang
}
