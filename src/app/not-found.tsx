import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-24">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-sm text-muted">That page does not exist.</p>
      <Link href="/create" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black">
        Go to Create
      </Link>
    </main>
  )
}
