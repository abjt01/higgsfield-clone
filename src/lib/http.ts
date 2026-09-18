import { NextResponse } from 'next/server'

export const NO_STORE = { 'Cache-Control': 'no-store' } as const

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status)
}

/** Thrown by validators; carries the status the client should see. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/**
 * Wrap a route handler so nothing escapes as an unhandled 500 with a stack.
 *
 * Bad input previously reached Postgres and came back as an empty 500: an
 * invalid uuid or a non-date cursor is a client error, and a database being
 * unreachable is a 503, not a generic failure.
 */
/** Postgres and socket codes that mean "the database is not reachable". */
const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'EPIPE',
  'ECONNRESET',
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
  '53300', // too_many_connections
])

/**
 * Whether an error means the database was unreachable rather than the request
 * being wrong.
 *
 * Drizzle wraps driver errors, so the outer message is the SQL that failed and
 * the useful signal is a `code` further down the cause chain. Matching only on
 * the outer message made every connection failure a generic 500.
 */
export function isDbUnavailable(err: unknown, depth = 0): boolean {
  if (!err || depth > 5) return false

  if (typeof err === 'object') {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string' && UNAVAILABLE_CODES.has(code)) return true

    // AggregateError from a multi-address connect attempt.
    const errors = (err as { errors?: unknown }).errors
    if (Array.isArray(errors) && errors.some((e) => isDbUnavailable(e, depth + 1))) return true

    if (isDbUnavailable((err as { cause?: unknown }).cause, depth + 1)) return true
  }

  const message = err instanceof Error ? err.message : ''
  return /DATABASE_URL is not set|terminating connection|server closed the connection/i.test(message)
}

/**
 * Wrap a route handler so nothing escapes as an unhandled 500 with a stack.
 *
 * Bad input previously reached Postgres and came back as an empty 500: an
 * invalid uuid or a non-date cursor is a client error, and a database being
 * unreachable is a 503, not a generic failure.
 */
export function route<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status)

      if (isDbUnavailable(err)) {
        console.error('[route] database unavailable')
        return fail('The database is unavailable. Try again shortly.', 503)
      }

      // Log the detail, return something that does not leak internals.
      console.error('[route] unhandled:', err)
      return fail('Something went wrong handling that request.', 500)
    }
  }
}
