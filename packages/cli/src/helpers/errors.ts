// import chalk from 'chalk'

export default function handlerError (err: string, exit?: boolean) {
  console.log(err)
  if (exit !== false) process.exit(1)
}
