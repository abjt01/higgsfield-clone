import type { Motion } from '@/lib/presets/types'

import { drawFrame } from './camera-renderer'

export interface Codec {
  mimeType: string
  ext: 'mp4' | 'webm'
}

/**
 * Best available container.
 *
 * MP4 first because it drops straight into anything without conversion;
 * WebM/VP9 is the Chromium fallback. Returns null when MediaRecorder cannot
 * encode video at all, which is the case in some embedded webviews.
 */
export function pickCodec(): Codec | null {
  if (typeof MediaRecorder === 'undefined') return null

  const candidates: Codec[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ]

  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? null
}

/**
 * Load an image in a state where the canvas can still be captured.
 *
 * Drawing a cross-origin image taints the canvas, and a tainted canvas makes
 * captureStream throw SecurityError at record time rather than at draw time —
 * so it fails late, after the user has watched the whole move. Requesting CORS
 * up front turns that into an immediate, explainable failure.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Could not load the image for rendering (CORS or network).'))
    img.src = src
  })
}

export interface RecordOptions {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  motion: Motion
  fps?: number
  /** Still frames held before the move starts and after it ends, in seconds. */
  leadIn?: number
  leadOut?: number
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

export interface Recording {
  blob: Blob
  codec: Codec
  durationMs: number
}

/**
 * Play the move in real time and capture it to a video file.
 *
 * Real time rather than rendering as fast as possible: MediaRecorder timestamps
 * frames off the wall clock, so a faster-than-realtime loop produces a clip
 * that plays back sped up.
 */
export async function recordMove({
  canvas,
  image,
  motion,
  fps = 30,
  leadIn = 0.18,
  leadOut = 0.35,
  onProgress,
  signal,
}: RecordOptions): Promise<Recording> {
  const codec = pickCodec()
  if (!codec) throw new Error('This browser cannot record video from a canvas.')

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Could not get a 2D canvas context.')

  const imageWidth = image.naturalWidth
  const imageHeight = image.naturalHeight

  const stream = canvas.captureStream(fps)
  const bitsPerSecond = Math.min(16_000_000, Math.round(canvas.width * canvas.height * fps * 0.22))
  const recorder = new MediaRecorder(stream, { mimeType: codec.mimeType, videoBitsPerSecond: bitsPerSecond })

  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const finished = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  const totalMs = (leadIn + motion.duration + leadOut) * 1000
  const startedAt = performance.now()

  recorder.start()

  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) {
        reject(new DOMException('Recording cancelled', 'AbortError'))
        return
      }

      const elapsed = performance.now() - startedAt
      const moveMs = motion.duration * 1000
      const progress = Math.min(1, Math.max(0, (elapsed - leadIn * 1000) / moveMs))

      drawFrame({ ctx, image, imageWidth, imageHeight, motion, progress })
      onProgress?.(Math.min(1, elapsed / totalMs))

      if (elapsed >= totalMs) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  recorder.stop()
  stream.getTracks().forEach((t) => t.stop())
  await finished

  return {
    blob: new Blob(chunks, { type: codec.mimeType }),
    codec,
    durationMs: Math.round(totalMs),
  }
}
