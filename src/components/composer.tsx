'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ClientPreset } from '@/lib/presets/client'
import { ASPECT_RATIOS, type AspectRatio } from '@/lib/providers/types'

import { PresetPicker } from './preset-picker'

type Status = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed'

interface Poll {
  status: Status
  imageUrl: string | null
  provider: string
  model: string
  error: string | null
  aspectRatio: string
}

const POLL_MS = 1200
const POLL_TIMEOUT_MS = 120_000

export function Composer({ presets, initialCredits }: { presets: ClientPreset[]; initialCredits: number }) {
  const [subject, setSubject] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [styleId, setStyleId] = useState<string | null>(null)
  const [tab, setTab] = useState<'camera' | 'style'>('camera')
  const [credits, setCredits] = useState(initialCredits)

  const [status, setStatus] = useState<Status>('idle')
  const [poll, setPoll] = useState<Poll | null>(null)
  const [error, setError] = useState<string | null>(null)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Split once, not on every keystroke.
  const cameraPresets = useMemo(() => presets.filter((p) => p.group === 'camera'), [presets])
  const stylePresets = useMemo(() => presets.filter((p) => p.group === 'style'), [presets])

  const camera = cameraId ? presets.find((p) => p.id === cameraId) : undefined
  const style = styleId ? presets.find((p) => p.id === styleId) : undefined

  const startPolling = useCallback((id: string) => {
    const startedAt = Date.now()

    const tick = async () => {
      try {
        // no-store on both sides: a cached poll means the job appears to hang.
        const res = await fetch(`/api/generations/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

        setPoll(data)
        setStatus(data.status)

        if (data.status === 'succeeded' || data.status === 'failed') return
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setStatus('failed')
          setError('Timed out waiting for the generation.')
          return
        }
        timer.current = setTimeout(tick, POLL_MS)
      } catch (err) {
        setStatus('failed')
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    timer.current = setTimeout(tick, POLL_MS)
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!subject.trim() || status === 'queued' || status === 'running') return

    setError(null)
    setPoll(null)
    setStatus('queued')

    try {
      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: subject, aspectRatio, cameraId, styleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      setCredits(data.creditsLeft)
      startPolling(data.id)
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const busy = status === 'queued' || status === 'running'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* ------------------------------------------------------- composer */}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <label htmlFor="subject" className="text-xs font-medium uppercase tracking-wider text-muted">
            Prompt
          </label>
          <textarea
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            rows={4}
            placeholder="a lone samurai on a neon rooftop, rain falling"
            className="mt-2 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              aria-label="Aspect ratio"
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <span className="text-xs text-muted">{credits} credits</span>

            <button
              type="submit"
              disabled={busy || !subject.trim()}
              className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        {(camera || style) && (
          <div className="flex flex-wrap gap-2">
            {camera && <SelectedChip label={camera.label} onClear={() => setCameraId(null)} />}
            {style && <SelectedChip label={style.label} onClear={() => setStyleId(null)} />}
          </div>
        )}

        <div className="flex h-[30rem] flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <div className="mb-3 flex shrink-0 gap-1 rounded-lg bg-surface-2 p-1">
            <TabButton active={tab === 'camera'} onClick={() => setTab('camera')}>
              Camera · {cameraPresets.length}
            </TabButton>
            <TabButton active={tab === 'style'} onClick={() => setTab('style')}>
              Style · {stylePresets.length}
            </TabButton>
          </div>

          <div className="min-h-0 flex-1">
            {tab === 'camera' ? (
              <PresetPicker
                presets={cameraPresets}
                selectedId={cameraId}
                onSelect={setCameraId}
                noneLabel="No camera move"
              />
            ) : (
              <PresetPicker
                presets={stylePresets}
                selectedId={styleId}
                onSelect={setStyleId}
                noneLabel="No style"
              />
            )}
          </div>
        </div>
      </form>

      {/* --------------------------------------------------------- output */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <Output status={status} poll={poll} error={error} aspectRatio={aspectRatio} subject={subject} />
      </div>
    </div>
  )
}

function Output({
  status,
  poll,
  error,
  aspectRatio,
  subject,
}: {
  status: Status
  poll: Poll | null
  error: string | null
  aspectRatio: AspectRatio
  subject: string
}) {
  const [w, h] = aspectRatio.split(':').map(Number)

  if (status === 'idle') {
    return (
      <div
        style={{ aspectRatio: `${w} / ${h}` }}
        className="flex w-full items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted"
      >
        Your generation appears here
      </div>
    )
  }

  if (status === 'queued' || status === 'running') {
    return (
      <div
        style={{ aspectRatio: `${w} / ${h}` }}
        className="flex w-full animate-pulse flex-col items-center justify-center gap-2 rounded-lg bg-surface-2 text-sm text-muted"
      >
        <span className="capitalize">{status}…</span>
        <span className="text-xs">{status === 'queued' ? 'Job created' : 'Calling the model'}</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div
        style={{ aspectRatio: `${w} / ${h}` }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-red-500/40 p-6 text-center text-sm text-red-400"
      >
        <span className="font-medium">Generation failed</span>
        <span className="text-xs opacity-80">{poll?.error ?? error}</span>
      </div>
    )
  }

  return (
    <figure>
      {poll?.imageUrl && (
        <Image
          src={poll.imageUrl}
          alt={subject}
          width={1024}
          height={1024}
          unoptimized={poll.imageUrl.startsWith('data:')}
          className="w-full rounded-lg"
        />
      )}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="rounded-full border border-line px-2 py-0.5 text-accent">
          {poll?.provider}
        </span>
        <span>{poll?.model}</span>
        <span>{poll?.aspectRatio}</span>
      </figcaption>
    </figure>
  )
}

function SelectedChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-xs text-accent">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remove ${label}`} className="opacity-70 hover:opacity-100">
        ×
      </button>
    </span>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-accent text-black' : 'text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}
