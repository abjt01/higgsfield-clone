import nextDynamic from 'next/dynamic'
import Link from 'next/link'

import { PresetMarquee } from '@/components/preset-marquee'
import { SafeImage } from '@/components/safe-image'
import { getFeedPage } from '@/lib/feed'
import { safeQuery } from '@/lib/safe-db'
import { CAMERA_PRESETS } from '@/lib/presets/cameras'
import { clientPresets } from '@/lib/presets/client'
import { STYLE_PRESETS } from '@/lib/presets/styles'

// The feed strip reads the database, so this renders per request rather than
// being prerendered at build time when no database may be reachable.
export const dynamic = 'force-dynamic'

const HeroReel = nextDynamic(() => import('@/components/hero-reel'), {
  loading: () => (
    <div
      className="animate-pulse rounded-[var(--radius-card)] border border-line bg-surface-2"
      style={{ aspectRatio: '16 / 9' }}
    />
  ),
})

const HERO_SHOTS = ['rooftop', 'alley', 'desert', 'diver', 'station']
const HERO_MOVES = ['crash-zoom-in', 'orbit-left', 'drone-pull-back', 'bullet-time', 'dolly-in']

export default async function Home() {
  const presets = clientPresets()
  // Degrades rather than 500s: the landing has no real dependency on the
  // database, and it is the first page anyone hits.
  const feed = await safeQuery('landing feed', () => getFeedPage(undefined, 8))

  const shots = HERO_SHOTS.map((name, i) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === HERO_MOVES[i])!
    return { src: `/hero/${name}.webp`, label: preset.label, motion: preset.motion! }
  })

  // 16, not 24. Each row renders its tiles twice for a seamless loop, so 8 per
  // row already overflows the viewport; the extra 8 were 8 more image requests
  // below the fold for no visible gain.
  const showcase = presets.filter((p) => p.group === 'style').slice(0, 16)

  return (
    <main>
      {/* ---------------------------------------------------------- hero */}
      <section className="mx-auto max-w-[90rem] px-4 pb-16 pt-12 sm:px-6 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {CAMERA_PRESETS.length} camera moves · {STYLE_PRESETS.length} styles
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Direct the shot,
              <br />
              not just the image<span className="text-accent">.</span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Every preset rewrites the prompt with real cinematography — lens, framing and
              the physical motion of the camera. Then the still is animated into a clip you
              can actually download.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-dim"
              >
                Start creating — free
              </Link>
              <Link
                href="/feed"
                className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-muted transition hover:border-muted/60 hover:text-fg"
              >
                Explore community
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted">
              No signup. 50 credits the moment you arrive.
            </p>
          </div>

          <HeroReel shots={shots} />
        </div>
      </section>

      {/* ------------------------------------------------------ presets */}
      <section className="border-y border-line bg-surface/40 py-10 sm:py-12">
        <div className="mx-auto mb-6 max-w-[90rem] px-4 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            The preset system
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            A preset is not a label stapled to your prompt. Pick Bullet Time and the prompt
            gains frozen motion, suspended debris and rim lighting. Pick Film Noir and it
            gains hard chiaroscuro and venetian shadow.
          </p>
        </div>

        <PresetMarquee presets={showcase} />

        <div className="mx-auto mt-8 max-w-[90rem] px-4 sm:px-6">
          <ScaffoldExample />
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {[
            {
              title: 'The link cannot go dark',
              body: 'Generation falls through to a keyless provider the moment the primary is rate limited, so a demo never dies mid-click.',
            },
            {
              title: 'Real clips, not stock',
              body: 'Your image on canvas, the camera move applied, captured with MediaRecorder into an MP4 you can download.',
            },
            {
              title: 'Remix anything',
              body: 'Click remix on any community post and its exact prompt, camera move and style load into your composer.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-surface p-6">
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- community */}
      {feed && feed.items.length > 0 && (
        <section className="mx-auto max-w-[90rem] px-4 pb-20 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                From the community
              </h2>
              <p className="mt-2 text-sm text-muted">Every one of these is one click from your composer.</p>
            </div>
            <Link href="/feed" className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline">
              Explore community →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {feed.items.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={`/g/${item.id}`}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2"
              >
                <SafeImage
                  seed={item.id}
                  src={item.imageUrl}
                  alt={item.subject}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized={item.imageUrl.startsWith('data:')}
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8 text-[10px] leading-tight">
                  {item.subject}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- cta */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[90rem] px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your first shot costs one credit<span className="text-accent">.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            You have fifty, and you did not have to sign up for them.
          </p>
          <Link
            href="/create"
            className="mt-7 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent-dim"
          >
            Open the composer
          </Link>
        </div>
      </section>
    </main>
  )
}

/** Shows what a preset actually injects, because claiming it is weaker. */
function ScaffoldExample() {
  const bullet = CAMERA_PRESETS.find((p) => p.id === 'bullet-time')!
  const noir = STYLE_PRESETS.find((p) => p.id === 'neon-noir')!

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted">
        What actually gets sent
      </div>
      <div className="space-y-2 p-4 text-xs leading-relaxed">
        <p>
          <span className="text-fg">a lone samurai on a neon rooftop</span>
          <span className="text-muted"> — what you typed</span>
        </p>
        <p className="text-accent/90">
          {bullet.scaffold}
          <span className="text-muted"> — Bullet Time</span>
        </p>
        <p className="text-accent/70">
          {noir.scaffold}
          <span className="text-muted"> — Neon Noir</span>
        </p>
      </div>
    </div>
  )
}
