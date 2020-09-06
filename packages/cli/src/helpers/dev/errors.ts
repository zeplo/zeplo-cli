export const ERROR_CODES = {
  'invalid-argument': 400,
  'failed-precondition': 400,
  'out-of-range': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  aborted: 409,
  'already-exists': 409,
  'resource-exhausted': 429,
  cancelled: 499,
  unavailable: 500,
  internal: 500,
  'deadline-exceeded': 504,
} as any

export const ERROR_REASONS = {
  'not-found': { code: 'not-found', message: 'Not found' },
  'server-error': { code: 'internal', message: 'An internal error occured' },
  'permission-denied': { code: 'permission-denied', message: 'Permission denied' },
  'required-fields': { code: 'invalid-argument', message: 'Required field is missing' },
  'requests/invalid-state': { code: 'failed-precondition', message: 'Request state is invalid' },
}

export interface HttpError extends Error {
  statusCode: number
  code?: keyof typeof ERROR_CODES
  reason?: keyof typeof ERROR_REASONS
}

export default function createError (code: keyof typeof ERROR_REASONS) {
  const reason = ERROR_REASONS[code]
  const statusCode = ERROR_CODES[reason.code]
  const err = new Error(reason.message) as HttpError
  err.statusCode = statusCode
  return err
}
