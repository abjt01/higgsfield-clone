'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { canvasSizeFor, drawFrame, resolveMotion } from '@/lib/render/camera-renderer'
import { loadImage, pickCodec, recordMove } from '@/lib/render/recorder'
import type { Motion } from '@/lib/presets/types'

interface Props {
  imageUrl: string
  /** Camera preset chosen in the composer; falls back to a gentle push. */
  cameraPresetId: string | null
  label: string
  /**
   * id -> motion for every camera preset, passed in rather than imported so the
   * 44 prompt scaffolds never reach the browser.
   */
  motions: Record<string, { label: string; motion: Motion }>
}

type Phase = 'loading' | 'ready' | 'recording' | 'done' | 'error'

/**
 * Canvas + MediaRecorder camera-move studio.
 *
 * Imported dynamically with ssr:false from the composer: this is the one
 * genuinely heavy client bundle in the app and nothing here can run on the
 * server, so it must not be in the initial payload.
 */
export default function CameraStudio({ imageUrl, cameraPresetId, label, motions }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [imageSize, setImageSize] = useState<[number, number] | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [video, setVideo] = useState<{ url: string; ext: string; bytes: number } | null>(null)
  const fallbackId = cameraPresetId && motions[cameraPresetId] ? cameraPresetId : Object.keys(motions)[0]
  const [motionId, setMotionId] = useState(fallbackId)

  const declared = (motions[motionId] ?? motions[fallbackId]).motion
  // Coverage-corrected: what actually gets drawn and recorded.
  const motion = imageSize ? resolveMotion(declared, imageSize[0], imageSize[1]) : declared

  const codec = typeof window === 'undefined' ? null : pickCodec()

  // Load the source image and size the canvas to it.
  //
  // No state reset at the top: the composer keys this component on imageUrl, so
  // a new image remounts it with fresh state rather than synchronising the old
  // state through an effect.
  useEffect(() => {
    let cancelled = false

    loadImage(imageUrl)
      .then((img) => {
        if (cancelled) return
        imageRef.current = img
        setImageSize([img.naturalWidth, img.naturalHeight])
        const canvas = canvasRef.current
        if (canvas) {
          const { width, height } = canvasSizeFor(img.naturalWidth, img.naturalHeight, motion)
          canvas.width = width
          canvas.height = height
        }
        setPhase('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setPhase('error')
      })

    return () => {
      cancelled = true
    }
    // Re-sizing on motion change is handled in the preview effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // Looping preview. Stops while recording so the two loops cannot fight over
  // the same canvas.
  useEffect(() => {
    if (phase !== 'ready') return
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const { width, height } = canvasSizeFor(image.naturalWidth, image.naturalHeight, motion)
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const cycleMs = (motion.duration + 0.6) * 1000
    const startedAt = performance.now()

    const tick = () => {
      const elapsed = (performance.now() - startedAt) % cycleMs
      const p = Math.min(1, elapsed / (motion.duration * 1000))
      drawFrame({
        ctx,
        image,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        motion,
        progress: p,
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, motion])

  useEffect(() => {
    return () => {
      if (video) URL.revokeObjectURL(video.url)
    }
  }, [video])

  const onRecord = useCallback(async () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (video) URL.revokeObjectURL(video.url)
    setVideo(null)
    setProgress(0)
    setPhase('recording')
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { blob, codec: used } = await recordMove({
        canvas,
        image,
        motion,
        onProgress: setProgress,
        signal: controller.signal,
      })
      setVideo({ url: URL.createObjectURL(blob), ext: used.ext, bytes: blob.size })
      setPhase('done')
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        setPhase('ready')
        return
      }
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }, [motion, video])

  const moves = Object.entries(motions)

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Camera move</h2>
        <span className="text-xs text-muted">{label}</span>
        {codec && (
          <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {codec.ext}
          </span>
        )}
      </header>

      <div className="relative overflow-hidden rounded-lg bg-black">
        {video ? (
          <video src={video.url} controls autoPlay loop playsInline className="w-full" />
        ) : (
          <canvas ref={canvasRef} className="w-full" />
        )}

        {phase === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Loading image…
          </div>
        )}
        {phase === 'recording' && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="h-full bg-hot transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={motionId}
          onChange={(e) => {
            setVideo(null)
            setMotionId(e.target.value)
            setPhase((p) => (p === 'done' ? 'ready' : p))
          }}
          disabled={phase === 'recording'}
          aria-label="Camera move"
          className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none"
        >
          {moves.map(([id, m]) => (
            <option key={id} value={id}>{m.label}</option>
          ))}
        </select>

        <span className="text-xs text-muted">{motion.duration}s</span>

        <button
          type="button"
          onClick={onRecord}
          disabled={phase === 'loading' || phase === 'recording' || phase === 'error'}
          className="ml-auto rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-accent-dim disabled:opacity-40"
        >
          {phase === 'recording' ? `Recording ${Math.round(progress * 100)}%` : 'Record clip'}
        </button>

        {video && (
          <a
            href={video.url}
            download={`${motionId}.${video.ext}`}
            className="rounded-lg border border-accent px-3.5 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
          >
            Download {(video.bytes / 1024 / 1024).toFixed(1)}MB
          </a>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded border border-red-500/40 p-2 text-xs text-red-400">{error}</p>
      )}
    </section>
  )
}
