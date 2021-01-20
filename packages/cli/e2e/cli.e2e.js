import Exec from './util/exec'

xdescribe('cli.spec', () => {
  let exec = null

  beforeEach(() => {
    exec = new Exec('babel-node', './src/index.js')
  })

  test('client help command runs and exits', async () => {
    const run = await exec.run('-h').wait()
    expect(run.stdout).toMatch('Usage: zeplo <command> [options]')
  })

  test('client help command matches snapshot', async () => {
    const run = await exec.run('-h').wait()
    expect(run.stdout).toMatchSnapshot()
  })
})
