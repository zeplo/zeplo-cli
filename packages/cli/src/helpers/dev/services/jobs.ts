import fs from 'fs-extra'
import { Request } from '@zeplo/types/request'
import getConfigPath from '../../config'
import { merge, forEach } from 'lodash'

export interface RequestJob {
  // delay: number
  request: Request
  cursor?: string
}

export interface PartialRequestJob {
  delay?: number
  request: Partial<Request>
}

export const jobs: Record<string, RequestJob> = {}

export function getJobsPath (args: any) {
  const [workspace] = (args.workspace || 'default').split(':')
  const path = `${getConfigPath(args)}/jobs.${workspace}.json`
  return path
}

export async function saveJobs (args: any) {
  await fs.outputJson(getJobsPath(args), jobs ?? {}, {
    spaces: 2,
  })
  return jobs
}

export async function getSavedJobs (args: any) {
  const jobsPath = getJobsPath(args)
  if (!fs.existsSync(jobsPath)) return
  try {
    return fs.readJson(jobsPath)
  } catch (e) {
    return {}
  }
}

export async function loadSavedJobs (args: any) {
  if (args.reset) return resetSavedJobs(args, true)
  const json = await getSavedJobs(args)
  merge(jobs, json)
}

export async function resetSavedJobs (args: any, hard: boolean) {
  forEach(jobs, (_, jobId) => {
    const status = jobs[jobId].request.status
    if (hard || status === 'SUCCESS' || status === 'ERROR') delete jobs[jobId]
  })
  await saveJobs(args)
  return jobs
}
