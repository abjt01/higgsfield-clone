import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SafeImage } from '@/components/safe-image'
import { DbUnavailable } from '@/components/db-unavailable'
import { getShareable } from '@/lib/feed'
import { safeQuery } from '@/lib/safe-db'
import { readUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Not found' }

  const card = await safeQuery('share metadata', () => getShareable(id))
  if (!card) return { title: 'Not found' }

  const title = card.subject.slice(0, 70)
  const bits = [card.camera?.label, card.style?.label].filter(Boolean).join(' · ')

  return {
    title: `${title} · Higgsfield clone`,
    description: bits || card.subject.slice(0, 160),
    openGraph: { title, description: bits, type: 'article' },
    twitter: { card: 'summary_large_image', title, description: bits },
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const viewer = await safeQuery('share session', () => readUser())

  // A read failure is not a 404. Returning "not found" for an unreachable
  // database would tell people their generation was deleted.
  const lookup = await safeQuery('share lookup', async () => ({
    card: await getShareable(id, viewer?.id),
  }))

  if (!lookup) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <DbUnavailable what="this generation" />
      </main>
    )
  }

  const card = lookup.card
  if (!card) notFound()

  const [w, h] = card.aspectRatio.split(':').map(Number)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <div className="relative bg-surface-2" style={{ aspectRatio: `${w} / ${h}` }}>
          <SafeImage
            seed={card.id}
            src={card.imageUrl}
            alt={card.subject}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={card.imageUrl.startsWith('data:')}
            priority
            className="object-contain"
          />
        </div>
      </div>

      <h1 className="mt-6 text-lg font-medium leading-snug">{card.subject}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {card.camera && <Chip>{card.camera.label}</Chip>}
        {card.style && <Chip>{card.style.label}</Chip>}
        <span className="text-muted">{card.aspectRatio}</span>
        <span className="text-muted">{card.provider} · {card.model}</span>
        <span className="text-muted">by {card.author}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/create?remix=${card.id}`}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-dim"
        >
          Remix this
        </Link>
        <a
          href={card.imageUrl}
          download={`${card.id}.jpg`}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:border-muted/60 hover:text-fg"
        >
          Download
        </a>
        <Link
          href="/feed"
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:border-muted/60 hover:text-fg"
        >
          Community
        </Link>
      </div>

      <details className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <summary className="cursor-pointer text-xs font-medium text-muted">
          Full composed prompt
        </summary>
        <p className="mt-3 text-xs leading-relaxed text-muted">{card.prompt}</p>
      </details>
    </main>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-accent/40 px-2 py-0.5 text-accent">{children}</span>
  )
}
