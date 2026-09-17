import { randomBytes } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { getDb } from '@/db'
import { sessions, users } from '@/db/schema'

const COOKIE = 'hf_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export interface SessionUser {
  id: string
  credits: number
  isGuest: boolean
}

/**
 * Read the current user without touching cookies.
 *
 * Safe in Server Components. Next only permits cookie mutation inside Server
 * Actions and Route Handlers, so anything that renders must use this and treat
 * null as "no session yet".
 */
export async function readUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null

  const found = await getDb()
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1)

  const row = found[0]
  if (!row || row.expiresAt.getTime() <= Date.now()) return null

  return { id: row.user.id, credits: row.user.credits, isGuest: row.user.isGuest }
}

/**
 * Resolve the current user, creating a guest instantly if there is none.
 *
 * Writes a cookie, so this is ONLY valid inside a Route Handler or Server
 * Action. A reviewer must never hit a signup wall, so the first API request
 * silently provisions a user and a session. The cookie holds a high-entropy
 * opaque token; the session row is the source of truth, read through
 * sessions_token_idx.
 */
export async function getOrCreateUser(): Promise<SessionUser> {
  const existing = await readUser()
  if (existing) return existing

  const db = getDb()
  const jar = await cookies()
  const [user] = await db.insert(users).values({}).returning()
  const fresh = randomBytes(32).toString('hex')

  await db.insert(sessions).values({
    token: fresh,
    userId: user.id,
    expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
  })

  jar.set(COOKIE, fresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })

  return { id: user.id, credits: user.credits, isGuest: user.isGuest }
}
