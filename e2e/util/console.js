/* eslint-disable class-methods-use-this */

class ConsoleSpy {
  constructor () {
    this._original = {
      exit: process.exit,
      emit: process.emit,
      env: process.env,
      argv: process.argv,
      error: console.error,
      log: console.log,
      warn: console.warn,
    }
    this.reset()
  }

  reset () {
    this.logs = []
    this.errors = []
    this.warnings = []
    this.exit = false
  }

  async run (fn) {
    this.mock()
    return new Promise((resolve, reject) => {
      process.exit = (exitCode) => {
        this.exit = exitCode
        this.restore()
        resolve(exitCode)
      }
      process.emit = function emit (ev, value) {
        if (ev === 'uncaughtException') {
          this.restore()
          return reject(value)
        }
        // eslint-disable-next-line
        return this._original.emit.apply(this, arguments)
      }
      fn()
    })
  }

  mock () {
    console.error = (msg) => { this.errors.push(msg) }
    console.log = (msg) => { this.logs.push(msg) }
    console.warn = (msg) => { this.warnings.push(msg) }
  }

  restore () {
    const {
      exit, emit, env, argv, error, log, warn,
    } = this._original

    process.exit = exit
    process.emit = emit
    process.env = env
    process.argv = argv

    console.error = error
    console.log = log
    console.warn = warn
  }
}

export default ConsoleSpy
