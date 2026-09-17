/**
 * Generates the landing-page hero stills.
 *
 * Larger than preset thumbnails because the hero canvas crops into them for the
 * camera move; a 256px tile would be visibly soft the moment it zooms.
 * Idempotent, paced for the Pollinations free tier.
 */
import { execFile } from 'node:child_process'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const run = promisify(execFile)
const OUT = 'public/hero'
const SPACING_MS = 5500

const SHOTS = [
  ['rooftop', 'a lone figure in a long coat on a neon-lit rooftop at night, rain falling, cinematic anamorphic lens, teal and orange grade, volumetric light'],
  ['alley',   'a rain-slicked Tokyo alley at night, saturated magenta and cyan signage reflecting on wet asphalt, steam, deep blacks, neon noir'],
  ['desert',  'a lone car on a desert highway at golden hour, long shadows, warm amber rim light, atmospheric haze, wide cinematic vista'],
  ['diver',   'a diver descending into a sunlit kelp forest, god rays through green water, particulate light, cinematic underwater photography'],
  ['station', 'an abandoned space station interior orbiting a gas giant, cold blue light through a viewport, volumetric dust, epic scale'],
]

async function exists(p) { try { await access(p); return true } catch { return false } }

await mkdir(OUT, { recursive: true })
let made = 0

for (const [name, prompt] of SHOTS) {
  const dest = `${OUT}/${name}.webp`
  if (await exists(dest)) { console.log(`skip ${name}`); continue }

  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`)
  url.searchParams.set('width', '1280')
  url.searchParams.set('height', '720')
  url.searchParams.set('model', 'flux')
  url.searchParams.set('nologo', 'true')
  url.searchParams.set('seed', String([...name].reduce((a, c) => a + c.charCodeAt(0), 0)))

  let ok = false
  for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.byteLength < 5000) throw new Error(`tiny body ${buf.byteLength}`)

      const tmp = `${OUT}/.${name}.jpg`
      await writeFile(tmp, buf)
      await run('cwebp', ['-quiet', '-q', '78', tmp, '-o', dest])
      await unlink(tmp)
      console.log(`ok   ${name} (${(buf.byteLength / 1024).toFixed(0)}KB)`)
      made++
      ok = true
    } catch (err) {
      console.log(`retry ${name}: ${err.message}`)
      await new Promise((r) => setTimeout(r, 12_000 * attempt))
    }
  }
  await new Promise((r) => setTimeout(r, SPACING_MS))
}

console.log(`hero stills written: ${made}`)
