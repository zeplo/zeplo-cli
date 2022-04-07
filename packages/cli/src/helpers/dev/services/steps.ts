import { createStepsJobs } from '@zeplo/util'
import { Request } from 'express'
import { forEach } from 'lodash'
import { getWorkspace } from './workspace'
import { jobs } from './jobs'

export function stepHandler (args: any, req: Request) {
  const workspace = getWorkspace(args)
  const { id, jobs: steps } = createStepsJobs(workspace, req)

  forEach(steps, (step) => {
    jobs[step.id] = {
      request: step,
      delay: step.delayuntil ?? 0,
    }
  })

  return { id }
}
