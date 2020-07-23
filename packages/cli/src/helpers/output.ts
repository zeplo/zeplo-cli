import chalk from 'chalk'
import forEach from 'lodash/forEach'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import createTable, { CreateTableColumn } from './table'
import { GlobalArgs } from '#/types'

const pad = (padding: number) => (new Array(padding)).fill(' ').join('')
const padLeft = (str: string, padding: number) => `${pad(padding)}${str}`

function output (msg: string, args: GlobalArgs) {
  if (args?.q || args?.quiet) return
  console.log(msg)
}

output.block = function outputImage (msg: string, args: GlobalArgs) {
  output(['', msg, ''].join('\n'), args)
}

output.error = function outputError (msg: string, args: GlobalArgs, exit = true) {
  console.error(chalk.red(msg))
  if (exit) process.exit(1)
}

output.warn = function outputWarn (msg: string, args: GlobalArgs) {
  output(`${chalk.cyan('[WARN]')} ${msg}`, args)
}

output.success = function outputSuccess (msg: string, args: GlobalArgs) {
  output(chalk.green(msg), args)
}

output.info = function outputInfo (msg: string, args: GlobalArgs) {
  output(`${chalk.cyan('[INFO]')} ${msg}'`, args)
}

output.accent = function outputAccent (msg: string, args: GlobalArgs) {
  output(`${chalk.grey('>')} ${msg}`, args)
}

output.space = function outputSpace (args: GlobalArgs) {
  output('', args)
}

output.record = function outputRecord (record: Record<string, any>, args: GlobalArgs, padding = 0) {
  let length = 0

  // Get the maximum length
  forEach(record, (val, key) => {
    length = Math.max(key.length + 2, length)
  })

  forEach(record, (val, key) => {
    const name = `${key}:`
    if (isPlainObject(val) || isArray(val)) {
      output(padLeft(name, padding), args)
      output.record(val, args, padding + 2)
    } else {
      const basicVal = `${name} ${val}`
      output(padLeft(basicVal, padding), args)
    }
  })
}

output.header = function outputHeader (title: string, args: GlobalArgs) {
  const len = title.length
  const line = new Array(len + 2).join('=')
  output(line, args)
  output(title.toUpperCase(), args)
  output(line, args)
}

output.table = function outputTable (columns: CreateTableColumn[], data: any[], args: GlobalArgs) {
  if (args.json) {
    return output(JSON.stringify(data, null, 2), args)
  }
  return output.block(createTable(columns, data), args)
}

output.json = function outputJson (data: any, args: GlobalArgs) {
  output(JSON.stringify(data, null, 2), args)
}

export default output
