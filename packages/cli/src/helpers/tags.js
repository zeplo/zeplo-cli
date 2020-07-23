import { askForService } from './service'

export async function getServiceAndTag (args, force) {
  let { tag, service } = args

  

  if (force) {
    return askForService(args, spaceName)
  }

  return undefined
}
