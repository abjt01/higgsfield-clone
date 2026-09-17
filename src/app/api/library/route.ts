import { json, route } from '@/lib/http'
import { FEED_PAGE_SIZE, getLibraryPage } from '@/lib/feed'
import { readUser } from '@/lib/session'
import { boundedInt, cursorDate } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async (request: Request) => {
  // Read-only: listing must not mint a guest.
  const user = await readUser()
  if (!user) return json({ items: [], nextCursor: null })

  const url = new URL(request.url)
  const limit = boundedInt(url.searchParams.get('limit'), FEED_PAGE_SIZE, 1, 50)
  const cursor = cursorDate(url.searchParams.get('cursor'))

  return json(await getLibraryPage(user.id, cursor, limit))
})
