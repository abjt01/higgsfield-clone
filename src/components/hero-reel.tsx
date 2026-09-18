'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import type { Motion } from '@/lib/presets/types'
import { drawFrame, resolveMotion } from '@/lib/render/camera-renderer'
import { loadImage } from '@/lib/render/recorder'

export interface ReelShot {
  src: string
  label: string
  motion: Motion
}

/**
 * The landing hero.
 *
 * Not a video file: this is the product's own camera renderer running live on
 * generated stills. It shows the actual thing being sold, weighs a few hundred
 * KB of WebP instead of megabytes of MP4, and cannot go out of sync with what
 * the renderer really does.
 */
export default function HeroReel({ shots }: { shots: ReelShot[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(shots.map((s) => loadImage(s.src)))
      .then((imgs) => {
        if (cancelled) return
        imagesRef.current = imgs
        setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [shots])

  useEffect(() => {
    if (!ready) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // A hero that keeps painting while scrolled past is a battery tax for
    // nothing, so the loop is tied to visibility.
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && rafRef.current === null) rafRef.current = requestAnimationFrame(tick)
    })
    io.observe(canvas)

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round((rect.width * 9) / 16) * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let shotIndex = 0
    let startedAt = performance.now()
    const HOLD_MS = 700

    function tick() {
      if (!visible) {
        rafRef.current = null
        return
      }

      const image = imagesRef.current[shotIndex]
      const shot = shots[shotIndex]
      if (!image || !ctx) return

      const motion = resolveMotion(shot.motion, image.naturalWidth, image.naturalHeight)
      const durationMs = motion.duration * 1000
      const elapsed = performance.now() - startedAt
      const progress = reduced ? 1 : Math.min(1, elapsed / durationMs)

      drawFrame({
        ctx,
        image,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        motion,
        progress,
      })

      if (elapsed > durationMs + HOLD_MS) {
        shotIndex = (shotIndex + 1) % shots.length
        startedAt = performance.now()
        setIndex(shotIndex)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      io.disconnect()
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [ready, shots])

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
      {/* Poster. The canvas cannot be the LCP element because it is painted by
          a dynamically imported component, so the browser never learns to fetch
          its first image early. This renders the same still immediately with
          fetchPriority high, then hands over once the reel is running. */}
      <Image
        src={shots[0].src}
        alt=""
        width={1280}
        height={720}
        // Without sizes, next/image builds a 2x srcset and mobile picks w=3840
        // — a 3840px render of a 1280px source, which was the LCP cost. The
        // hero is full width below lg and a little over half of it above.
        sizes="(max-width: 1024px) 100vw, 55vw"
        priority
        quality={70}
        className={`block w-full transition-opacity duration-500 ${ready ? 'absolute inset-0 opacity-0' : 'opacity-100'}`}
        style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`block w-full ${ready ? '' : 'absolute inset-0 opacity-0'}`}
        style={{ aspectRatio: '16 / 9' }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-black">
            {shots[index]?.label}
          </span>
          <span className="text-[11px] text-muted">rendered live on canvas</span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 flex gap-1">
        {shots.map((s, i) => (
          <span
            key={s.label}
            className={`h-1 w-5 rounded-full transition ${i === index ? 'bg-accent' : 'bg-white/25'}`}
          />
        ))}
      </div>
    </div>
  )
}
