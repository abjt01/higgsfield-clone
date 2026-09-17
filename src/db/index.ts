import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

let cached: Db | undefined

/**
 * Runtime DB handle, over the POOLED Neon connection.
 *
 * Lazy on purpose: `next build` must not require a database to be reachable,
 * and nothing in the app should import a connection it does not use.
 */
export function getDb(): Db {
  if (cached) return cached

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Use the POOLED Neon string (host contains "-pooler").')
  }
  if (!url.includes('-pooler')) {
    console.warn('[db] DATABASE_URL does not look pooled. Serverless functions will exhaust connections under load.')
  }

  cached = drizzle(neon(url), { schema })
  return cached
}
