import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

// Migrations run over the UNPOOLED connection: DDL through a pgbouncer pool is
// unreliable. Runtime uses the pooled URL instead (see src/db/index.ts).
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

// Not fatal: `drizzle-kit generate` diffs the schema offline and needs no
// database. Only migrate/push actually connect.
if (!url) {
  console.warn('[drizzle] No DATABASE_URL_UNPOOLED/DATABASE_URL — generate works, migrate will not.')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: url ?? '' },
})
