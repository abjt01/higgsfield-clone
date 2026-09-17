import { deflateSync } from 'node:zlib'

import {
  type GenerateOpts,
  type GeneratedImage,
  type ImageProvider,
  RATIO_DIMENSIONS,
} from './types'

/**
 * Deterministic offline provider. Never in the default chain — reachable only
 * via IMAGE_PROVIDER=stub.
 *
 * Exists so the job pipeline can be exercised end to end with no network, no
 * API key and no rate limit: useful in CI, and the only way to verify the
 * success path while the real providers are throttled.
 */
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typed))
  return Buffer.concat([len, typed, crc])
}

/** Minimal truecolour PNG encoder, so the stub returns real decodable bytes. */
function encodePng(width: number, height: number, pixel: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let o = 0
  for (let y = 0; y < height; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export const stub: ImageProvider = {
  name: 'stub',
  model: 'stub-gradient',

  available() {
    return true
  },

  async generate({ prompt, aspectRatio }: GenerateOpts): Promise<GeneratedImage> {
    const [w, h] = RATIO_DIMENSIONS[aspectRatio]
    // Scale down: the stub only needs to prove bytes flow, not look good.
    const width = Math.round(w / 4)
    const height = Math.round(h / 4)

    // Hash the prompt so the same prompt always yields the same image.
    let seed = 0
    for (const ch of prompt) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0

    const bytes = encodePng(width, height, (x, y) => [
      (x * 255) / width,
      (y * 255) / height,
      (seed % 200) + 40,
    ])

    return { bytes, mime: 'image/png', provider: 'stub', model: 'stub-gradient' }
  },
}
