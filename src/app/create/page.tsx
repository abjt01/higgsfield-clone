import { Composer } from '@/components/composer'
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

export default async function CreatePage() {
  // Read-only: the guest session is created by the first POST, because a
  // Server Component is not allowed to set cookies.
  const user = await readUser()
  const presets = clientPresets()

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

      <Composer presets={presets} initialCredits={user?.credits ?? DEFAULT_CREDITS} />
    </main>
  )
}
