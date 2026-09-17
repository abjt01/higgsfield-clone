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
export function route<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status)

      const message = err instanceof Error ? err.message : String(err)

      if (/DATABASE_URL|ECONNREFUSED|ENOTFOUND|connect|terminating connection/i.test(message)) {
        console.error('[route] database unavailable:', message)
        return fail('The database is unavailable. Try again shortly.', 503)
      }

      // Log the detail, return something that does not leak internals.
      console.error('[route] unhandled:', err)
      return fail('Something went wrong handling that request.', 500)
    }
  }
}
