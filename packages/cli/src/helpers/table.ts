import chalk from 'chalk'
import Table, { CellValue, HorizontalTable } from 'cli-table2'

const chars = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: '',
}

const NO_RESOURCE_MSG = `
  0 resources found.
`

export interface CreateTableColumn {
  name: string
  key: string|((row: any) => string)
}

export type CreateTableRow = Record<string, CellValue>

export default function createTable (columns: CreateTableColumn[], rows: CreateTableRow[]) {
  if (!rows || rows.length === 0) {
    return NO_RESOURCE_MSG
  }
  const head = columns.map(({ name }) => chalk.grey(name))
  const data = rows.map(row => columns.map(({ key }) => {
    return typeof key === 'function' ? key(row) : row[key]
  }))

  const table = new Table({
    head,
    style: {
      head: [],
      border: ['black'],
    },
    chars,
  }) as HorizontalTable

  table.push(...data)

  return table.toString()
}
