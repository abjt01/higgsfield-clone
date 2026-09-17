import { Composer } from '@/components/composer'
import { getShareable } from '@/lib/feed'
import { clientPresets } from '@/lib/presets/client'
import { readUser } from '@/lib/session'

// Creates the guest session on first visit, so the page cannot be static.
export const dynamic = 'force-dynamic'

/** Matches users.credits default in the schema. */
const DEFAULT_CREDITS = 50

export const metadata = {
  title: 'Create · Higgsfield clone',
  description: 'Prompt, camera move and style presets, then generate.',
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string }>
}) {
  const { remix } = await searchParams
  // Read-only: the guest session is created by the first POST, because a
  // Server Component is not allowed to set cookies.
  const user = await readUser()
  const presets = clientPresets()

  // Remix is resolved on the server: the composer arrives already populated
  // rather than mounting empty and back-filling from a client fetch.
  const source =
    remix && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(remix)
      ? await getShareable(remix, user?.id)
      : null

  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Create</h1>
        <p className="mt-1 text-sm text-muted">
          {presets.filter((p) => p.group === 'camera').length} camera moves ·{' '}
          {presets.filter((p) => p.group === 'style').length} styles. Each one rewrites the
          prompt, it is not just a label.
        </p>
      </header>

      {source && (
        <p className="mb-4 rounded-[var(--radius-card)] border border-accent/40 bg-accent/5 px-4 py-2.5 text-xs text-accent">
          Remixing {source.author}&rsquo;s generation. Prompt and presets are loaded — change
          anything you like.
        </p>
      )}

      <Composer
        presets={presets}
        initialCredits={user?.credits ?? DEFAULT_CREDITS}
        initial={
          source
            ? {
                subject: source.subject,
                cameraId: source.camera?.id ?? null,
                styleId: source.style?.id ?? null,
                aspectRatio: source.aspectRatio,
              }
            : undefined
        }
      />
    </main>
  )
}
