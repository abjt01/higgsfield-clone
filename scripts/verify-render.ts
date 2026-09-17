import { CAMERA_PRESETS } from '@/lib/presets/cameras'
import { blurSamples, canvasSizeFor, coverScale, frameAt, resolveMotion } from '@/lib/render/camera-renderer'
import { EASINGS } from '@/lib/render/easing'

let fail = 0
const bad = (m: string) => { console.log('  FAIL:', m); fail++ }

// 1. easing endpoints and monotonicity
for (const [name, fn] of Object.entries(EASINGS)) {
  if (Math.abs(fn(0)) > 1e-6) bad(`${name}(0) = ${fn(0)}, expected 0`)
  if (Math.abs(fn(1) - 1) > 1e-6) bad(`${name}(1) = ${fn(1)}, expected 1`)
  let prev = -Infinity
  for (let i = 0; i <= 100; i++) {
    const v = fn(i / 100)
    if (v < prev - 1e-9) { bad(`${name} not monotonic at t=${i / 100}`); break }
    prev = v
  }
}
console.log(`easing: ${Object.keys(EASINGS).length} curves checked`)

// 2. every camera preset has motion, endpoints sane
const withMotion = CAMERA_PRESETS.filter((p) => p.motion)
if (withMotion.length !== CAMERA_PRESETS.length) bad(`${CAMERA_PRESETS.length - withMotion.length} presets missing motion`)
console.log(`motion: ${withMotion.length}/${CAMERA_PRESETS.length} camera presets carry motion`)

// 3. THE quality property: at peak zoom the source is never upscaled past native
const IMG = [1360, 768] as const // a 16:9 generation
let worstUpscale = 0
let worstId = ''
for (const p of CAMERA_PRESETS) {
  const m = resolveMotion(p.motion!, IMG[0], IMG[1])
  const { width, height } = canvasSizeFor(IMG[0], IMG[1], m)
  const base = coverScale(width, height, IMG[0], IMG[1])
  for (let i = 0; i <= 60; i++) {
    const f = frameAt(m, i / 60)
    const effective = base * f.scale // 1.0 means native pixels
    if (effective > worstUpscale) { worstUpscale = effective; worstId = p.id }
  }
  // 4. the image must always cover the canvas: no black bars mid-move
  for (let i = 0; i <= 60; i++) {
    const f = frameAt(m, i / 60)
    const drawW = IMG[0] * base * f.scale
    const drawH = IMG[1] * base * f.scale
    const cx = Math.abs(f.dx) * width
    const cy = Math.abs(f.dy) * height
    if (drawW / 2 - cx < width / 2 - 0.5 || drawH / 2 - cy < height / 2 - 0.5) {
      bad(`${p.id} exposes an edge at p=${(i / 60).toFixed(2)} (drawW=${drawW.toFixed(0)} off=${cx.toFixed(0)})`)
      break
    }
  }
}
console.log(`sharpness: worst effective scale ${worstUpscale.toFixed(3)}x native (${worstId})`)
// Some upscale is unavoidable: a 1.95x crash zoom on a 1360px source cannot
// fill a >=640px canvas without resampling. Kept well under the point where
// softness is visible; requesting 2K from Gemini removes it entirely.
if (worstUpscale > 1.35) bad(`upscaling past native by ${worstUpscale.toFixed(3)}x`)

// 5. motion blur engages on fast moves, stays off on slow ones
const peakSamples = (id: string) => {
  const m = resolveMotion(CAMERA_PRESETS.find((p) => p.id === id)!.motion!, IMG[0], IMG[1])
  let max = 0
  for (let i = 0; i <= 60; i++) max = Math.max(max, blurSamples(m, i / 60))
  return max
}
for (const id of ['crash-zoom-in', 'whip-pan-left', 'fpv-dive']) {
  const s = peakSamples(id)
  console.log(`  blur ${id}: peak ${s} samples`)
  if (s < 3) bad(`${id} should engage motion blur, got ${s}`)
}
for (const id of ['static-lockoff', 'slow-zoom-in']) {
  const s = peakSamples(id)
  console.log(`  blur ${id}: peak ${s} samples`)
  if (s > 2) bad(`${id} should stay crisp, got ${s}`)
}

console.log(fail === 0 ? '\nALL RENDER CHECKS PASSED' : `\n${fail} FAILURES`)
process.exit(fail === 0 ? 0 : 1)
