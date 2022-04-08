import path from 'path'
import fs from 'fs-extra'

export const getPath = (...paths) => path.resolve(__dirname, ...paths)

export const createFile = (dir, name, content = '') => fs.outputFile(getPath(dir, name), content)

export const remove = (...paths) => fs.remove(getPath(...paths))
