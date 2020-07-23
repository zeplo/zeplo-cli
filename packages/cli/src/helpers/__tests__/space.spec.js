import inquirer from 'inquirer'
// import cliSelect from 'cli-select'
import graphql from '../graphql'
import { getSpaceName, searchForSpaceName, askForSpace } from '../space'
import { getServiceConfig } from '../service.config'
import { getBasicConfig } from '../config'

jest.mock('inquirer')
jest.mock('cli-select')
jest.mock('../graphql')
jest.mock('../service.config')
jest.mock('../config')

describe('space.spec', () => {
  let args

  beforeEach(async () => {
    args = {}
  })

  describe('get space name', () => {
    test('returns undefined if no namespace found', async () => {
      const res = await getSpaceName(args)
      expect(res).toBeUndefined()
    })
  })

  describe('search for space name', () => {
    test('get namespace from args.namespace', async () => {
      args.namespace = 'custom-space'
      const name = await searchForSpaceName(args)
      expect(name).toBe('custom-space')
    })

    test('get namespace from args.n', async () => {
      args.n = 'custom-space'
      const name = await searchForSpaceName(args)
      expect(name).toBe('custom-space')
    })

    test('get namespace from args.service', async () => {
      args.service = 'custom-space/service'
      const name = await searchForSpaceName(args)
      expect(name).toBe('custom-space')
    })

    test('get namespace from config', async () => {
      getServiceConfig.mockResolvedValueOnce({
        name: 'config-space/service',
      })
      const name = await searchForSpaceName(args, true)
      expect(name).toBe('config-space')
    })

    test('get namespace from default config', async () => {
      getBasicConfig.mockResolvedValueOnce('custom-name')
      const name = await searchForSpaceName(args, true)
      expect(name).toBe('custom-name')
    })
  })

  describe('ask for a space name', () => {
    test('create space if no spaces exist', async () => {
      const name = 'new-space-name'
      graphql.mockResolvedValueOnce({ spaces: [] })

      inquirer.prompt.mockResolvedValue({ name })
      graphql.mockResolvedValueOnce({ space: { id: '123', name } })

      const res = await askForSpace(args)

      expect(res).toBe('new-space-name')
    })

    test('return selected space', async () => {
      graphql.mockResolvedValueOnce({
        spaces: [{ id: 's123', name: 'existing-space' }],
      })
      inquirer.prompt.mockResolvedValue({ name: 'existing-space' })

      const res = await askForSpace(args)

      expect(res).toBe('existing-space')
    })

    // test('error if no space is provided', () => {})
  })
})
