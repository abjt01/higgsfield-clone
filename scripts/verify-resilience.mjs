/**
 * Verifies the app degrades rather than 500s when the database is unreachable.
 *
 * Migrating a database fixes one outage; this stops the fragility coming back.
 * Every page must still render — the landing especially, since it has no real
 * dependency on the database and is the first thing anyone loads — and the API
 * must answer 503 with an explanation rather than a generic 500.
 *
 * Run against a server started with a deliberately bad DATABASE_URL:
 *   PORT=3100 DATABASE_URL=postgresql://nobody@localhost:5999/nope npm run start
 *   node scripts/verify-resilience.mjs
 */
const BASE = process.env.BASE ?? 'http://localhost:3100'
const SAMPLE_ID = process.env.SAMPLE_ID ?? '00000000-0000-4000-8000-000000000000'

let fail = 0
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ' :: ' + detail : ''}`)
  if (!ok) fail++
}

const status = async (path, init) => {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...init })
  return { code: res.status, body: await res.text() }
}

// Pages must render. A 500 here is the failure mode being guarded against.
for (const path of ['/', '/create', '/pricing', '/feed', '/library', `/g/${SAMPLE_ID}`]) {
  const { code } = await status(path)
  // A well-formed id that cannot be looked up renders the unavailable state,
  // not a 404, because "we could not look" is not "it does not exist".
  check(code === 200, `${path} renders with the database down`, `HTTP ${code}`)
}

// The landing must still be the landing, not a shell.
const { body: landing } = await status('/')
check(landing.includes('Direct the shot'), 'landing still renders its hero')
check(/camera moves/.test(landing), 'landing still renders the preset section')
check(!/Something went wrong/i.test(landing), 'landing shows no error boundary')

// APIs must say what is wrong, with the right status.
for (const path of ['/api/feed']) {
  const { code, body } = await status(path)
  check(code === 503, `${path} answers 503`, `HTTP ${code}`)
  check(/unavailable/i.test(body), `${path} explains itself`, body.slice(0, 80))
}

const post = await status('/api/generations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'resilience probe' }),
})
check(post.code === 503, 'POST /api/generations answers 503', `HTTP ${post.code}`)
check(/unavailable/i.test(post.body), 'POST explains itself', post.body.slice(0, 80))

// Session-shaped reads should degrade to "no session", not error.
const me = await status('/api/me')
check(me.code === 200, '/api/me degrades to 200', `HTTP ${me.code}`)
check(/"signedIn":false/.test(me.body), '/api/me reports no session', me.body.slice(0, 60))

// Nothing should leak internals.
const all = [landing, post.body, me.body].join(' ')
check(!/postgres(ql)?:\/\//i.test(all), 'no connection string leaked to the client')
check(!/ECONNREFUSED|Failed query|at Object\./i.test(all), 'no driver internals leaked to the client')

console.log(fail === 0 ? '\nRESILIENCE CHECKS PASSED' : `\n${fail} FAILURES`)
process.exit(fail === 0 ? 0 : 1)
