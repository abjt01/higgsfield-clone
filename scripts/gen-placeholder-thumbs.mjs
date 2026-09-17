/**
 * Fills in a placeholder thumbnail for any preset that has no real one yet.
 *
 * Offline, deterministic, no rate limit. Each tile gets a distinct two-tone
 * gradient derived from its id, so a partially generated grid reads as
 * intentional rather than broken. Real thumbnails overwrite these:
 * gen-preset-thumbs.mjs skips ids that already exist, so delete a placeholder
 * (or pass --force) to replace it.
 */
import { execFile } from 'node:child_process'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { deflateSync } from 'node:zlib'

import { CAMERA_PRESETS } from '../src/lib/presets/cameras.ts'
import { STYLE_PRESETS } from '../src/lib/presets/styles.ts'

const run = promisify(execFile)
const OUT = 'public/presets'
const SIZE = 256

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typed))
  return Buffer.concat([len, typed, crc])
}
function png(size, px) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) { const [r, g, b] = px(x, y); raw[o++] = r; raw[o++] = g; raw[o++] = b }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

const hsl = (h, s, l) => {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)]
}

async function exists(p) { try { await access(p); return true } catch { return false } }

await mkdir(OUT, { recursive: true })
const all = [...CAMERA_PRESETS, ...STYLE_PRESETS]
let made = 0

for (const preset of all) {
  const dest = `${OUT}/${preset.id}.webp`
  if (await exists(dest)) continue

  const seed = [...preset.id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0)
  const hue = seed % 360
  // Camera presets lean cool and desaturated, styles lean saturated: the two
  // tabs stay visually distinguishable at a glance.
  const sat = preset.group === 'camera' ? 0.18 : 0.42
  const [r1, g1, b1] = hsl(hue, sat, 0.34)
  const [r2, g2, b2] = hsl((hue + 40) % 360, sat, 0.08)

  const bytes = png(SIZE, (x, y) => {
    const t = (x / SIZE) * 0.45 + (y / SIZE) * 0.55
    return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.max(0, Math.min(255, Math.round(v))))
  })

  const tmp = `${OUT}/.${preset.id}.png`
  await writeFile(tmp, bytes)
  await run('cwebp', ['-quiet', '-q', '80', tmp, '-o', dest])
  await unlink(tmp)
  made++
}

console.log(`placeholders written: ${made}, total tiles: ${all.length}`)
