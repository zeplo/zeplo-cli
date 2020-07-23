// import chalk from 'chalk'

export default function handlerError (err, exit) {
  console.log(err)
  if (exit !== false) process.exit(1)
}
