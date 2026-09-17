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
    prompt: text('prompt').notNull(),
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
    index('generations_user_created_idx').on(t.userId, t.createdAt.desc()),
    // Community feed: public generations, newest first. Both are keyset-paginated
    // on created_at, so the index order matches the query order exactly.
    index('generations_visibility_created_idx').on(t.visibility, t.createdAt.desc()),
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
