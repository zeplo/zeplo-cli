import fs from 'fs-extra'
import shajs from 'sha.js'
import keyBy from 'lodash/keyBy'
import { getPaths } from './paths'
import output from './output'
import request from './request'
import graphql from './graphql'
import { attempt } from './util'

export const ArtifactsQuery = `
query ArtifactsQuery ($where: ArtifactWhereInput, $space: SpaceUniqueInput, $first: Int) {
  artifacts (where: $where, space: $space, first: $first) {
    sha
  }
}
`

export default async function uploadFiles (args, spaceName) {
  const files = await getPaths(args)

  if (!files) return []

  if (files.length > 1000) {
    throw new Error(`Maximum file upload exceded - max 1000, received ${files.length}`)
  }

  const filteredFiles = args.force
    ? files.map(filePath => ({ filePath }))
    : await filterCachedFiles(args, spaceName, files)

  const promises = filteredFiles.map(async ({ filePath, cached }) => {
    if (cached) {
      output(`Using cache ${filePath}`)
      return true
    }
    output(`Uploading ${filePath}`, args)
    const stream = fs.createReadStream(filePath)
    return attempt(() => request(args, {
      url: '/files',
      method: 'POST',
      body: stream,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      qs: {
        space: spaceName,
      },
      json: false,
    }, true), { times: 3, delay: 500 })
  })

  await Promise.all(promises).catch((err) => {
    if (err.statusCode !== 401 && err.statusCode !== 403) output.error('Unable to upload files to Zeplo, please try again.')
    throw err
  })

  return filteredFiles
}

export async function filterCachedFiles (args, spaceName, files) {
  // Get files SHA256
  const filesSha = await getShaForFiles(files)

  // Lookup to see if we have any of these files
  const resp = await graphql(args, ArtifactsQuery, {
    first: 1000,
    space: { name: spaceName },
    where: {
      sha_in: filesSha.map(({ sha }) => sha),
    },
  })

  const cachedFiles = keyBy(resp.artifacts, 'sha')

  return filesSha.map(({ sha, filePath }) => ({
    sha, filePath, cached: !!cachedFiles[sha],
  }))
}

export async function getShaForFiles (files) {
  return Promise.all(files.map(async (filePath) => {
    return new Promise((resolve) => {
      const stream = fs.createReadStream(filePath)
      const sha = shajs('sha256')
      stream.on('data', (data) => {
        sha.update(data)
      })
      stream.on('end', () => resolve({
        sha: sha.digest('hex'),
        filePath,
      }))
    })
  }))
}
