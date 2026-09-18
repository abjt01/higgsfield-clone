'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { SafeImage } from '@/components/safe-image'
import { GridSkeleton } from '@/components/skeletons'
import type { FeedCard } from '@/lib/feed'

interface Props {
  endpoint: '/api/feed' | '/api/library'
  initial: { items: FeedCard[]; nextCursor: string | null }
  empty: { title: string; body: string; actionHref?: string; actionLabel?: string }
  /** Library shows visibility and download; the feed does not. */
  showVisibility?: boolean
}

export function GenerationGrid({ endpoint, initial, empty, showVisibility }: Props) {
  const [items, setItems] = useState(initial.items)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sentinel = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // Keyset: hand back the last row's timestamp rather than an offset.
      const res = await fetch(`${endpoint}?cursor=${encodeURIComponent(cursor)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      setItems((prev) => {
        // A row arriving mid-scroll must not produce a duplicate card.
        const seen = new Set(prev.map((i) => i.id))
        return [...prev, ...data.items.filter((i: FeedCard) => !seen.has(i.id))]
      })
      setCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [cursor, endpoint])

  useEffect(() => {
    const node = sentinel.current
    if (!node || !cursor) return

    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: '400px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [cursor, loadMore])

  if (items.length === 0) return <EmptyState {...empty} />

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <Card key={item.id} item={item} showVisibility={showVisibility} />
        ))}
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-red-400">
          {error}{' '}
          <button onClick={loadMore} className="underline">
            Retry
          </button>
        </p>
      )}

      <div ref={sentinel} className="h-10" />

      {loading && (
        <div className="pb-8">
          <p role="status" aria-live="polite" className="sr-only">
            Loading more
          </p>
          <GridSkeleton count={4} />
        </div>
      )}
    </>
  )
}

function Card({ item, showVisibility }: { item: FeedCard & { visibility?: string }; showVisibility?: boolean }) {
  const [w, h] = item.aspectRatio.split(':').map(Number)

  // Gallery, not dashboard. The reference gives media tiles no border and no
  // surface fill, lets the image run edge to edge, and puts the caption below
  // and outside it. A bordered card with the caption overlaid on the image is
  // what made this read as an admin panel rather than a showcase.
  return (
    <figure className="group">
      <Link href={`/g/${item.id}`} className="block">
        <div
          className="relative overflow-hidden rounded-[var(--radius-tile)] bg-surface-2"
          style={{ aspectRatio: `${w} / ${h}` }}
        >
          <SafeImage
            seed={item.id}
            src={item.imageUrl}
            alt={item.subject}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            unoptimized={item.imageUrl.startsWith('data:')}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </Link>

      <figcaption className="pt-2.5">
        <p className="line-clamp-1 text-[13px] font-medium leading-tight">{item.subject}</p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="truncate text-[11px] text-muted">{item.author}</span>
          {item.camera && <span className="truncate text-[11px] text-muted">· {item.camera.label}</span>}
          {showVisibility && item.visibility === 'private' && (
            <span className="text-[11px] text-muted-dim">· Private</span>
          )}
          <Link
            href={`/create?remix=${item.id}`}
            // Revealed on hover, but always reachable by keyboard.
            className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-accent opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
          >
            Remix ↗
          </Link>
        </div>
      </figcaption>
    </figure>
  )
}
