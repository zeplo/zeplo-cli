import path from 'path'
import dotenv from 'dotenv'

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

//
// ENV VARIABLES
//

if (process.env.ENV_FILE) {
  dotenv.config({ path: path.resolve(__dirname, '../', process.env.ENV_FILE) })
}

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.dev') })
}

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') })
}

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') })
}
