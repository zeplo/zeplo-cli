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

  test('gets config for zeplo.json file', async () => {
    await createFile(args.dir, 'zeplo.json', '{"name": "zeplo-json-name"}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'zeplo-json-name',
    })
  })

  test('gets config for zeplo.yml file', async () => {
    await createFile(args.dir, 'zeplo.yml', 'name: zeplo-yml-name')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'zeplo-yml-name',
    })
  })

  test('gets config for .zeplorc file', async () => {
    await createFile(args.dir, 'zeplo.yml', 'name: zeplo-yml-name')
    await createFile(args.dir, '.zeplorc', '{"latest":{"name":"zeplo-rc-name"}}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'zeplo-rc-name',
    })
  })

  test('gets config for .zeplorc file with tag', async () => {
    await createFile(args.dir, 'zeplo.yml', 'name: zeplo-yml-name')
    await createFile(args.dir, '.zeplorc', '{"prod":{"name":"zeplo-rc-name-prod"}}')
    args.tag = 'prod'
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'zeplo-rc-name-prod',
    })
  })

  test('gets package file', async () => {
    await createFile(args.dir, 'package.json', '{"name":"zeplo-package-json","zeplo":{"command": "test"}}')
    const config = await getServiceConfig(args)
    expect(config).toEqual({
      name: 'zeplo-package-json',
      command: 'test',
    })
  })
})
