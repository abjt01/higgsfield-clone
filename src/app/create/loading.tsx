export default function Loading() {
  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <div className="mb-6 h-6 w-32 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="h-44 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          <div className="h-[30rem] animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
        </div>
        <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
      </div>
    </main>
  )
}
