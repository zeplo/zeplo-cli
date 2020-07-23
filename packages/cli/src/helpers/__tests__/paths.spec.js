import { getPath, createFile, remove } from './util'
import { getPaths } from '../paths'

describe('paths.spec', () => {
  let args

  beforeEach(async () => {
    args = {
      dir: getPath('fixtures/paths'),
    }
    await remove('fixtures/paths')
  })

  test('gets file from dir', async () => {
    await createFile(args.dir, 'b.js')
    const paths = await getPaths(args)
    expect(paths).toEqual([
      getPath(args.dir, 'b.js'),
    ])
  })

  test('ignores node_modules by default', async () => {
    await createFile(args.dir, 'node_modules/a.js')
    await createFile(args.dir, 'b.js')
    const paths = await getPaths(args)
    expect(paths).toEqual([
      getPath(args.dir, 'b.js'),
    ])
  })

  test('ignores files from .gitignore in root dir', async () => {
    await createFile(args.dir, 'a.js')
    await createFile(args.dir, 'b.js')
    await createFile(args.dir, '.gitignore', 'a.js')
    const paths = await getPaths(args)
    expect(paths).toEqual([getPath(args.dir, 'b.js'), getPath(args.dir, '.gitignore')])
  })

  test('ignores files from .gitignore in parent dir', async () => {
    await createFile(args.dir, '.gitignore', 'a.js')
    await createFile(args.dir, 'a.js')
    await createFile(args.dir, 'b.js')

    const paths = await getPaths(args)
    expect(paths).toEqual([getPath(args.dir, 'b.js'), getPath(args.dir, '.gitignore')])
  })

  test('ignores files from .dockerignore', async () => {
    await createFile(args.dir, 'a.js')
    await createFile(args.dir, 'b.js')
    await createFile(args.dir, '.dockerignore', 'a.js')
    const paths = await getPaths(args)
    expect(paths).toEqual([getPath(args.dir, 'b.js'), getPath(args.dir, '.dockerignore')])
  })

  test('adds environment_file if provided', async () => {
    await createFile(args.dir, '.env')
    args.environment_file = '.env'
    const paths = await getPaths(args)
    expect(paths).toEqual([getPath(args.dir, '.env')])
  })

  test('does not ignore files with . prefix', async () => {
    await createFile(args.dir, '.babelrc')
    const paths = await getPaths(args)
    expect(paths).toEqual([getPath(args.dir, '.babelrc')])
  })
})
