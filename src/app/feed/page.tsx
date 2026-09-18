import { GenerationGrid } from '@/components/generation-grid'
import { getFeedPage } from '@/lib/feed'

export const dynamic = 'force-dynamic'
// Short revalidate per the plan: a feed may lag a few seconds, a library may not.
export const revalidate = 15

export const metadata = {
  title: 'Community · Higgsfield clone',
  description: 'Public generations. Click remix to load any prompt and preset into your composer.',
}

export default async function FeedPage() {
  const first = await getFeedPage()

  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Community</h1>
        <p className="mt-1 text-sm text-muted">
          Remix loads that exact prompt, camera move and style straight into your composer.
        </p>
      </header>

      <GenerationGrid
        endpoint="/api/feed"
        initial={first}
        empty={{
          title: 'The feed is empty',
          body: 'Nothing has been shared publicly yet. Anything you generate is public by default, so yours would be the first.',
          actionHref: '/create',
          actionLabel: 'Generate the first one',
        }}
      />
    </main>
  )
}
