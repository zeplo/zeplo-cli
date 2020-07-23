import fs from 'fs-extra'
import graphql from '../graphql'
import { validateEnvVars, normalizeEnvVars } from '../env'

jest.mock('fs-extra')
jest.mock('../graphql')

describe('env.spec', () => {
  let args
  let config
  let namespace

  beforeEach(() => {
    args = {
      dir: '/root',
    }
    config = {}
    namespace = 'space'
    jest.clearAllMocks()
  })

  describe('normalize env vars', () => {
    test('normalizes string local env vars', () => {
      const res = normalizeEnvVars(['ENV_1=VAL_1', 'ENV_2=VAL_2'])
      expect(res).toEqual([{
        name: 'ENV_1',
        value: 'VAL_1',
      }, {
        name: 'ENV_2',
        value: 'VAL_2',
      }])
    })

    test('normalizes string gloval env vars', () => {
      const res = normalizeEnvVars(['ENV_1', 'ENV_2'])
      expect(res).toEqual([{
        name: 'ENV_1',
        valueFromGlobal: 'ENV_1',
      }, {
        name: 'ENV_2',
        valueFromGlobal: 'ENV_2',
      }])
    })

    test('normalizes object env vars', () => {
      const res = normalizeEnvVars([{
        name: 'ENV_1',
        value: 'VAL_1',
      }, {
        name: 'ENV_2',
        valueFromGlobal: 'ENV_2',
      }])
      expect(res).toEqual([{
        name: 'ENV_1',
        value: 'VAL_1',
      }, {
        name: 'ENV_2',
        valueFromGlobal: 'ENV_2',
      }])
    })
  })

  describe('validate env vars', () => {
    test('valid if no env vars are required', async () => {
      const res = await validateEnvVars(args, namespace, config)
      expect(res).toBe(false)
    })

    test('retruns array of missing env vars', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      const res = await validateEnvVars(args, namespace, config)
      expect(res).toEqual(['ENV_1', 'ENV_2'])
    })

    test('validates with config env_file', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      config.environment_file = './.env'
      fs.readFile.mockResolvedValueOnce(`
        ENV_1=VAL_1
        ENV_2=VAL_2
      `)

      const res = await validateEnvVars(args, namespace, config)

      expect(fs.readFile).toHaveBeenCalledTimes(1)
      expect(fs.readFile).toHaveBeenCalledWith('/root/.env')
      expect(res).toBe(false)
    })

    test('does not read env_file if not provided', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      fs.readFile.mockResolvedValueOnce(`
        ENV_1=VAL_1
        ENV_2=VAL_2
      `)

      await validateEnvVars(args, namespace, config)

      expect(fs.readFile).toHaveBeenCalledTimes(0)
    })

    test('validates with config local inline', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      config.environment = [
        'ENV_1=VAL_1',
        'ENV_2=VAL_2',
      ]

      const res = await validateEnvVars(args, namespace, config)

      expect(res).toBe(false)
    })

    test('partial missing local config env vars', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      config.environment = [
        'ENV_1=VAL_1',
      ]

      const res = await validateEnvVars(args, namespace, config)

      expect(res).toEqual(['ENV_2'])
    })

    test('validates with config global inline', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      config.environment = [
        'ENV_1',
        'ENV_2',
      ]

      graphql.mockResolvedValueOnce({
        variables: [{
          name: 'ENV_1',
        }, {
          name: 'ENV_2',
        }],
      })

      const res = await validateEnvVars(args, namespace, config)

      expect(res).toBe(false)
    })

    test('partial with config global inline', async () => {
      config.requires = ['ENV_1', 'ENV_2']
      config.environment = [
        'ENV_1',
        'ENV_2',
      ]

      graphql.mockResolvedValueOnce({
        variables: [{
          name: 'ENV_1',
        }],
      })

      const res = await validateEnvVars(args, namespace, config)

      expect(res).toEqual(['ENV_2'])
    })
  })
})
