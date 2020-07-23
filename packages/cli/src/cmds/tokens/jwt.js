import apiRequest from '../../helpers/request'
import output from '../../helpers/output'
import { getSpaceNameWithoutConfig } from '../../helpers/space'
import { getServiceNameWithoutConfig } from '../../helpers/service'

export async function handler (args) {
  const namespace = await getSpaceNameWithoutConfig(args, true)
  const service = await getServiceNameWithoutConfig(args, false, namespace)

  // Add auth - get a temporary token
  const resp = await apiRequest(args, {
    url: '/tokens/services',
    method: 'POST',
    body: {
      namespace,
      service,
    },
  })

  output(resp.token, args)
  output.space(args)
}

export default {
  command: 'jwt',
  desc: 'Get a temporary JWT token',
  handler,
}
