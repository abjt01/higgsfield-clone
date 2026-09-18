import { isDbUnavailable } from './http'

/**
 * Run a database read that must not be able to take a page down.
 *
 * Server components throw straight into the error boundary, so a single
 * decorative query against an unreachable database turns the whole route into
 * a 500. The landing page is the worst place for that: it has no dependency on
 * the database beyond one community strip, and it is the page a reviewer or a
 * search crawler hits first.
 *
 * Returns null on failure. Callers decide whether that means "hide this
 * section" or "say the database is unavailable" — the distinction matters, so
 * it is not hidden behind a default value here.
 */
export async function safeQuery<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    // The wrapped SQL is pages long and tells you nothing; the reason does.
    const reason = isDbUnavailable(err) ? 'database unavailable' : String(err).slice(0, 160)
    console.error(`[safe-db] ${label} degraded: ${reason}`)
    return null
  }
}
