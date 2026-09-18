/**
 * Shared loading shapes.
 *
 * Sized to the real content so the page does not jump when data arrives —
 * a skeleton that is the wrong height is worse than none, because it costs a
 * layout shift on every load.
 */
export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
          <div className="pt-2.5">
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface-2" />
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
