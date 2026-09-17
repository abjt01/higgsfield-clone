# Clone Higgsfield AI — build plan

## Thesis

The brief says rebuild a live *product*, not a landing page. The rubric rewards working
software and explicit scope decisions. So: one core loop that genuinely works, deployed
early, surrounded by just enough product to feel real.

The core loop of Higgsfield is not "text -> video". It is:

    prompt + preset -> generation -> library -> community -> remix

The preset system *is* the product (70+ camera moves, 50+ style presets). It gets built
first and best.

## The one upgrade over the original

Image generation is real. Video is not — real video gen is 60-120s and dollars per clip,
which is a terrible experience for a reviewer clicking around.

But instead of resolving video jobs to a stock clip unrelated to the prompt, we generate
the image for real and then actually apply the chosen camera move to it — crash zoom,
dolly in, pan, orbit, bullet time — rendered in-browser on canvas, captured via
MediaRecorder into a real downloadable clip.

Better than a clip library on every axis: it is the user's actual prompt, it genuinely
demonstrates the camera preset (the thing Higgsfield sells), it costs nothing, it returns
in seconds, and it cannot break live.

## Scope

Ship:

1. Create — prompt box, Image/Video mode, preset picker, model picker, aspect ratio,
   reference image upload
2. Preset system — searchable visual grid; each preset injects real prompt scaffolding,
   not just a label
3. Generation pipeline — DB-backed jobs, optimistic UI, queued/running/succeeded/failed,
   client polling, and a provider fallback that keeps the live link working even with the
   primary API exhausted
4. Library — your generations, filter, re-run, download
5. Community feed — public gallery with remix: one click loads that item's exact prompt
   and preset into your composer
6. Auth — instant guest session, optional email. A reviewer must never hit a signup wall
7. Landing — one strong scroll. Credible, not the main effort
8. Credits — a balance that actually decrements, plus a pricing page

Cut on purpose (state this in the walkthrough — it is scored): Enterprise/Team plans,
API console, After Effects plugin, MCP/CLI, real billing, Cinema Studio timeline editor,
Soul ID.

## Stack

Next.js 16 App Router, TypeScript, Tailwind v4, Postgres on Neon via the Vercel
integration, Drizzle, Vercel Blob for image storage, signed-cookie sessions.

Jobs are a DB table with client polling. Boring, serverless-safe, and it survives a
reviewer refreshing mid-generation.

**Everything runs at zero cost.** Vercel Hobby, Neon free, Blob free, and image
generation on a free tier with no card. Nothing in this build can produce a bill.

### Generation provider

Primary is **Google AI Studio, `gemini-2.5-flash-image`** — "nano banana". Free tier,
no card, ~500 requests/day, far more than a reviewer will ever click through. Higgsfield
advertises nano banana on their own site, so the clone runs the same model as the
original rather than a lookalike.

Confirmed against the API docs before committing to it:

- aspect ratio is a first-class request parameter (`1:1`, `3:2`, `2:3`, `3:4`, `4:3`,
  `4:5`, `5:4`, `9:16`, `16:9`, `21:9`) — maps directly onto the ratio picker in
  Create, so that control is real rather than decorative
- output is PNG. `ImageConfig.outputMimeType` and `outputCompressionQuality` exist in
  the SDK but are **Vertex-only and explicitly unsupported on the Gemini API**, so JPEG
  cannot be requested at the call. Transcode at the Blob-write step instead (perf item 6)
- quota exhaustion returns `429 RESOURCE_EXHAUSTED`, a clean and unambiguous fallback
  trigger
- all output carries a SynthID watermark. Disclose that in the walkthrough rather than
  letting a reviewer discover it

Secondary is **Pollinations** (`image.pollinations.ai`), which needs no key at all.
Verified live before being written in here: `200 image/jpeg`, 512x512 in 2.5s.
Caveat found in testing: `nologo=true` does **not** suppress their watermark, so fallback
output carries a visible "pollinations.ai" mark. Acceptable for a path that only runs
when the primary is exhausted, but do not show it as the happy path in the walkthrough.

Both sit behind one small interface:

    interface ImageProvider {
      name: 'gemini' | 'pollinations'
      generate(opts: { prompt: string; aspectRatio: string; seed?: number })
        : Promise<{ bytes: Buffer; mime: string }>
    }

The pipeline tries Gemini and, on 429, a network failure, a timeout or a safety refusal,
drops to Pollinations. **The live link can never go dead while someone is clicking it**
— that is the point, and it is worth more in a demo than a paid API.

Two consequences to lock in now, because both are expensive to retrofit:

- `generations.provider` is a column from the first migration, so the UI can honestly
  label which model produced each image and the fallback is demonstrable rather than
  claimed
- provider choice is forcible in dev via an env var, so the fallback path can be shown
  on demand during the walkthrough instead of hoping quota runs out on camera

## Sequencing

Governing principle: deployed and public by hour 3, not hour 20.

    0.0-0.5   Agent capture setup + verify, repo, provision Vercel/Neon/Blob/Gemini
    0.5-2.0   Scaffold, design tokens + dark theme, schema, auth, seed data
    2.0-3.0   Thin vertical slice live: prompt -> real image on screen, deployed, ugly
    3.0-6.0   Create page + preset system, properly
    6.0-8.0   Camera-move video renderer
    8.0-10    Library, community feed, remix, per-generation share pages
    10-12     Landing, credits, pricing
    12-14     Polish: loading/empty/error states, mobile, a11y, perf
    14-15     Deploy hardening, seed the live feed, README, walkthrough recording

~15h of the ~24, with real buffer. Better to hand back hours than a broken link.

## Standing constraints

- `.agent-logs/` is committed to a PUBLIC repo. No secret ever goes through the chat.
  Keys are written straight into .env.local and the Vercel dashboard by hand, and a scrub
  check runs before each commit.
- Commit `.agent-logs/` incrementally as work happens, not in one lump at the end.
- Plain commit messages, no trailers. Ask before every push.

## Open decisions

- Soul ID is the one cut a Higgsfield-literate reviewer might notice. Revisit if hour 12
  arrives with slack.

## Performance: what matters, what is already free

A full perf checklist was requested. Most of it is free on this stack or does not apply.
Recorded here so it is not re-litigated, and so nobody burns hours on infrastructure the
rubric does not measure.

### Already free — do not spend time

- CDN: Vercel is a global CDN, Blob is CDN-backed. Adding another is waste.
- Minification: `next build` handles JS and CSS.
- Payload compression: Vercel brotli/gzips automatically.
- Lazy loading: `next/image` is lazy by default. The work is NOT breaking it by setting
  `priority` on everything. Only the landing hero gets `priority`.
- Code splitting: App Router splits per route. One real exception, see below.
- Deferred scripts: there are no third-party scripts. If analytics is added later, use
  `next/script` with `strategy="afterInteractive"`.

### Does not apply

- Load balancer: no origin to balance, functions are already distributed.
- Remove unused deps: greenfield. The fix is not installing junk, not auditing later.
- Cache expensive computed results: nothing here is compute-bound. The expensive call is
  image generation, and persisting the result to Blob IS the cache. It also protects the
  daily free-tier quota, since re-running an identical prompt never costs a request.

### Must go in on day one — expensive to retrofit

1. Connection pooling. Neon POOLED connection string + `drizzle-orm/neon-http`.
   Using the direct URL from serverless functions exhausts connections under concurrency.
   This is the main serverless footgun in this stack.

2. Indexes, written into the schema:
     generations(user_id, created_at desc)
     generations(visibility, created_at desc)   -- community feed
     jobs(status)
     sessions(token)

3. Keyset pagination, not OFFSET:
     WHERE created_at < $cursor ORDER BY created_at DESC LIMIT n
   Pairs with the indexes above. Changing pagination shape after the UI exists is a
   rewrite, so the API returns a cursor from the very first commit.

4. N+1 prevention. Feed cards need author + preset. One join, decided up front. This is
   the most likely genuine perf bug in this app.

5. Caching, selectively:
     - preset catalog  -> static, cache hard (`unstable_cache` / route `revalidate`)
     - community feed  -> short revalidate
     - user library    -> never cached, it is personal and changes
     - JOB POLLING     -> `Cache-Control: no-store`, explicitly.
   That last one is critical. A cached polling response means generations appear to hang
   forever. It is the bug most likely to kill a live demo.

6. Images. Gemini returns PNG and will not negotiate mime type on the free API, so
   convert to JPEG when writing to Blob rather than at the generation call.
   Pollinations already returns JPEG. Serve everything through `next/image`.
   Pre-compress preset thumbnails to small WebP at author time — dozens render per grid,
   so they matter far more than individual generated images. Configure
   `images.remotePatterns` for the Blob domain.

7. Loading skeletons. Scored as UX, not perf. `loading.tsx` per route, real skeletons on
   the feed and library grids, honest progress states on the job pipeline.

8. Re-renders and debouncing — exactly two places:
     - debounce the preset SEARCH box
     - stop the preset grid re-rendering on every prompt keystroke
   No blanket `memo()` spree. That is cargo cult and costs more than it saves.

9. Dynamic import the camera-move video renderer. Canvas + MediaRecorder is the one
   genuinely heavy client bundle. `dynamic(..., { ssr: false })`, loaded on demand.

10. Lighthouse as a GATE at hour 12, not as a work item. Run it, fix what it reports,
    quote the number in the walkthrough.

### Framing

Nine of these ten are decisions made while writing the schema and the first query, not a
separate optimization phase. Total extra cost is roughly 90 minutes.

The app will be judged with near-zero traffic and a few dozen rows. Hours spent hardening
infrastructure buy nothing the rubric measures and cost the two things it does: working
product and UX.
