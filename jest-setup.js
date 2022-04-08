import dotenv from 'dotenv'
import path from 'path'

/* istanbul ignore next */
if (typeof process === 'object' && !global.unhandledRejection) {
  global.unhandledRejection = true
  process.on('unhandledRejection', (error) => {
    console.error(error)
  })
}

if (process.env.ENV_FILE) {
  dotenv.config({
    path: path.resolve(__dirname, process.env.ENV_FILE),
  })
} else if (process.env.NODE_ENV === 'test') {
  dotenv.config({
    path: path.resolve(__dirname, './.env.test'),
  })
}
