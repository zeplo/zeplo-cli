import fs from 'fs-extra'
import path from 'path'
import Exec from './util/exec'

const fixturesPath = path.resolve(process.cwd(), 'e2e/fixtures/init')

xdescribe('init.e2e', () => {
  let exec = null

  beforeEach(async () => {
    exec = new Exec('babel-node', './src/index.js', {
      defaultArgs: ['--ignore-updates'],
      // debug: true,
    })

    await fs.emptyDir(fixturesPath)
  })

  test('init bash script matches snapshot', async () => {
    const run = await exec.run('init', './e2e/fixtures/init/bash-run', '--template', 'bash-run', '--name', 'bash-script').wait()
    expect(run.stdout).toMatchSnapshot()
  })

  test('init asks before overwriding directory', async () => {
    await fs.outputJson(path.resolve(fixturesPath, './bash-run/test.json'), { a: 1 })
    const init = exec.run('init', './e2e/fixtures/init/bash-run', '--template', 'bash-run', '--name', 'bash-script')

    await init.waitFor('Overwrite')
    init.enter()
    await init.done()

    expect(init.stdout).toMatchSnapshot()
  })

  test('init asks the user for name and template', async () => {
    const init = exec.run('init', path.resolve(fixturesPath, './service'))

    await init.waitFor('name')
    init.write('test-service')
    init.enter()

    await init.waitFor('template')
    init.enter()

    const { stdout } = await init.done()
    expect(stdout).toMatchSnapshot()
  })

  test('init creates .ralleyrc file with service name', async () => {
    const ralleyrc = path.resolve(fixturesPath, './bash-run/.ralleyrc')
    await exec.run('init', './e2e/fixtures/init/bash-run', '--template', 'bash-run', '--name', 'bash-name').wait()

    const exists = await fs.pathExists(ralleyrc)
    expect(exists).toBe(true)

    const json = await fs.readFile(ralleyrc, 'utf8')
    expect(json).toMatchSnapshot()
  })
})
