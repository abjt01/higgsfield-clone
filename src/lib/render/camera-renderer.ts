import type { Motion } from '@/lib/presets/types'

import { EASINGS, lerp, shakeOffset } from './easing'

export interface Frame {
  scale: number
  dx: number
  dy: number
  rotate: number
}

/** Motion state at normalised progress p (0..1), before easing is applied. */
export function frameAt(motion: Motion, p: number): Frame {
  const e = EASINGS[motion.easing](Math.min(1, Math.max(0, p)))

  const scale = lerp(motion.scale[0], motion.scale[1], e)

  const [[x0, y0], [x1, y1]] = motion.offset ?? [
    [0, 0],
    [0, 0],
  ]
  const [r0, r1] = motion.rotate ?? [0, 0]

  const [sx, sy] = shakeOffset(p * motion.duration, motion.shake ?? 0)

  return {
    scale,
    dx: lerp(x0, x1, e) + sx,
    dy: lerp(y0, y1, e) + sy,
    rotate: lerp(r0, r1, e),
  }
}

/**
 * Canvas size for a given source image and motion.
 *
 * The output is sized so the image is never upscaled past its native
 * resolution at the most zoomed point of the move. Naively picking 1280x720
 * and zooming 1.95x would resample a 1K image nearly twice over and the clip
 * comes out visibly soft, which is exactly the thing being demoed. Clamped so
 * a gentle move does not produce an absurdly large canvas and a violent one
 * does not produce a postage stamp.
 */
export function canvasSizeFor(
  imageWidth: number,
  imageHeight: number,
  motion: Motion,
  opts: { min?: number; max?: number } = {},
): { width: number; height: number } {
  const min = opts.min ?? 640
  const max = opts.max ?? 1280

  const peak = Math.max(motion.scale[0], motion.scale[1])
  const aspect = imageWidth / imageHeight

  // Longest edge the source can fill at peak zoom without being upscaled.
  const native = Math.max(imageWidth, imageHeight) / peak
  const longest = Math.round(Math.min(max, Math.max(min, native)))

  const width = aspect >= 1 ? longest : Math.round(longest * aspect)
  const height = aspect >= 1 ? Math.round(longest / aspect) : longest

  // Encoders want even dimensions.
  return { width: width - (width % 2), height: height - (height % 2) }
}

/**
 * Smallest uniform scale bump that keeps the image covering the canvas for the
 * whole move.
 *
 * Offsets and rotation both pull the image edge toward the frame. A pan that
 * travels 0.16 of the frame each way needs at least 1.32x scale or the backing
 * black shows through at the extremes. Authoring 44 presets so this can never
 * happen is error-prone, so it is derived instead: presets declare the move
 * they want and the renderer guarantees coverage.
 */
export function coverageFactor(motion: Motion, aspect: number, steps = 60): number {
  let worst = 1

  for (let i = 0; i <= steps; i++) {
    const f = frameAt(motion, i / steps)
    const rad = (Math.abs(f.rotate) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Half-extents of the axis-aligned rect inscribed in the rotated image,
    // in units of the image's own drawn size.
    const exUnit = 0.5 * cos - 0.5 * (1 / aspect) * sin
    const eyUnit = 0.5 * cos - 0.5 * aspect * sin
    if (exUnit <= 0 || eyUnit <= 0) return Infinity

    const needX = (0.5 + Math.abs(f.dx)) / exUnit
    const needY = (0.5 + Math.abs(f.dy)) / eyUnit

    worst = Math.max(worst, needX / f.scale, needY / f.scale)
  }

  // 0.5% of slack so floating point cannot expose a one-pixel seam.
  return worst * 1.005
}

/**
 * Apply the coverage factor, giving the motion that is actually rendered.
 * Everything downstream — canvas sizing, drawing, blur — uses this.
 */
export function resolveMotion(motion: Motion, imageWidth: number, imageHeight: number): Motion {
  const k = coverageFactor(motion, imageWidth / imageHeight)
  if (!Number.isFinite(k) || k <= 1) return motion
  return { ...motion, scale: [motion.scale[0] * k, motion.scale[1] * k] }
}

/** Scale at which the image exactly covers the canvas. */
export function coverScale(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  return Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight)
}

/**
 * How many sub-samples to composite for motion blur at this instant.
 *
 * Derived from actual velocity rather than a fixed count: a slow zoom gets one
 * sample and stays crisp, a crash zoom or whip pan gets up to eight and picks
 * up the streaking that makes a fast move read as motion instead of a jump cut.
 */
export function blurSamples(motion: Motion, p: number, maxSamples = 8): number {
  const dt = 1 / 60 / motion.duration
  const a = frameAt(motion, Math.max(0, p - dt))
  const b = frameAt(motion, Math.min(1, p + dt))

  const dScale = Math.abs(b.scale - a.scale)
  const dOffset = Math.hypot(b.dx - a.dx, b.dy - a.dy)
  const dRotate = Math.abs(b.rotate - a.rotate) / 90

  // Per second, not per unit progress: without dividing by duration a gentle
  // 4s zoom and a 1s whip measure the same and both get smeared.
  const velocity = (dScale + dOffset * 2 + dRotate) / (2 * dt) / motion.duration
  if (velocity < 0.25) return 1
  return Math.min(maxSamples, Math.max(2, Math.round(velocity * 6)))
}

export interface DrawOptions {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageWidth: number
  imageHeight: number
  motion: Motion
  /** Progress through the move, 0..1. */
  progress: number
  /** Shutter angle as a fraction of a frame. Larger means more smear. */
  blurSpan?: number
}

/** Render one output frame, motion blur included. */
export function drawFrame({
  ctx,
  image,
  imageWidth,
  imageHeight,
  motion,
  progress,
  blurSpan = 1 / 60 / 1.6,
}: DrawOptions): void {
  const { canvas } = ctx
  const cw = canvas.width
  const ch = canvas.height

  const samples = blurSamples(motion, progress)
  const span = blurSpan / motion.duration

  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cw, ch)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const base = coverScale(cw, ch, imageWidth, imageHeight)

  for (let i = 0; i < samples; i++) {
    // Sample backwards from the current instant, the way a real shutter
    // integrates light over the time it is open.
    const offset = samples === 1 ? 0 : (i / (samples - 1)) * span
    const f = frameAt(motion, Math.max(0, progress - offset))

    const drawW = imageWidth * base * f.scale
    const drawH = imageHeight * base * f.scale

    ctx.globalAlpha = 1 / samples
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.translate(cw / 2 + f.dx * cw, ch / 2 + f.dy * ch)
    if (f.rotate) ctx.rotate((f.rotate * Math.PI) / 180)
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH)
  }

  ctx.restore()
  ctx.globalAlpha = 1
}
