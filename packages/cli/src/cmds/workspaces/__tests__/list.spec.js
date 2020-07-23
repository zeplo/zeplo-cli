import yargs from 'yargs'
import { handler } from '../list'
import output from '../../../helpers/output'
import graphql from '../../../helpers/graphql'
// import createTable from '../../../helpers/table'

jest.mock('../../../helpers/graphql')
jest.mock('../../../helpers/output')
jest.mock('../../../helpers/table')

describe('cmds/spaces.spec', () => {
  beforeEach(() => {
    output.block.mockReset()
  })

  test('spaces list with no spaces', async () => {
    graphql.mockResolvedValue({ spaces: [] })

    const args = yargs.parse(['spaces', '--token', 'x123'])

    await handler(args)

    expect(output.table).toHaveBeenCalledTimes(1)
  })
})
