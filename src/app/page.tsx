'use client'

import { useState } from 'react'

import { ASPECT_RATIOS, type AspectRatio } from '@/lib/providers/types'

interface Result {
  dataUrl: string
  provider: string
  model: string
  fellBackFrom: { provider: string; reason: string }[]
  ms: number
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Higgsfield clone — vertical slice</h1>
      <p className="mt-1 text-sm opacity-60">
        Prompt in, real image out. Deliberately ugly.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="a rain-slicked Tokyo alley at night, neon reflections, anamorphic"
          className="w-full rounded border border-current/20 bg-transparent p-3 text-sm"
        />

        <div className="flex items-center gap-3">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="rounded border border-current/20 bg-transparent p-2 text-sm"
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-6 rounded border border-red-500/40 p-3 text-sm text-red-500">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.dataUrl} alt={prompt} className="w-full rounded" />
          <p className="mt-3 text-xs opacity-60">
            {result.provider} · {result.model} · {(result.ms / 1000).toFixed(1)}s
          </p>
          {result.fellBackFrom.length > 0 && (
            <p className="mt-1 text-xs text-amber-500">
              fell back from {result.fellBackFrom.map((f) => `${f.provider} (${f.reason})`).join(', ')}
            </p>
          )}
        </section>
      )}
    </main>
  )
}
