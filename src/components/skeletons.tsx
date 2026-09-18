/**
 * Shared loading shapes.
 *
 * Sized to the real content so the page does not jump when data arrives —
 * a skeleton that is the wrong height is worse than none, because it costs a
 * layout shift on every load.
 */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <div className="aspect-square animate-pulse bg-surface-2" />
          <div className="space-y-2 p-3">
            <div className="h-2.5 w-full animate-pulse rounded bg-surface-2" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="flex gap-1.5 pt-1">
              <div className="h-4 w-16 animate-pulse rounded-full bg-surface-2" />
              <div className="h-4 w-12 animate-pulse rounded-full bg-surface-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2" aria-hidden="true">
      <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
      <div className="h-3.5 w-80 max-w-full animate-pulse rounded bg-surface-2" />
    </div>
  )
}

/** Announces that something is loading without spamming a screen reader. */
export function LoadingAnnounce({ label }: { label: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {label}
    </p>
  )
}
