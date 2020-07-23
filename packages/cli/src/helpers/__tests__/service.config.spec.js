import { getPath, createFile, remove } from './util'
import { getServiceConfig } from '../service.config'

describe('service.config.spec', () => {
  let args

  beforeEach(async () => {
    args = {
      dir: getPath('fixtures/service-config'),
    }
    await remove('fixtures/service-config')
  })

  test('gets config for ralley.json file', async () => {
    await createFile(args.dir, 'ralley.json', '{"name": "ralley-json-name"}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'ralley-json-name',
    })
  })

  test('gets config for ralley.yml file', async () => {
    await createFile(args.dir, 'ralley.yml', 'name: ralley-yml-name')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'ralley-yml-name',
    })
  })

  test('gets config for .ralleyrc file', async () => {
    await createFile(args.dir, 'ralley.yml', 'name: ralley-yml-name')
    await createFile(args.dir, '.ralleyrc', '{"latest":{"name":"ralley-rc-name"}}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'ralley-rc-name',
    })
  })

  test('gets config for .ralleyrc file with tag', async () => {
    await createFile(args.dir, 'ralley.yml', 'name: ralley-yml-name')
    await createFile(args.dir, '.ralleyrc', '{"prod":{"name":"ralley-rc-name-prod"}}')
    args.tag = 'prod'
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'ralley-rc-name-prod',
    })
  })

  test('gets package file', async () => {
    await createFile(args.dir, 'package.json', '{"name":"ralley-package-json","ralley":{"command": "test"}}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'ralley-package-json',
      command: 'test',
    })
  })
})
