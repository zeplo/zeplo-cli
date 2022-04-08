import path from 'path'
import fs from 'fs-extra'

export const getPath = (...paths) => path.resolve(process.cwd(), ...paths)

export const createFile = (dir, name, content = '') => fs.outputFile(getPath(dir, name), content)

export const createJson = (dir, name, json) => fs.outputJson(getPath(dir, name), json)

export const removePath = (...paths) => fs.remove(getPath(...paths))

export const emptyPath = (...paths) => fs.emptyDir(getPath(...paths))

export const wait = timer => new Promise(resolve => setTimeout(resolve, timer))
