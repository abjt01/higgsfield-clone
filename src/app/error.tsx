'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-24">
      <h1 className="text-xl font-semibold">Something broke</h1>
      <p className="text-sm text-muted">
        That page hit an error. The detail is in the server logs rather than here, so
        nothing internal leaks into the browser.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
      >
        Try again
      </button>
    </main>
  )
}
