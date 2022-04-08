import filter from 'lodash/filter'

export const matchArr =
  (arr: any[], matcher: RegExp) => filter(arr, item => matcher.test(item)).shift()

export async function asyncForEach (array: any[], fn: (value: any, key: string|number) => any) {
  for (let i = 0; i < array.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fn(array[i], i)
    if (res !== undefined) {
      return res
    }
  }
  return null
}

export async function asyncMap (array: any[], fn: (value: any, key: string|number) => any) {
  const out = []
  for (let i = 0; i < array.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fn(array[i], i)
    out.push(res)
  }
  return out
}

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel: () => void
}

export function wait (timer: number): PromiseWithCancel<void> {
  let timeout: ReturnType<typeof setTimeout>|null
  const promise = new Promise((resolve) => { timeout = setTimeout(resolve, timer) }) as any
  promise.cancel = () => { if (timeout) { clearTimeout(timeout) } }
  return promise
}

export interface AttemptOptions {
  times?: number
  delay?: number
  exponential?: boolean
}

export async function attempt (fn: () => Promise<any>, opts?: AttemptOptions, count = 0): Promise<any> {
  const { times = 3, delay = 100, exponential = true } = opts || {}
  return fn().catch(async (err) => {
    if (count + 1 >= times) throw err
    await wait(delay * (exponential ? count + 1 : 1))
    return attempt(fn, opts, count + 1)
  })
}
