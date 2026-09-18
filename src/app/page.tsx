import nextDynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'

import { MediaWall, type WallTile } from '@/components/media-wall'
import { PanelSection, SectionHeading, ViewAllPill } from '@/components/section'
import { getFeedPage } from '@/lib/feed'
import { CAMERA_PRESETS } from '@/lib/presets/cameras'
import { clientPresets } from '@/lib/presets/client'
import { STYLE_PRESETS } from '@/lib/presets/styles'
import { safeQuery } from '@/lib/safe-db'

// The community wall reads the database, so this renders per request rather
// than being prerendered at build time when none may be reachable.
export const dynamic = 'force-dynamic'

const HeroReel = nextDynamic(() => import('@/components/hero-reel'), {
  loading: () => <div className="aspect-video animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />,
})

const HERO_SHOTS = ['rooftop', 'alley', 'desert', 'diver', 'station']
const HERO_MOVES = ['crash-zoom-in', 'orbit-left', 'drone-pull-back', 'bullet-time', 'dolly-in']

/** Top row, as in the reference: full-bleed media, caption below and outside. */
const FEATURE_CARDS = [
  {
    href: '/create',
    src: '/hero/alley.webp',
    title: 'Cinematic Cameras',
    blurb: '44 camera moves that rewrite the prompt, not just label it.',
  },
  {
    href: '/create',
    src: '/hero/desert.webp',
    title: 'Camera-Move Clips',
    blurb: 'Your still, animated on canvas, downloaded as real MP4.',
  },
  {
    href: '/feed',
    src: '/hero/diver.webp',
    title: 'Community Remix',
    blurb: 'One click loads any prompt and preset into your composer.',
  },
]

const MODEL_CARDS = [
  { title: 'Nano Banana', kind: 'Image', badge: 'TOP', blurb: 'gemini-2.5-flash-image at 2K' },
  { title: 'Pollinations Flux', kind: 'Image', blurb: 'Keyless fallback, never rate-limited out' },
  { title: 'Camera Renderer', kind: 'Video', badge: 'NEW', blurb: 'Canvas plus MediaRecorder, in-browser' },
  { title: 'Preset Engine', kind: 'Prompt', blurb: '81 presets with real scaffolding' },
  { title: 'Job Pipeline', kind: 'System', blurb: 'DB-backed jobs, polled, credit-refunding' },
  { title: 'Guest Sessions', kind: 'Auth', blurb: '50 credits, no signup wall' },
]

export default async function Home() {
  const presets = clientPresets()
  const feed = await safeQuery('landing feed', () => getFeedPage(undefined, 10))

  const shots = HERO_SHOTS.map((name, i) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === HERO_MOVES[i])!
    return { src: `/hero/${name}.webp`, label: preset.label, motion: preset.motion! }
  })

  // Mixed aspects so the wall is not a uniform checkerboard.
  const presetTiles: WallTile[] = presets.slice(0, 26).map((p, i) => ({
    src: p.thumb,
    label: p.label,
    wide: i % 9 === 3,
    tall: i % 11 === 5,
  }))

  return (
    <main className="mx-auto max-w-[96rem] space-y-10 px-4 pb-16 pt-5 sm:px-5">
      {/* ------------------------------------------- top card row (no hero) */}
      <section>
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURE_CARDS.map((c) => (
            <Link key={c.title} href={c.href} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-tile)] bg-surface-2">
                <Image
                  src={c.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  priority
                  quality={70}
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <h2 className="mt-3 text-[13px] font-bold uppercase tracking-wide">{c.title}</h2>
              <p className="mt-1 text-[13px] text-muted">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------- promo + model grid, asymmetric as the reference */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Full-bleed: the reel fills the card, text sits over a dark gradient. */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-2">
          <HeroReel shots={shots} />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 sm:p-7">
            <h2 className="display max-w-md text-white">
              Direct the shot,
              <br />
              not just the image
            </h2>
            <p className="mt-2.5 max-w-sm text-[13px] text-white/75">
              {CAMERA_PRESETS.length} camera moves, {STYLE_PRESETS.length} styles, and a clip you
              can download. 50 credits on arrival, no signup.
            </p>
            <div className="pointer-events-auto mt-4 flex flex-wrap gap-2.5">
              <Link href="/create" className="btn btn-lime">
                Start creating
              </Link>
              <Link href="/feed" className="btn btn-white">
                Explore community
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODEL_CARDS.map((m) => (
            <div
              key={m.title}
              className="flex flex-col rounded-[var(--radius-tile)] border border-line-soft bg-surface p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span aria-hidden className="text-accent">
                  ◆
                </span>
                <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">
                  {m.kind}
                </span>
              </div>
              <h3 className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold leading-tight">
                {m.title}
                {m.badge === 'TOP' && (
                  <span className="rounded bg-hot-bg px-1 py-px text-[9px] font-bold text-white">TOP</span>
                )}
                {m.badge === 'NEW' && (
                  <span className="rounded bg-accent px-1 py-px text-[9px] font-bold text-black">NEW</span>
                )}
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-muted">{m.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ the preset system */}
      <PanelSection
        badge="81 presets"
        title="The preset system"
        subtitle="A preset is not a label stapled to your prompt. Pick Bullet Time and it gains frozen motion, suspended debris and rim lighting. Pick Neon Noir and it gains wet asphalt and volumetric light."
        primary={{ href: '/create', label: 'Start generating' }}
        secondary={{ href: '/feed', label: 'See results' }}
      >
        <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
          <MediaWall tiles={presetTiles} />
          <ViewAllPill href="/create" label={`View all ${presets.length} presets`} />
        </div>
      </PanelSection>

      {/* ------------------------------------------- vivid feature banner */}
      <PanelSection
        tone="vivid"
        badge="In your browser"
        title="Every move, recorded"
        subtitle="The camera move runs on canvas and captures through MediaRecorder into a real MP4. Motion blur scales with velocity, so a crash zoom smears and a slow push stays crisp. Clips cost no credits."
        primary={{ href: '/create', label: 'Record a clip' }}
        secondary={{ href: '/pricing', label: 'What it costs' }}
      >
        <div className="grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-4 sm:px-7 sm:pb-7">
          {['crash-zoom-in', 'orbit-left', 'bullet-time', 'drone-pull-back'].map((id) => {
            const preset = CAMERA_PRESETS.find((p) => p.id === id)!
            return (
              <figure key={id} className="overflow-hidden rounded-[var(--radius-tile)] bg-black/25">
                <div className="relative aspect-square">
                  <Image src={`/presets/${id}.webp`} alt="" fill sizes="25vw" className="object-cover" />
                </div>
                <figcaption className="px-2 py-1.5 text-[11px] font-medium text-white/85">
                  {preset.label}
                </figcaption>
              </figure>
            )
          })}
        </div>
      </PanelSection>

      {/* ------------------------------------------------------- community */}
      {feed && feed.items.length > 0 && (
        <section>
          <SectionHeading
            title="From the community"
            subtitle="Every one of these is one click from your composer."
            href="/feed"
            hrefLabel="Explore community"
          />
          <div className="relative">
            <MediaWall
              tiles={feed.items.map((i, n) => ({
                src: i.imageUrl,
                label: i.subject,
                wide: n === 2,
                tall: n === 5,
              }))}
            />
            <ViewAllPill href="/feed" label="Explore community" />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- cta */}
      <section className="rounded-[var(--radius-card)] bg-surface px-5 py-14 text-center sm:px-7">
        <h2 className="display mx-auto max-w-2xl text-accent">Your first shot costs one credit</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          You have fifty, and you did not have to sign up for them.
        </p>
        <Link href="/create" className="btn btn-lime mt-6">
          Open the composer
        </Link>
      </section>
    </main>
  )
}
