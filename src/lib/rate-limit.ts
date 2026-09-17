import { and, eq, gt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { generations } from '@/db/schema'

import { HttpError } from './http'

/** Per user, counted in the database so it holds across serverless instances. */
const PER_USER_PER_MINUTE = 8
const PER_USER_PER_DAY = 60

/**
 * Best-effort per-IP ceiling.
 *
 * In-memory, so on serverless it is per instance rather than global. It exists
 * to blunt a single client looping "clear cookie -> fresh guest -> 50 more
 * credits", which the per-user limit cannot see. Accurate global IP limiting
 * needs shared state; this is deliberately the cheap 80% of it.
 */
const ipHits = new Map<string, number[]>()
const PER_IP_PER_MINUTE = 12
const IP_WINDOW_MS = 60_000

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function checkIpRate(ip: string): void {
  const now = Date.now()
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS)

  if (hits.length >= PER_IP_PER_MINUTE) {
    throw new HttpError('Too many requests from this address. Wait a minute.', 429)
  }

  hits.push(now)
  ipHits.set(ip, hits)

  // Keep the map from growing without bound on a long-lived instance.
  if (ipHits.size > 5_000) {
    for (const [k, v] of ipHits) if (v.every((t) => now - t >= IP_WINDOW_MS)) ipHits.delete(k)
  }
}

export async function checkUserRate(userId: string): Promise<void> {
  const db = getDb()

  const [row] = await db
    .select({
      lastMinute: sql<number>`count(*) filter (where ${generations.createdAt} > now() - interval '1 minute')`,
      lastDay: sql<number>`count(*)`,
    })
    .from(generations)
    .where(
      and(
        eq(generations.userId, userId),
        gt(generations.createdAt, sql`now() - interval '1 day'`),
      ),
    )

  if (Number(row?.lastMinute ?? 0) >= PER_USER_PER_MINUTE) {
    throw new HttpError('Slow down — too many generations in the last minute.', 429)
  }
  if (Number(row?.lastDay ?? 0) >= PER_USER_PER_DAY) {
    throw new HttpError('Daily generation limit reached.', 429)
  }
}
