export const matchArr =
  (arr, matcher) => arr.filter(item => matcher.test(item)).shift()

export function forEach (array, fn) {
  for (let i = 0; i < array.length; i += 1) {
    const res = fn(array[i], i)
    if (res !== undefined) {
      return res
    }
  }
  return null
}

export async function asyncForEach (array, fn) {
  for (let i = 0; i < array.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fn(array[i], i)
    if (res !== undefined) {
      return res
    }
  }
  return null
}

export async function asyncMap (array, fn) {
  const out = []
  for (let i = 0; i < array.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fn(array[i], i)
    out.push(res)
  }
  return out
}

export async function wait (timer) {
  let timeout = null
  const promise = new Promise((resolve) => { timeout = setTimeout(resolve, timer) })
  promise.timeout = timeout
  return promise
}

export async function attempt (fn, opts, count = 0) {
  const { times = 3, delay = 100, exponential = true } = opts || {}
  return fn().catch(async (err) => {
    if (count + 1 >= times) throw err
    await wait(delay * (exponential ? count + 1 : 1))
    return attempt(fn, opts, count + 1)
  })
}
