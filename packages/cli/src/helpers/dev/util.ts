import map from 'lodash/map'
import omit from 'lodash/omit'
import moment from 'moment'
import Cron from 'cron-converter'
import { Request } from '#/request'

export function getNextSchedule (data: Partial<Request>) {
  const {
    timezone, start = Date.now() / 1000, _source,
  } = data

  const { cron, interval } = _source || data

  const cronInstance = new Cron({
    timezone,
  })
  const nextSchedules = map(cron, (c) => {
    try {
      const schedule = cronInstance.fromString(c.join(' ')).schedule(moment(start * 1000))
      const next = schedule.next().valueOf() / 1000
      return next > start ? next : (schedule.next().valueOf() / 1000)
    } catch (e) {
      throw new Error('requests/invalid-cron')
    }
  })

  if (interval) {
    const num = parseFloat(`${interval}`)
    if (Number.isNaN(num)) throw new Error('requests/invalid-interval')
    if (num < 1) throw new Error('requests/min-interval-exceeded')
    nextSchedules.push(start + num)
  }

  return nextSchedules.length ? Math.min(...nextSchedules) : null
}

export function withoutFeatures (obj: Request) {
  return omit(obj, [
    'cron', 'interval', 'delay', 'delayuntil', 'throttle', // 'attempts' ?
  ])
}
