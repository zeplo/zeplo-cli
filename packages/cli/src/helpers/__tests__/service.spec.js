import Git from 'nodegit'
import { getPath, createFile, remove } from './util'
import { getServiceName } from '../service'

describe('service.spec', () => {
  let args

  beforeEach(async () => {
    args = {
      dir: getPath('fixtures/service'),
    }
    await remove('fixtures/service')
  })

  test('should get deployment name from args.name', async () => {
    args.name = 'args-name'
    const name = await getServiceName(args)
    expect(name).toBe('args-name')
  })

  test('should get deployment name from args.service', async () => {
    args.service = 'args-service'
    const name = await getServiceName(args)
    expect(name).toBe('args-service')
  })

  test('should get name from zeplo.json', async () => {
    await createFile(args.dir, 'zeplo.json', '{"name": "zeplo-json-name"}')
    const name = await getServiceName(args)
    expect(name).toBe('zeplo-json-name')
  })

  test('should get name from zeplo.yml', async () => {
    await createFile(args.dir, 'zeplo.yml', 'name: zeplo-yml-name')
    const name = await getServiceName(args)
    expect(name).toBe('zeplo-yml-name')
  })

  test('should get name from .zeplorc', async () => {
    await createFile(args.dir, 'zeplo.yml', 'name: zeplo-yml-name')
    await createFile(args.dir, '.zeplorc', '{"latest":{"name":"zeplo-rc-name"}}')
    const name = await getServiceName(args)
    expect(name).toBe('zeplo-rc-name')
  })

  test('should use git repo name', async () => {
    const repo = await Git.Repository.init(args.dir, 0)
    Git.Remote.setUrl(repo, 'origin', 'https://github.com/zeplo/zeplo-cli.git')
    const name = await getServiceName(args)
    expect(name).toBe('zeplo-cli')
  })

  test('should not error if git without remote-url', async () => {
    await Git.Repository.init(args.dir, 0)
    expect(() => getServiceName(args)).not.toThrow()
  })

  test('should get name for dir', async () => {
    const name = await getServiceName(args)
    expect(name).toBe('service')
  })
})
