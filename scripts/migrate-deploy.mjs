/**
 * Runs pending migrations as part of the build.
 *
 * Vercel will not expose production secrets to `vercel env pull`, so the
 * connection string cannot be fetched to a laptop and migrated by hand — which
 * is just as well, because a hand-run migration is a step someone forgets and
 * the result is code deployed against an unmigrated schema returning 500s.
 * The build container already has the variables, so it migrates there.
 *
 * Drizzle tracks applied migrations in a journal table, so re-running is a
 * no-op and concurrent builds converge.
 *
 * Skips when no database is configured, so a preview or a fresh clone still
 * builds. Fails loudly when one IS configured and the migration does not
 * apply, because shipping past that is worse than failing the build.
 */
import { spawnSync } from 'node:child_process'

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!url) {
  console.log('[migrate-deploy] no database configured, skipping migrations')
  process.exit(0)
}

if (process.env.DATABASE_URL_UNPOOLED === undefined) {
  console.warn(
    '[migrate-deploy] DATABASE_URL_UNPOOLED is not set, falling back to DATABASE_URL. ' +
      'DDL through a connection pooler is unreliable; prefer the direct string.',
  )
}

const host = (() => {
  try {
    return new URL(url).host
  } catch {
    return 'unparseable'
  }
})()

console.log(`[migrate-deploy] applying migrations to ${host}`)

const res = spawnSync('npx', ['drizzle-kit', 'migrate'], { stdio: 'inherit', env: process.env })

if (res.status !== 0) {
  console.error('[migrate-deploy] migration failed — refusing to build against an unmigrated schema')
  process.exit(res.status ?? 1)
}

console.log('[migrate-deploy] migrations up to date')
