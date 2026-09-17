import Link from 'next/link'

import { CAMERA_PRESETS } from '@/lib/presets/cameras'
import { STYLE_PRESETS } from '@/lib/presets/styles'

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Higgsfield clone</p>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Prompt, preset, and a camera move
        <span className="text-accent">.</span>
      </h1>

      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
        {CAMERA_PRESETS.length} camera moves and {STYLE_PRESETS.length} styles that rewrite
        the prompt rather than tagging a label onto it. Generations run as database-backed
        jobs, and the result is animated on canvas into a real downloadable clip.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/create"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-dim"
        >
          Start creating
        </Link>
        <a
          href="https://github.com/abjt01/higgsfield-clone"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-muted transition hover:border-muted/60 hover:text-fg"
        >
          Source
        </a>
      </div>

      <dl className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
        {[
          ['Never goes dark', 'Falls back to a keyless provider when the primary is exhausted.'],
          ['Real clips', 'Canvas and MediaRecorder, not a stock video library.'],
          ['Guest first', 'No signup wall. 50 credits on arrival.'],
        ].map(([title, body]) => (
          <div key={title} className="bg-surface p-5">
            <dt className="text-sm font-medium">{title}</dt>
            <dd className="mt-1.5 text-xs leading-relaxed text-muted">{body}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
