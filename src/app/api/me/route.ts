import { json, route } from '@/lib/http'
import { readUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Current session, or nulls before one exists. Never mints a user. */
export const GET = route(async () => {
  const user = await readUser()

  return json({
    signedIn: Boolean(user),
    displayName: user?.displayName ?? null,
    credits: user?.credits ?? null,
    isGuest: user?.isGuest ?? true,
  })
})
