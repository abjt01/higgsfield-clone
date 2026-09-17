'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { FeedCard } from '@/lib/feed'

interface Props {
  endpoint: '/api/feed' | '/api/library'
  initial: { items: FeedCard[]; nextCursor: string | null }
  emptyMessage: string
  /** Library shows visibility and download; the feed does not. */
  showVisibility?: boolean
}

export function GenerationGrid({ endpoint, initial, emptyMessage, showVisibility }: Props) {
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

  if (items.length === 0) {
    return <p className="py-20 text-center text-sm text-muted">{emptyMessage}</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
      {loading && <p className="pb-8 text-center text-xs text-muted">Loading…</p>}
    </>
  )
}

function Card({ item, showVisibility }: { item: FeedCard & { visibility?: string }; showVisibility?: boolean }) {
  const [w, h] = item.aspectRatio.split(':').map(Number)

  return (
    <figure className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <Link href={`/g/${item.id}`} className="block">
        <div className="relative bg-surface-2" style={{ aspectRatio: `${w} / ${h}` }}>
          <Image
            src={item.imageUrl}
            alt={item.subject}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            unoptimized={item.imageUrl.startsWith('data:')}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <figcaption className="space-y-2 p-3">
        <p className="line-clamp-2 text-xs leading-snug">{item.subject}</p>

        <div className="flex flex-wrap gap-1">
          {item.camera && <Tag>{item.camera.label}</Tag>}
          {item.style && <Tag>{item.style.label}</Tag>}
          {showVisibility && item.visibility === 'private' && <Tag muted>Private</Tag>}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-[10px] text-muted">{item.author}</span>
          <Link
            href={`/create?remix=${item.id}`}
            className="shrink-0 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-black transition hover:bg-accent-dim"
          >
            Remix
          </Link>
        </div>
      </figcaption>
    </figure>
  )
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
        muted ? 'border-line text-muted' : 'border-accent/40 text-accent'
      }`}
    >
      {children}
    </span>
  )
}
