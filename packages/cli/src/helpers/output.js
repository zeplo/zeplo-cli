import chalk from 'chalk'
import forEach from 'lodash/forEach'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import createTable from './table'
// import pad from 'pad'

const pad = padding => (new Array(padding)).fill(' ').join('')
const padLeft = (str, padding) => `${pad(padding)}${str}`
// const padRight = (str, padding) => `${str}${pad(padding)}`

function output (msg, args = {}) {
  if (args.q || args.quiet) return
  console.log(msg)
}

output.block = function outputImage (msg, args) {
  output(['', msg, ''].join('\n'), args)
}

output.error = function outputError (msg, args, exit = true) {
  console.error(chalk.red(msg))
  if (exit) process.exit(1)
}

output.warn = function outputWarn (msg, args) {
  output(`${chalk.cyan('[WARN]')} ${msg}`, args)
}

output.success = function outputSuccess (msg, args) {
  output(chalk.green(msg), args)
}

output.info = function outputInfo (msg, args) {
  output(`${chalk.cyan('[INFO]')} ${msg}'`, args)
}

output.accent = function outputAccent (msg, args) {
  output(`${chalk.grey('>')} ${msg}`, args)
}

output.space = function outputSpace (args) {
  output('', args)
}

output.record = function outputRecord (record, args, padding = 0) {
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

output.header = function outputHeader (title, args) {
  const len = title.length
  const line = new Array(len + 2).join('=')
  output(line, args)
  output(title.toUpperCase(), args)
  output(line, args)
}

output.table = function outputTable (columns, data, args) {
  if (args.json) {
    return output(JSON.stringify(data, null, 2), args)
  }
  return output.block(createTable(columns, data), args)
}

output.json = function outputJson (data, args) {
  output(JSON.stringify(data, null, 2), args)
}

export default output
