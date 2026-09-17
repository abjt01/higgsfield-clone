import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  /** Shown on community feed cards. Guests get one generated on signup. */
  displayName: text('display_name').notNull().default('guest'),
  isGuest: boolean('is_guest').notNull().default(true),
  credits: integer('credits').notNull().default(50),
  createdAt: createdAt(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    token: text('token').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  // Every request resolves the session by token. Unique doubles as the lookup index.
  (t) => [uniqueIndex('sessions_token_idx').on(t.token)],
)

export const generations = pgTable(
  'generations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The composed prompt actually sent to the provider. */
    prompt: text('prompt').notNull(),
    /** What the user typed, before preset scaffolding. Remix rebuilds from this. */
    subject: text('subject').notNull(),
    cameraPresetId: text('camera_preset_id'),
    presetId: text('preset_id'),
    aspectRatio: text('aspect_ratio').notNull().default('1:1'),
    // Which provider actually produced this image, so the fallback is
    // demonstrable in the UI rather than merely claimed.
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    imageUrl: text('image_url'),
    mime: text('mime'),
    visibility: text('visibility').notNull().default('private'),
    createdAt: createdAt(),
  },
  (t) => [
    // Library: a user's own generations, newest first.
    // NULLS FIRST, not drizzle's default NULLS LAST. Postgres reads
    // `ORDER BY created_at DESC` as DESC NULLS FIRST, so a NULLS LAST index
    // cannot supply that ordering and the planner silently ignores it and
    // sorts instead. Measured: the index was never chosen until this matched.
    index('generations_user_created_idx').on(t.userId, t.createdAt.desc().nullsFirst()),
    // Community feed: public, finished generations, newest first.
    //
    // Partial and ordered rather than a plain (visibility, created_at) index.
    // Measured at 40k rows, the plain version was ignored: visibility='public'
    // matches most of the table so it offers little selectivity, and
    // image_url IS NOT NULL is not in the index, so the planner preferred a
    // sequential scan and a top-N sort. Folding both predicates into the index
    // makes it match the feed query exactly, so the rows come back already
    // ordered and the sort disappears.
    index('generations_feed_idx')
      .on(t.createdAt.desc().nullsFirst())
      .where(sql`${t.visibility} = 'public' and ${t.imageUrl} is not null`),
  ],
)

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => generations.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('queued'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // The poller filters by status on every tick.
  (t) => [index('jobs_status_idx').on(t.status)],
)
