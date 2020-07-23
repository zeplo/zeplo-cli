export default `
const http = require('http')
const path = require('path')
const fs = require('fs')
const directoryPath = path.join(__dirname)
const ls = fs.readdirSync(directoryPath)
http.createServer((req, res) => {
  const { method, url, headers } = req
  const body = []
  req.on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    res.write(JSON.stringify({
      req: { method, url, headers, body: Buffer.concat(body).toString() },
      env: process.env,
      cmd: process.argv,
      ls,
    }))
    res.end()
  })
}).listen(process.env.PORT)

`
export const serverWithText = text => `
const http = require('http')
http.createServer((req, res) => {
  res.write("${text}")
  res.end()
}).listen(process.env.PORT)
`
