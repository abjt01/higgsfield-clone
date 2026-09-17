import { json, route } from '@/lib/http'
import { FEED_PAGE_SIZE, getFeedPage } from '@/lib/feed'
import { boundedInt, cursorDate } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async (request: Request) => {
  const url = new URL(request.url)
  const limit = boundedInt(url.searchParams.get('limit'), FEED_PAGE_SIZE, 1, 50)
  const cursor = cursorDate(url.searchParams.get('cursor'))

  return json(await getFeedPage(cursor, limit))
})
