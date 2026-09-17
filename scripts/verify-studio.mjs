/**
 * Headless smoke test for the camera-move renderer.
 *
 * MediaRecorder and canvas.captureStream only exist in a browser, so the maths
 * checks in verify-render.ts cannot cover the part that actually produces the
 * file. This drives real Chrome against the running dev server, generates with
 * the stub provider, records a clip and asserts a decodable video comes back.
 *
 *   PORT=3100 IMAGE_PROVIDER=stub npm run start
 *   node scripts/verify-studio.mjs
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE ?? 'http://localhost:3100'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ' :: ' + detail : ''}`)
  if (!ok) failures++
}

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1000 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(`${BASE}/create`, { waitUntil: 'networkidle2' })
  check(true, 'create page loaded')

  // codec support in this browser
  const codec = await page.evaluate(() =>
    ['video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9', 'video/webm'].find((t) =>
      MediaRecorder.isTypeSupported(t)))
  check(Boolean(codec), 'MediaRecorder has a usable codec', codec ?? 'none')

  // pick a preset with real motion, then generate
  await page.click('button[aria-pressed][title]')
  await page.type('#subject', 'a lone samurai on a neon rooftop')
  await page.click('button[type="submit"]')

  await page.waitForSelector('canvas', { timeout: 60_000 })
  check(true, 'camera studio mounted after generation (dynamic import resolved)')

  const dims = await page.$eval('canvas', (c) => ({ w: c.width, h: c.height }))
  check(dims.w > 100 && dims.h > 100, 'canvas sized from the image', `${dims.w}x${dims.h}`)

  // canvas must not be tainted, or captureStream throws at record time
  const tainted = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    try { c.getContext('2d').getImageData(0, 0, 1, 1); return false } catch { return true }
  })
  check(!tainted, 'canvas is not CORS-tainted')

  // the preview loop must actually be changing pixels
  const moved = await page.evaluate(async () => {
    const c = document.querySelector('canvas')
    const snap = () => c.toDataURL('image/png').length
    const a = snap()
    await new Promise((r) => setTimeout(r, 450))
    return a !== snap()
  })
  check(moved, 'preview loop is animating')

  // record
  const before = Date.now()
  const [btn] = await page.$$('xpath/.//button[contains(., "Record clip")]')
  check(Boolean(btn), 'record button present')
  await btn.click()

  await page.waitForSelector('a[download]', { timeout: 60_000 })
  const elapsed = Date.now() - before

  const info = await page.evaluate(async () => {
    const a = document.querySelector('a[download]')
    const res = await fetch(a.href)
    const buf = new Uint8Array(await res.arrayBuffer())
    return { name: a.getAttribute('download'), bytes: buf.length, head: [...buf.slice(0, 12)] }
  })

  check(info.bytes > 20_000, 'clip has real content', `${(info.bytes / 1024).toFixed(0)} KB in ${(elapsed / 1000).toFixed(1)}s`)
  check(/\.(mp4|webm)$/.test(info.name), 'download filename has a video extension', info.name)

  // container sniff: webm/mkv starts 1A 45 DF A3; mp4 has "ftyp" at byte 4
  const h = info.head
  const isWebm = h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3
  const isMp4 = String.fromCharCode(...h.slice(4, 8)) === 'ftyp'
  check(isWebm || isMp4, 'bytes are a real video container', isWebm ? 'WebM/Matroska' : isMp4 ? 'MP4' : h.join(','))

  // and the browser can actually decode it
  const playable = await page.evaluate(() => {
    const v = document.querySelector('video')
    return v ? { duration: v.duration, w: v.videoWidth, h: v.videoHeight } : null
  })
  check(
    playable && playable.w > 0 && playable.h > 0,
    'decodes with real dimensions',
    playable ? `${playable.w}x${playable.h}, ${playable.duration?.toFixed?.(2)}s` : 'no video element',
  )

  check(errors.length === 0, 'no console/page errors', errors.slice(0, 2).join(' | '))
} finally {
  await browser.close()
}

console.log(failures === 0 ? '\nSTUDIO VERIFIED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
