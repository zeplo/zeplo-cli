import fs from 'fs-extra'
import path from 'path'
// import { wait } from './util'

const {
  NAMESPACE,
} = process.env

export default async function basicDeploy (exec, relativePath, config, cmds = [], validate = true) {
  const fixturesPath = path.resolve(process.cwd(), relativePath)
  if (config) fs.outputJson(path.resolve(fixturesPath, './ralley.json'), config)

  const run = await exec.run('deploy', relativePath, '--namespace', NAMESPACE, ...cmds)
  const deploy = await (validate ? run.wait() : run.done())

  if (validate) {
    if (config && config.name) expect(deploy.stdout).toMatch(`Deploying service: ${NAMESPACE}/${config.name}`)
    expect(deploy.stdout).toMatch('Deployment complete')
  }

  // await wait(1000)

  return deploy
}
