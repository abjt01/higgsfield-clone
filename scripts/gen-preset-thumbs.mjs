/**
 * Generates one grid thumbnail per preset, via Pollinations (no key needed).
 *
 * A fixed base subject per group means the only thing that differs between
 * thumbnails is the preset itself, which is what makes the grid readable.
 * Output is 256px WebP because dozens render at once; per the plan these
 * matter far more than any individual generated image.
 *
 * Idempotent: existing thumbnails are skipped unless --force is passed.
 */
import { execFile } from 'node:child_process'
import { mkdir, writeFile, unlink, access } from 'node:fs/promises'
import { promisify } from 'node:util'

import { CAMERA_PRESETS } from '../src/lib/presets/cameras.ts'
import { STYLE_PRESETS } from '../src/lib/presets/styles.ts'

const run = promisify(execFile)

const BASE = {
  camera: 'a lone figure in a long coat standing in an empty city street at dusk',
  style: 'a portrait of a person standing on a city street, upper body, looking at camera',
}

const OUT = 'public/presets'
const SIZE = 384
const CONCURRENCY = 1
// Pollinations free tier rate limits hard at ~1 req / 5s per IP. Eight parallel
// requests got 78/81 rejected with 429, so this is serial and paced.
const SPACING_MS = 5500
const FORCE = process.argv.includes('--force')

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function one(preset) {
  const dest = `${OUT}/${preset.id}.webp`
  if (!FORCE && (await exists(dest))) return { id: preset.id, skipped: true }

  const prompt = `${BASE[preset.group]}. ${preset.scaffold}`
  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`)
  url.searchParams.set('width', String(SIZE))
  url.searchParams.set('height', String(SIZE))
  url.searchParams.set('model', 'flux')
  url.searchParams.set('nologo', 'true')
  // Deterministic per preset, so re-running does not reshuffle the whole grid.
  url.searchParams.set('seed', String([...preset.id].reduce((a, c) => a + c.charCodeAt(0), 0)))

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.byteLength < 1000) throw new Error(`tiny body (${buf.byteLength}B)`)

      const tmp = `${OUT}/.${preset.id}.jpg`
      await writeFile(tmp, buf)
      // -resize to 256 wide, quality 72: small enough that a 81-tile grid stays cheap.
      await run('cwebp', ['-quiet', '-q', '72', '-resize', '256', '0', tmp, '-o', dest])
      await unlink(tmp)
      return { id: preset.id, bytes: buf.byteLength }
    } catch (err) {
      if (attempt === 5) return { id: preset.id, error: String(err.message ?? err) }
      // 429 needs a much longer sit-out than a transient network blip.
      const is429 = String(err.message ?? err).includes('429')
      await new Promise((r) => setTimeout(r, is429 ? 15_000 * attempt : 2_000 * attempt))
    }
  }
}

const all = [...CAMERA_PRESETS, ...STYLE_PRESETS]
await mkdir(OUT, { recursive: true })

const results = []
let cursor = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < all.length) {
      const preset = all[cursor++]
      const r = await one(preset)
      results.push(r)
      if (!r.skipped) await new Promise((res) => setTimeout(res, SPACING_MS))
      const tag = r.skipped ? 'skip' : r.error ? 'FAIL' : 'ok'
      process.stdout.write(`${tag} ${results.length}/${all.length} ${r.id}${r.error ? ' :: ' + r.error : ''}\n`)
    }
  }),
)

const failed = results.filter((r) => r.error)
console.log(`\ndone: ${results.length - failed.length}/${all.length} ok, ${failed.length} failed`)
if (failed.length) {
  console.log('failed:', failed.map((f) => f.id).join(', '))
  process.exitCode = 1
}
