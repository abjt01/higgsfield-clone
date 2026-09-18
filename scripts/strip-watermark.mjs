/**
 * Crops the provider watermark off generated assets.
 *
 * Pollinations ignores `nologo=true` and stamps "pollinations.ai" into the
 * bottom-right corner. That is a competitor's mark sitting on the landing
 * hero, so the band is cropped off. sips can read WebP but cannot encode it,
 * which is why an in-place sips crop silently does nothing — the round trip
 * goes through dwebp and cwebp instead.
 *
 * Idempotent in practice: cropping an already-cropped file just trims a little
 * more, so it is guarded by a marker file.
 */
import { execFile } from 'node:child_process'
import { readdir, rm, writeFile, access } from 'node:fs/promises'
import { promisify } from 'node:util'

const run = promisify(execFile)
const PERCENT = Number(process.argv[2] ?? 9)
const MARKER = 'public/.watermark-stripped'

try {
  await access(MARKER)
  console.log('already stripped (delete public/.watermark-stripped to redo)')
  process.exit(0)
} catch {
  /* not yet stripped */
}

const targets = []
for (const dir of ['public/hero', 'public/presets']) {
  for (const f of await readdir(dir)) if (f.endsWith('.webp')) targets.push(`${dir}/${f}`)
}

const dim = async (f) => {
  const { stdout } = await run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f])
  const w = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1])
  const h = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1])
  return { w, h }
}

let done = 0
let failed = 0

for (const f of targets) {
  const png = `${f}.tmp.png`
  const cropped = `${f}.crop.png`
  try {
    const { w, h } = await dim(f)
    const nh = h - Math.round((h * PERCENT) / 100)

    await run('dwebp', [f, '-o', png])
    await run('sips', ['-c', String(nh), String(w), '--cropOffset', '0', '0', png, '--out', cropped])

    const got = await dim(cropped)
    if (got.h !== nh) throw new Error(`crop gave ${got.h}, wanted ${nh}`)

    await run('cwebp', ['-quiet', '-q', '80', cropped, '-o', f])
    done++
  } catch (err) {
    console.log(`FAIL ${f}: ${err.message?.slice(0, 80)}`)
    failed++
  } finally {
    await rm(png, { force: true })
    await rm(cropped, { force: true })
  }
}

if (failed === 0) await writeFile(MARKER, `cropped ${PERCENT}% off ${done} files\n`)
console.log(`stripped ${done} files, ${failed} failed`)
process.exitCode = failed === 0 ? 0 : 1
