# higgsfield.clone

A rebuild of [Higgsfield](https://higgsfield.ai)'s core loop, not its landing page:

```
prompt + preset → generation → library → community → remix
```

The preset system is the product, so it got built first and best: **44 camera
moves and 37 styles**, each injecting real prompt scaffolding rather than a
label. Generated stills are then animated on canvas and captured to a
downloadable MP4 — the one thing here that the original does not do.

**Live:** https://higgsfield-clone-gamma.vercel.app
**Source:** https://github.com/abjt01/higgsfield-clone

---

## The one upgrade over the original

Real video generation is 60–120s and dollars per clip — a bad experience for
someone clicking around. Rather than resolve video jobs to a stock clip
unrelated to the prompt, this generates the image for real and then **actually
applies the chosen camera move to it** — crash zoom, dolly, orbit, pan, bullet
time — rendered in-browser on canvas and captured via `MediaRecorder` into a
real downloadable file.

It is the user's actual prompt, it demonstrates the camera preset (the thing
Higgsfield sells), it costs nothing, it returns in seconds, and it cannot break
live.

## What a preset actually does

Not a label appended to your prompt. `Bullet Time` contributes:

> bullet time, the subject frozen mid-action while the camera sweeps around
> them at speed, time suspended, debris and droplets hanging motionless in the
> air, dramatic rim lighting picking out the silhouette

Your subject leads, then the camera scaffold, then the style scaffold — image
models weight earlier tokens more heavily, so the subject must not be buried.
A subject plus both presets composes to roughly 450 characters.

Camera presets also carry declarative motion (scale, offset, rotation, easing,
shake) that drives the canvas renderer.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind v4, design tokens in `globals.css` |
| Database | Postgres on Neon, Drizzle ORM |
| Images | Google AI Studio `gemini-2.5-flash-image` ("nano banana"), Pollinations fallback |
| Storage | Vercel Blob |
| Hosting | Vercel |

Jobs are a database table with client polling — boring, serverless-safe, and it
survives a refresh mid-generation.

### The provider chain never goes dark

Primary is Gemini on the free tier (no card). On a `429`, a timeout, a network
failure or a safety refusal it falls through to **Pollinations, which needs no
key at all**. A deployed link cannot die mid-demo because a quota ran out.

`IMAGE_PROVIDER` pins one provider so the fallback can be demonstrated on
command. `IMAGE_PROVIDER=stub` uses an offline PNG encoder — deterministic, no
network, no quota — which is what CI runs on.

Two honest caveats: Gemini output carries a **SynthID watermark**, and
Pollinations ignores `nologo=true`, so its output is watermarked (the committed
assets have that band cropped off).

## Running it

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run db:migrate
npm run dev
```

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | everything | **Pooled** Neon string (host contains `-pooler`) |
| `DATABASE_URL_UNPOOLED` | migrations | Direct string — DDL through a pooler is unreliable |
| `GEMINI_API_KEY` | primary provider | [aistudio.google.com/apikey](https://aistudio.google.com/apikey), free, no card |
| `BLOB_READ_WRITE_TOKEN` | image storage | Without it, images inline as data URLs (dev only) |
| `SESSION_SECRET` | sessions | `openssl rand -base64 32` |
| `IMAGE_PROVIDER` | optional | `gemini` \| `pollinations` \| `stub`. **Leave unset in production** or the fallback chain is disabled |

Local Postgres works too — `src/db/index.ts` picks `node-postgres` for a
non-Neon URL, so the whole thing runs without provisioning anything.

```bash
npm run seed:feed 60    # fills the community feed from preset thumbnails, no quota
```

## Verification

Five suites, all wired into CI. They exist because most of the real bugs in
this build were things a type checker cannot see.

```bash
npm run verify:render      # renderer maths across all 44 camera presets
npm run verify:studio      # real Chrome: canvas, MediaRecorder, a decodable MP4
npm run verify:feed        # keyset pagination, share pages, OG images, remix
npm run verify:api         # credits under concurrency, job claiming, rate limits
npm run verify:resilience  # every page still renders with the database down
```

Order matters: `verify:api` deliberately trips the rate limiter, so run it
last. CI enforces that order.

`verify:resilience` needs a server started against a deliberately dead
database; `verify:studio` needs Chrome (`CHROME_PATH` to override the path).

## Things that are real, and things that are not

**Real:** the credit balance (decrements per generation, refunded on failure,
enforced server-side, cannot go negative under concurrency), guest sessions,
the job state machine including stale-job reaping, keyset pagination,
visibility enforcement on share pages, rate limiting, and the camera renderer.

**Not real:** billing. The pricing page says so rather than faking a checkout
that goes nowhere. Plan buttons are inert.

**Cut on purpose:** Enterprise/Team plans, API console, After Effects plugin,
MCP/CLI, Cinema Studio timeline editor, Soul ID.

## Performance and accessibility

Lighthouse, measured on a production build:

| | Landing | Create | Pricing | Feed |
| --- | --- | --- | --- | --- |
| Desktop | 100 / 100 / 100 / 100 | 100 | 100 | 100 |
| Mobile (perf) | 93 | 94 | 98 | 93 |

Accessibility, best practices and SEO are **100 on every page, desktop and
mobile**, with no failed audits and CLS of 0. Every colour in the palette was
chosen by computing its contrast ratio, not by eye.

Notable decisions:

- The feed index is **partial and `NULLS FIRST`**. Drizzle emits
  `DESC NULLS LAST`, but Postgres reads `ORDER BY created_at DESC` as
  `DESC NULLS FIRST`, so the index could not supply the ordering and the
  planner silently ignored it. At 40k rows: 13.2ms → **0.029ms**.
- Pagination is keyset, never `OFFSET`. At depth: 0.37ms versus 30.5ms.
- The public feed excludes `data:` URLs. Without a Blob token the dev fallback
  inlines base64 images, and ten of those made one HTML document **4.3MB**.
- The hero is not a video file. It runs the product's own camera renderer live
  on stills — 92KB of WebP instead of megabytes of MP4, and it cannot drift
  from what the renderer actually does.

## Layout

```
src/
  app/                    routes: /, /create, /feed, /library, /g/[id], /pricing
    api/                  generations, feed, library, me
  components/             composer, preset picker, camera studio, grids, nav, footer
  db/                     drizzle schema and the runtime handle
  lib/
    presets/              the 81 presets and prompt composition
    render/               easing, camera renderer, MediaRecorder capture
    providers/            gemini, pollinations, stub, and the fallback chain
scripts/                  generators, seeds and the five verification suites
.agent-logs/              every prompt and response from the build
```

## Known gaps

Stated plainly rather than discovered by whoever reads this next.

- **Production migrations have not been run.** Vercel does not expose secret
  environment variables at build time, so `vercel-build` skips the migration
  and the deployed database has no tables. Every database-backed route on the
  live URL answers `503` until someone runs `db:migrate` against the direct
  Neon string. Pages still render — that is what `verify:resilience` guards —
  but generation, feed, library, remix and share pages do not work.
- **`IMAGE_PROVIDER` is set in the production environment.** Any value there is
  wrong: it either serves stubs or disables the fallback chain. It should be
  unset.
- **The pricing page was not restructured** to match the reference's
  configurator and comparison table. It carries the shared palette and buttons
  but keeps its own simpler layout.
- Orbit and bullet time are **2.5D** — scale, offset and a few degrees of
  rotation on a flat still. They read convincingly as a camera arc, but there
  is no real parallax. True 3D orbit needs a depth map.

## Agent logs

`.agent-logs/` holds the raw prompt-and-response record for this build, captured
automatically by a Claude Code hook (`.claude/hooks/capture.py`). It is committed
on purpose, dead ends included. See `CAPTURE-TEST.md`.
