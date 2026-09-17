import Link from 'next/link'

import { GenerationGrid } from '@/components/generation-grid'
import { getLibraryPage } from '@/lib/feed'
import { readUser } from '@/lib/session'

// Personal and changes constantly: never cached.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Library · Higgsfield clone',
  description: 'Your generations.',
}

export default async function LibraryPage() {
  const user = await readUser()

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24">
        <h1 className="text-xl font-semibold">Library</h1>
        <p className="mt-2 text-sm text-muted">
          Nothing here yet. Your session starts the first time you generate.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Create something
        </Link>
      </main>
    )
  }

  const first = await getLibraryPage(user.id)

  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl font-semibold tracking-tight">Library</h1>
        <span className="text-sm text-muted">
          {user.displayName} · {user.credits} credits
        </span>
      </header>

      <GenerationGrid
        endpoint="/api/library"
        initial={first}
        showVisibility
        emptyMessage="No finished generations yet."
      />
    </main>
  )
}
