'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { onCredits } from '@/lib/credits'

/**
 * Live credit balance in the nav.
 *
 * Renders nothing until a session exists, so a first-time visitor is not shown
 * a balance they do not have yet.
 */
export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => !cancelled && setCredits(d.credits))
      .catch(() => {})

    const unsubscribe = onCredits((next) => {
      if (!cancelled) setCredits(next)
    })

    // Returning the unsubscribe directly meant `cancelled` was never set, so an
    // in-flight fetch could still call setCredits after unmount.
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  if (credits === null) return null

  return (
    <Link
      href="/pricing"
      title="Credits remaining"
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums transition ${
        credits <= 5
          ? 'border-hot/50 text-hot hover:bg-hot/10'
          : 'border-line text-muted hover:border-accent/50 hover:text-accent'
      }`}
    >
      <span aria-hidden>◆</span>
      {credits}
    </Link>
  )
}
