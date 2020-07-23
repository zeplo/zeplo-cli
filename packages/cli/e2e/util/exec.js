import execa from 'execa'
import path from 'path'

export const DOWN = '\x1B\x5B\x42'
export const UP = '\x1B\x5B\x41'
export const ENTER = '\x0D'

class Exec {
  constructor (cmd = 'node', file = './', options) {
    this.cmd = cmd
    this.file = file
    this.options = options

    this.proc = null
    this.exit = false
    this.stdout = ''
    this.stderr = ''
    this.signal = null
    this.promise = null
  }

  init (args = []) {
    const index = path.resolve(process.cwd(), this.file)
    const options = { stdio: [null, null, null] }
    const cmdArgs = ['--', index, ...args, ...(this.options.defaultArgs || [])]
    this.proc = execa(this.cmd, cmdArgs, options)
    this.proc.on('exit', (code, signal) => {
      this.exit = code
      this.signal = signal
    })
    this.proc.stdin.setEncoding('utf-8')

    // Pipe stdout/stderr in debug mode
    if (this.options.debug) {
      this.proc.stdout.pipe(process.stdout)
      this.proc.stderr.pipe(process.stderr)
    }

    // Capture progress of stdout/stderr
    this.proc.stdout.on('data', (data) => { this.stdout = this.stdout + data.toString() })
    this.proc.stderr.on('data', (data) => { this.stderr = this.stderr + data.toString() })

    this.promise = new Promise((resolve, reject) => {
      if (this.options.timeout) {
        setTimeout(() => reject(new Error(`Timeout from ${this.cmd} ${cmdArgs.join(' ')}: ${this.stdout}`)), this.options.timeout)
      }
      this.proc.then(({ stdout, stderr }) => {
        this.stdout = stdout
        this.stderr = stderr
        return this
      }).then(resolve, reject)
    }).catch(() => this)
    return this
  }

  run (...args) {
    const e = new Exec(this.cmd, this.file, this.options)
    e.init(args)
    return e
  }

  done () {
    return this.promise
  }

  wait () {
    return this.promise.then(() => {
      if (this.exit !== 0) throw new Error(`Invalid exit code ${this.exit}: ${this.stderr}`)
      return this
    })
  }

  waitForJson () {
    return this.promise.then(() => {
      if (this.exit !== 0) throw new Error(`Invalid exit code ${this.exit}: ${this.stderr}`)
      return JSON.parse(this.stdout)
    })
  }

  write (input) {
    this.proc.stdin.write(input)
  }

  enter () {
    this.write(ENTER)
  }

  kill (signal) {
    this.proc.kill(signal)
    return this.promise
  }

  async waitFor (strOrRegExp, requireMatch = true) {
    let hasMatch = false
    const promise = new Promise((resolve, reject) => {
      this.proc.stdout.on('data', (data) => {
        if (hasMatch) return
        const match = typeof strOrRegExp === 'string'
          ? data.toString().includes(strOrRegExp)
          : data.toString().match(strOrRegExp)
        if (match) {
          hasMatch = true
          resolve(data, this)
        }
      })
      this.proc.stdout.on('end', () => {
        if (requireMatch && !hasMatch) reject(new Error(`Did not match '${strOrRegExp}'. Recieved ${this.stdout}`))
        else resolve(null, this)
      })
    })
    return promise
  }
}

export default Exec
