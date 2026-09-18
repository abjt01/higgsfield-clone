import { LoadingAnnounce } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="mx-auto max-w-[80rem] px-4 py-14 sm:px-6">
      <LoadingAnnounce label="Loading pricing" />
      <div className="mx-auto h-9 w-72 max-w-full animate-pulse rounded bg-surface-2" />
      <div className="mx-auto mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-surface-2" />
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[26rem] animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
        ))}
      </div>
    </main>
  )
}
