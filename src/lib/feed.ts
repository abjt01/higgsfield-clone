import { and, desc, eq, isNotNull, lt, notLike } from 'drizzle-orm'

import { getDb } from '@/db'
import { generations, users } from '@/db/schema'
import { getPreset } from '@/lib/presets'

export interface FeedCard {
  id: string
  subject: string
  prompt: string
  aspectRatio: string
  imageUrl: string
  provider: string
  model: string
  createdAt: string
  author: string
  /** Resolved from the static catalogue, not the database. */
  camera: { id: string; label: string } | null
  style: { id: string; label: string } | null
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export const FEED_PAGE_SIZE = 24

/**
 * Attach preset labels.
 *
 * The preset catalogue is static application data, not a table, so this costs
 * no queries at all — the plan flagged author+preset as the most likely N+1 in
 * the app, and only the author half needs the database.
 */
function decorate(row: {
  generation: typeof generations.$inferSelect
  author: string
}): FeedCard {
  const camera = getPreset(row.generation.cameraPresetId)
  const style = getPreset(row.generation.presetId)

  return {
    id: row.generation.id,
    subject: row.generation.subject,
    prompt: row.generation.prompt,
    aspectRatio: row.generation.aspectRatio,
    imageUrl: row.generation.imageUrl!,
    provider: row.generation.provider,
    model: row.generation.model,
    createdAt: row.generation.createdAt.toISOString(),
    author: row.author,
    camera: camera ? { id: camera.id, label: camera.label } : null,
    style: style ? { id: style.id, label: style.label } : null,
  }
}

/**
 * Public generations, newest first.
 *
 * Keyset pagination on created_at, never OFFSET: OFFSET re-scans and skips
 * every preceding row, so deep pages get progressively slower and an insert
 * mid-scroll shifts the window and duplicates a card. The cursor is the last
 * row's created_at, which matches generations_visibility_created_idx exactly,
 * so the database walks straight to the right place and returns rows already
 * in order.
 */
export async function getFeedPage(cursor?: Date, limit = FEED_PAGE_SIZE): Promise<Page<FeedCard>> {
  const db = getDb()

  const base = and(
    eq(generations.visibility, 'public'),
    // Only finished generations belong in a public gallery.
    isNotNull(generations.imageUrl),
    // Never serve the dev storage fallback to the public feed. When Blob is
    // not configured, putImage inlines the image as a base64 data URL; ten of
    // those on the landing page turned one HTML document into 4.3MB and took
    // mobile Lighthouse from 95 to 53. Blob URLs are unaffected.
    notLike(generations.imageUrl, 'data:%'),
  )

  const rows = await db
    .select({ generation: generations, author: users.displayName })
    .from(generations)
    .innerJoin(users, eq(users.id, generations.userId))
    .where(cursor ? and(base, lt(generations.createdAt, cursor)) : base)
    .orderBy(desc(generations.createdAt))
    .limit(limit)

  return {
    items: rows.map(decorate),
    nextCursor: rows.length === limit ? rows[rows.length - 1].generation.createdAt.toISOString() : null,
  }
}

/** The signed-in user's own generations, finished or not. */
export async function getLibraryPage(
  userId: string,
  cursor?: Date,
  limit = FEED_PAGE_SIZE,
): Promise<Page<FeedCard & { visibility: string }>> {
  const db = getDb()

  const base = and(eq(generations.userId, userId), isNotNull(generations.imageUrl))

  const rows = await db
    .select({ generation: generations, author: users.displayName })
    .from(generations)
    .innerJoin(users, eq(users.id, generations.userId))
    .where(cursor ? and(base, lt(generations.createdAt, cursor)) : base)
    .orderBy(desc(generations.createdAt))
    .limit(limit)

  return {
    items: rows.map((r) => ({ ...decorate(r), visibility: r.generation.visibility })),
    nextCursor: rows.length === limit ? rows[rows.length - 1].generation.createdAt.toISOString() : null,
  }
}

/** One generation for a share page. Public, or owned by the viewer. */
export async function getShareable(id: string, viewerId?: string): Promise<FeedCard | null> {
  const db = getDb()

  const [row] = await db
    .select({ generation: generations, author: users.displayName })
    .from(generations)
    .innerJoin(users, eq(users.id, generations.userId))
    .where(eq(generations.id, id))
    .limit(1)

  if (!row || !row.generation.imageUrl) return null
  if (row.generation.visibility !== 'public' && row.generation.userId !== viewerId) return null

  return decorate(row)
}
