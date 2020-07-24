import fs from 'fs-extra'
import getConfigPath from '../config'
import { Request } from './request'
import { merge } from 'lodash'

export interface RequestJob {
  delay: number
  request: Request
}

export const jobs: Record<string, RequestJob> = {}

export function getJobsPath (args: any) {
  const workspace = args.w || args.workspace || 'default'
  const path = `${getConfigPath(args)}/jobs.${workspace}.json`
  return path
}

export async function saveJobs (args: any) {
  await fs.outputJson(getJobsPath(args), jobs, {
    spaces: 2,
  })
  return jobs
}

export async function loadJobs (args: any) {
  const jobsPath = getJobsPath(args)
  if (!fs.existsSync(jobsPath)) return
  const json = await fs.readJson(jobsPath)
  merge(jobs, json)
}

export async function resetJobs (args: any) {
  await fs.outputJson(getJobsPath(args), {}, {
    spaces: 2,
  })
  return jobs
}
