import Link from 'next/link'

/**
 * Small uppercase lime heading plus a gray subtitle, tight together.
 *
 * The reference keeps these deliberately small — its display type lives on
 * panel headings mid-page, not on a hero — so the page reads as a wall of work
 * rather than a marketing page.
 */
export function SectionHeading({
  title,
  subtitle,
  href,
  hrefLabel,
}: {
  title: string
  subtitle?: string
  href?: string
  hrefLabel?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2 className="eyebrow">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && hrefLabel && (
        <Link href={href} className="text-[13px] text-muted transition hover:text-accent">
          {hrefLabel} ↗
        </Link>
      )}
    </div>
  )
}

/**
 * The reference's main section container: a rounded panel a step lighter than
 * the page, a pill badge, a big uppercase lime heading, a subtitle, and a
 * right-aligned lime + white button pair.
 */
export function PanelSection({
  badge,
  title,
  subtitle,
  primary,
  secondary,
  children,
  tone = 'dark',
}: {
  badge?: string
  title: string
  subtitle?: string
  primary?: { href: string; label: string }
  secondary?: { href: string; label: string }
  children?: React.ReactNode
  /** 'dark' is the default panel; 'vivid' is the full-bleed gradient banner. */
  tone?: 'dark' | 'vivid'
}) {
  const vivid = tone === 'vivid'

  return (
    <section
      className={`overflow-hidden rounded-[var(--radius-card)] ${
        vivid ? 'bg-gradient-to-br from-[#0f5f6b] via-[#12507f] to-[#1b2f6b]' : 'bg-surface'
      }`}
    >
      <div className="p-5 sm:p-7">
        {badge && (
          <span
            className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              vivid ? 'bg-white/15 text-white' : 'bg-accent/15 text-accent'
            }`}
          >
            <span aria-hidden>◆</span>
            {badge}
          </span>
        )}

        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h2 className={`display ${vivid ? 'text-white' : 'text-accent'}`}>{title}</h2>
            {subtitle && (
              <p
                className={`mt-3 max-w-xl text-sm leading-relaxed ${
                  vivid ? 'text-white/70' : 'text-muted'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {(primary || secondary) && (
            <div className="flex shrink-0 flex-wrap gap-2.5">
              {primary && (
                <Link href={primary.href} className={`btn ${vivid ? 'btn-white' : 'btn-lime'}`}>
                  {primary.label}
                </Link>
              )}
              {secondary && (
                <Link href={secondary.href} className={`btn ${vivid ? 'btn-ghost' : 'btn-white'}`}>
                  {secondary.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {children}
    </section>
  )
}

/**
 * Caps a media wall: a lime pill floating over a gradient fade, so the grid
 * reads as continuing past the cut rather than simply ending.
 */
export function ViewAllPill({ href, label }: { href: string; label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-gradient-to-t from-ink via-ink/85 to-transparent pb-1">
      <Link
        href={href}
        className="pointer-events-auto rounded-full bg-surface-3/90 px-4 py-2 text-[13px] font-semibold text-accent backdrop-blur transition hover:bg-surface-3"
      >
        {label} ↗
      </Link>
    </div>
  )
}
