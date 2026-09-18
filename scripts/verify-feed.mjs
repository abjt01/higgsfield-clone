/**
 * Verifies the feed, library, share pages, remix and OG images.
 *
 * Focus is on the properties that are easy to get quietly wrong: keyset
 * pagination that duplicates or skips rows, a feed query that degrades into an
 * N+1, and one session reading another's private work.
 *
 *   node scripts/seed-feed.mjs 60
 *   PORT=3100 IMAGE_PROVIDER=stub npm run start
 *   node scripts/verify-feed.mjs
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const sh = promisify(execFile)
const DB = process.env.PGDATABASE ?? 'higgsfield_dev'
const psql = async (q) => (await sh('psql', ['-d', DB, '-t', '-A', '-c', q])).stdout.trim()
const BASE = process.env.BASE ?? 'http://localhost:3100'

let fail = 0
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ' :: ' + detail : ''}`)
  if (!ok) fail++
}
const get = (p, cookie) => fetch(`${BASE}${p}`, { headers: cookie ? { cookie } : {}, cache: 'no-store' })

// ---- fixtures --------------------------------------------------------------
// Self-seeding. verify-api truncates the database, so depending on a previous
// step having seeded made this suite pass or fail on run order rather than on
// the code. CI still seeds explicitly; this makes local runs order-independent.
const MIN_ROWS = 40
const existing = Number(await psql("select count(*) from generations where visibility='public'"))
if (existing < MIN_ROWS) {
  console.log(`  ..  only ${existing} public rows, seeding fixtures`)
  await sh('node', ['scripts/seed-feed.mjs', '60'], { env: process.env })
}

// ---- feed shape ------------------------------------------------------------
const p1 = await (await get('/api/feed?limit=10')).json()
check(p1.items.length === 10, 'feed returns a full page', `${p1.items.length} items`)
check(Boolean(p1.nextCursor), 'feed hands back a cursor', p1.nextCursor ?? 'none')

const card = p1.items[0]
check(Boolean(card.author), 'card carries the author (the one join)', card.author)

// Pick a card that has presets rather than assuming the newest one does: this
// script injects a preset-less row later on to test mid-scroll inserts, and it
// survives into the next run.
const withPresets = p1.items.find((i) => i.camera && i.style)
check(Boolean(withPresets), 'card carries preset labels',
  withPresets ? `${withPresets.camera.label} / ${withPresets.style.label}` : 'none found')

// ---- keyset pagination -----------------------------------------------------
const p2 = await (await get(`/api/feed?limit=10&cursor=${encodeURIComponent(p1.nextCursor)}`)).json()
const ids1 = p1.items.map((i) => i.id)
const ids2 = p2.items.map((i) => i.id)
check(ids2.length === 10, 'second page is full', `${ids2.length}`)
check(!ids1.some((id) => ids2.includes(id)), 'no overlap between pages')

const t1 = p1.items.map((i) => Date.parse(i.createdAt))
check(t1.every((v, i) => i === 0 || t1[i - 1] >= v), 'page is ordered newest first')
check(Date.parse(p2.items[0].createdAt) < Date.parse(p1.items.at(-1).createdAt),
  'page 2 continues strictly after page 1')

// walk every page: each row exactly once
const seen = new Set()
let cursor = null
let pages = 0
for (;;) {
  const url = `/api/feed?limit=7${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
  const page = await (await get(url)).json()
  pages++
  for (const it of page.items) {
    if (seen.has(it.id)) { check(false, 'duplicate row while walking pages', it.id); break }
    seen.add(it.id)
  }
  if (!page.nextCursor) break
  cursor = page.nextCursor
  if (pages > 30) break
}
// Must match the feed's own filter: an unfinished generation has a null
// image_url and is deliberately excluded from a public gallery.
const total = Number(
  await psql("select count(*) from generations where visibility='public' and image_url is not null"),
)
check(seen.size === total, 'walking every page yields each row exactly once', `${seen.size}/${total} in ${pages} pages`)

// inserting a row mid-scroll must not shift the window (the OFFSET failure mode)
const firstPage = await (await get('/api/feed?limit=5')).json()
await psql(`insert into generations (user_id, prompt, subject, aspect_ratio, provider, model, image_url, visibility)
            select user_id, 'injected', 'injected mid-scroll', '1:1', 'seed', 'seed', '/presets/anime.webp', 'public'
            from generations limit 1`)
const afterInsert = await (await get(`/api/feed?limit=5&cursor=${encodeURIComponent(firstPage.nextCursor)}`)).json()
check(!afterInsert.items.some((i) => firstPage.items.some((f) => f.id === i.id)),
  'a row inserted mid-scroll does not duplicate a card')

// ---- the index can actually serve the ordering -----------------------------
// The original version of this check matched "Index Scan" anywhere in the plan
// and passed on the users_pkey lookup while the feed index was being ignored
// entirely. Assert the specific index, and that no sort survives.
const defs = await psql(
  `select indexname || ' :: ' || indexdef from pg_indexes
   where indexname in ('generations_feed_idx','generations_user_created_idx')`,
)
check(
  defs.includes('generations_feed_idx') && !/NULLS LAST/.test(defs),
  'feed index null ordering matches ORDER BY ... DESC',
  /NULLS LAST/.test(defs) ? 'index is NULLS LAST; ORDER BY DESC is NULLS FIRST' : 'DESC NULLS FIRST',
)

const publicRows = Number(await psql("select count(*) from generations where visibility='public'"))
const plan = await psql(`explain analyze
  select g.*, u.display_name from generations g join users u on u.id = g.user_id
  where g.visibility = 'public' and g.image_url is not null
  order by g.created_at desc limit 24`)

if (publicRows < 5000) {
  console.log(`  skip  plan check :: only ${publicRows} public rows, a seq scan is correct at this size`)
} else {
  check(plan.includes('generations_feed_idx'), 'feed query uses the feed index')
  check(!/Sort Key: g\.created_at/.test(plan), 'no sort: the index supplies the ordering')
}

// ---- library isolation -----------------------------------------------------
const anon = await (await get('/api/library')).json()
check(anon.items.length === 0, 'library is empty without a session')

/**
 * A POST the suite depends on. The per-IP limiter is shared with everything
 * else hitting this server, so a preceding suite can leave it saturated; wait
 * rather than continuing with a null cookie and an undefined id.
 */
async function postOk(body) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`${BASE}/api/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok && res.headers.get('set-cookie')) return res
    await res.text()
    if (res.status !== 429) throw new Error(`setup POST failed: HTTP ${res.status}`)
    process.stdout.write('  ..  rate limited, waiting\n')
    await new Promise((r) => setTimeout(r, 10_000))
  }
  throw new Error('rate limit never cleared')
}

const made = await postOk({ prompt: 'library isolation test', visibility: 'private' })
const cookie = made.headers.get('set-cookie').split(';')[0]
const { id: mineId } = await made.json()
await new Promise((r) => setTimeout(r, 2500))

const mine = await (await get('/api/library', cookie)).json()
check(mine.items.length === 1, 'library shows only my generations', `${mine.items.length}`)
check(!(await (await get('/api/feed?limit=50')).json()).items.some((i) => i.id === mineId),
  'a private generation never appears in the public feed')

// ---- share pages -----------------------------------------------------------
const pub = p1.items[0].id
check((await get(`/g/${pub}`)).status === 200, 'public share page renders')
check((await get(`/g/${mineId}`)).status === 404, 'private share page 404s for a stranger')
check((await get(`/g/${mineId}`, cookie)).status === 200, 'private share page renders for its owner')
check((await get('/g/not-a-uuid')).status === 404, 'malformed share id 404s')

// ---- og image --------------------------------------------------------------
const og = await get(`/g/${pub}/opengraph-image`)
const ogBuf = new Uint8Array(await og.arrayBuffer())
const isPng = ogBuf[0] === 0x89 && ogBuf[1] === 0x50 && ogBuf[2] === 0x4e && ogBuf[3] === 0x47
check(og.status === 200 && isPng, 'og image is a real PNG',
  `${og.headers.get('content-type')}, ${(ogBuf.length / 1024).toFixed(0)}KB`)

// ---- remix -----------------------------------------------------------------
const source = p1.items.find((i) => i.camera && i.style)
const html = await (await get(`/create?remix=${source.id}`)).text()
const strip = (s) => s.replace(/<!--.*?-->/gs, '')
const text = strip(html)
check(text.includes(source.subject), 'remix preloads the exact prompt', source.subject.slice(0, 40))
check(text.includes('Remixing'), 'remix is announced in the UI')
check(html.includes(`value="${source.aspectRatio}"`) || text.includes(source.aspectRatio),
  'remix preloads the aspect ratio', source.aspectRatio)
check(html.includes('aria-pressed="true"'), 'remix preselects presets in the grid',
  `${source.camera.label} + ${source.style.label}`)

await psql("delete from generations where subject = 'injected mid-scroll'")

console.log(fail === 0 ? '\nFEED CHECKS PASSED' : `\n${fail} FAILURES`)
process.exit(fail === 0 ? 0 : 1)
