# Workflows

## `ci.yml`

Runs on every push to `main`, every pull request, and on demand.

**`static`** — lint, typecheck, the renderer maths suite and a production build.
No database, no browser, no server, so it fails fast. The build step doubles as
a guard that nothing has started touching the database at build time.

**`integration`** — Postgres 16 as a service container, migrations, a real
build, the server running with the stub image provider, and the three suites
that need all of that:

| Step | Covers |
| --- | --- |
| `verify:studio` | Real Chrome: canvas, MediaRecorder, a decodable MP4, CORS taint |
| `verify:feed` | Keyset pagination, one-join feed cards, share pages, OG images, remix |
| `verify:api` | Credits under concurrency, atomic job claim, stale-job reaping, ownership, rate limits |
| `verify:resilience` | Every page still renders and the API answers 503 when Postgres is unreachable |

The order is deliberate. `verify:api` deliberately trips the per-IP rate
limiter, so running it first makes the other two fail for the wrong reason.

The resilience step restarts the server against a dead database on purpose.
Migrating a database fixes one outage; this stops the app regressing to a 500
on the landing page the next time the database is briefly unreachable.

`IMAGE_PROVIDER=stub` keeps CI deterministic and offline. Gemini and
Pollinations are both rate limited and would make runs flaky without adding
signal — the provider chain itself is covered by unit-level checks.

## `deploy.yml`

Optional. Vercel's Git integration already deploys on push, which is the
simpler default and needs no secrets at all.

Use this workflow instead when you want **migrations to run as a gated step
before the deploy** rather than by hand. It skips itself cleanly when
`VERCEL_TOKEN` is absent, so a fresh clone does not show a permanently failing
check. It does fail loudly if `VERCEL_TOKEN` is set without
`DATABASE_URL_UNPOOLED`, since that combination deploys code whose database
schema was never migrated.

Secrets, if you enable it:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL_UNPOOLED` — the direct Neon string, not the pooled one
