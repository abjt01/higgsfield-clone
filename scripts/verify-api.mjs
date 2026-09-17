/**
 * Robustness suite for the API.
 *
 * Properties that unit tests miss and only show up under concurrency or
 * failure: credits going negative, a job being claimed twice, a job stranded
 * in "running", one session reading another's private generation, and a burst
 * producing 500s instead of 429s.
 *
 * Needs the app running against a disposable database — it truncates.
 *   PORT=3100 IMAGE_PROVIDER=stub npm run start
 *   node scripts/verify-api.mjs
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const sh = promisify(execFile)
const DB = process.env.PGDATABASE ?? 'higgsfield_dev'
const psql = async (q) => (await sh('psql', ['-d', DB, '-t', '-A', '-c', q])).stdout.trim()
const BASE = process.env.BASE ?? 'http://localhost:3100'

let fail = 0
const check = (ok, label, detail = '') => { console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ' :: ' + detail : ''}`); if (!ok) fail++ }

await psql('truncate users cascade')

// ---- 1. credits cannot go negative under concurrency ----------------------
const post = (body, cookie) => fetch(`${BASE}/api/generations`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
})

/**
 * The in-memory per-IP limiter is shared by everything hitting this server, so
 * a preceding suite can leave it saturated. Wait for capacity rather than
 * failing with a confusing null cookie.
 */
async function openSession() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await post({ prompt: 'seed' })
    const setCookie = res.headers.get('set-cookie')
    if (res.ok && setCookie) {
      await res.json()
      return setCookie.split(';')[0]
    }
    await res.text()
    if (res.status !== 429) throw new Error(`could not open a session: HTTP ${res.status}`)
    process.stdout.write('  ..  rate limited, waiting for the window to clear\n')
    await new Promise((r) => setTimeout(r, 10_000))
  }
  throw new Error('rate limit never cleared; run this suite first or wait a minute')
}

const cookie = await openSession()

/**
 * A POST that must succeed for the suite to continue. Waits out the rate limit
 * rather than proceeding with an undefined id. The burst test below uses the
 * raw post() on purpose, since being limited is the thing it asserts.
 */
async function postOk(body, ck) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await post(body, ck)
    if (res.ok) return res
    await res.text()
    if (res.status !== 429) throw new Error(`setup POST failed: HTTP ${res.status}`)
    process.stdout.write('  ..  rate limited, waiting\n')
    await new Promise((r) => setTimeout(r, 10_000))
  }
  throw new Error('setup POST never got through the rate limiter')
}

const userId = await psql('select id from users limit 1')
await psql(`update users set credits = 1 where id = '${userId}'`)

const results = await Promise.all(Array.from({ length: 5 }, () => post({ prompt: 'race' }, cookie)))
const codes = results.map((r) => r.status)
const ok202 = codes.filter((c) => c === 202).length
const paid = codes.filter((c) => c === 402).length
const credits = Number(await psql(`select credits from users where id = '${userId}'`))

check(ok202 === 1, '1 credit + 5 concurrent requests -> exactly one succeeds', `202s=${ok202} 402s=${paid} codes=${codes.join(',')}`)
check(credits >= 0, 'credits never go negative', `credits=${credits}`)

// ---- 2. atomic job claim: a job is never processed twice -------------------
await psql(`update users set credits = 50 where id = '${userId}'`)
const r = await postOk({ prompt: 'claim test' }, cookie)
const { id } = await r.json()
// wait for it to settle, then count how many times attempts incremented
await new Promise((res) => setTimeout(res, 2500))
const attempts = Number(await psql(`select j.attempts from jobs j join generations g on g.id=j.generation_id where g.id='${id}'`))
check(attempts === 1, 'job claimed exactly once', `attempts=${attempts}`)

// ---- 3. stale running job is reaped on read --------------------------------
const gen2 = await postOk({ prompt: 'stale test' }, cookie)
const { id: id2 } = await gen2.json()
await new Promise((res) => setTimeout(res, 2000))
const before = Number(await psql(`select credits from users where id='${userId}'`))
await psql(`update jobs set status='running', updated_at = now() - interval '10 minutes' where generation_id='${id2}'`)
const polled = await (await fetch(`${BASE}/api/generations/${id2}`, { headers: { cookie } })).json()
const after = Number(await psql(`select credits from users where id='${userId}'`))
check(polled.status === 'failed', 'stale running job reaped on poll', `status=${polled.status}`)
check(/worker stopped/i.test(polled.error ?? ''), 'reaped job explains itself', polled.error ?? '')
check(after === before + 1, 'reaped job refunds the credit', `${before} -> ${after}`)

// ---- 4. another user cannot read a private generation ----------------------
const other = await postOk({ prompt: 'other user' })
const otherCookie = other.headers.get('set-cookie').split(';')[0]
await other.json()

// Generations default to public, so make a private one explicitly rather than
// assuming the earlier fixture is private.
const priv = await postOk({ prompt: 'private one', visibility: 'private' }, cookie)
const { id: privId } = await priv.json()

const leak = await fetch(`${BASE}/api/generations/${privId}`, { headers: { cookie: otherCookie } })
check(leak.status === 404, 'private generation is not readable by another session', `status=${leak.status}`)

const ownerRead = await fetch(`${BASE}/api/generations/${privId}`, { headers: { cookie } })
check(ownerRead.status === 200, 'private generation is readable by its owner', `status=${ownerRead.status}`)

const publicRead = await fetch(`${BASE}/api/generations/${id}`, { headers: { cookie: otherCookie } })
check(publicRead.status === 200, 'public generation is readable by anyone', `status=${publicRead.status}`)

// ---- 5. rate limit returns 429, not a 500 ----------------------------------
const burst = await Promise.all(Array.from({ length: 14 }, () => post({ prompt: 'burst' }, cookie)))
const burstCodes = [...new Set(burst.map((b) => b.status))].sort()
check(burstCodes.includes(429), 'burst is rate limited', `codes=${burstCodes.join(',')}`)
check(!burstCodes.includes(500), 'no 500s under burst', `codes=${burstCodes.join(',')}`)

console.log(fail === 0 ? '\nROBUSTNESS CHECKS PASSED' : `\n${fail} FAILURES`)
process.exit(fail === 0 ? 0 : 1)
