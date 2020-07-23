import { getPath, createFile, remove } from './util'
import { getLanguage } from '../lang'

describe('helpers/lang.spec', () => {
  let args

  beforeEach(async () => {
    args = {
      dir: getPath('fixtures/lang'),
    }
    await remove('fixtures/lang')
  })

  test('docker language is identified', async () => {
    await createFile(args.dir, 'Dockerfile')
    const lang = await getLanguage(args)
    expect(lang).toEqual('docker')
  })

  test('nodejs language is identified', async () => {
    await createFile(args.dir, 'package.json', '{}')
    const lang = await getLanguage(args)
    expect(lang).toEqual('nodejs')
  })

  test('ruby language is identified', async () => {
    await createFile(args.dir, 'Gemfile')
    const lang = await getLanguage(args)
    expect(lang).toEqual('ruby')
  })

  test('php language is identified', async () => {
    await createFile(args.dir, 'composer.json')
    const lang = await getLanguage(args)
    expect(lang).toEqual('php')
  })

  test('java language is identified', async () => {
    await createFile(args.dir, 'pom.xml')
    const lang = await getLanguage(args)
    expect(lang).toEqual('java-mvn')
  })

  test('docker language is given priority', async () => {
    await createFile(args.dir, 'Dockerfile')
    await createFile(args.dir, 'package.json', '{}')
    const lang = await getLanguage(args)
    expect(lang).toEqual('docker')
  })
})
