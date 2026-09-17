import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

type Db =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>

let cached: Db | undefined

/**
 * Runtime DB handle.
 *
 * Neon in production, over the POOLED connection string. A non-Neon URL (local
 * Postgres) falls back to node-postgres so the pipeline can be run and tested
 * end to end without provisioning cloud infrastructure first.
 *
 * Lazy on purpose: `next build` must not require a reachable database.
 */
export function getDb(): Db {
  if (cached) return cached

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Use the POOLED Neon string (host contains "-pooler").')
  }

  if (url.includes('neon.tech')) {
    if (!url.includes('-pooler')) {
      console.warn('[db] Neon URL is not pooled. Serverless functions will exhaust connections under load.')
    }
    cached = drizzleNeon(neon(url), { schema })
  } else {
    cached = drizzlePg(new Pool({ connectionString: url, max: 5 }), { schema })
  }

  return cached
}
