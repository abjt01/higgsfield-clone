import Link from 'next/link'

import { familiesFor } from '@/lib/presets'

const REPO = 'https://github.com/abjt01/higgsfield-clone'

/**
 * Full-bleed lime footer, matching the reference: a big black uppercase
 * wordmark on the left, dense muted-headed link columns across, an address and
 * links row, then a black legal bar.
 *
 * Every link resolves to something real. The reference lists dozens of
 * products; copying those names would produce a wall of dead links, so the
 * columns are built from this app's actual preset families and routes — the
 * family links carry a query the composer reads, so they genuinely filter.
 */
export function SiteFooter() {
  const cameraFamilies = familiesFor('camera')
  const styleFamilies = familiesFor('style')

  const columns: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      heading: 'Create',
      links: [
        { label: 'Composer', href: '/create' },
        { label: 'Camera moves', href: '/create?tab=camera' },
        { label: 'Styles', href: '/create?tab=style' },
        { label: 'Community', href: '/feed' },
        { label: 'Library', href: '/library' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      heading: 'Camera moves',
      links: cameraFamilies.map((f) => ({
        label: f,
        href: `/create?tab=camera&family=${encodeURIComponent(f)}`,
      })),
    },
    {
      heading: 'Styles',
      links: styleFamilies.map((f) => ({
        label: f,
        href: `/create?tab=style&family=${encodeURIComponent(f)}`,
      })),
    },
    {
      heading: 'Models',
      links: [
        { label: 'Nano Banana', href: '/pricing' },
        { label: 'Pollinations Flux', href: '/pricing' },
        { label: 'Camera renderer', href: '/create' },
        { label: 'What a credit buys', href: '/pricing' },
      ],
    },
    {
      heading: 'Project',
      links: [
        { label: 'Source', href: REPO, external: true },
        { label: 'Build plan', href: `${REPO}/blob/main/PLAN.md`, external: true },
        { label: 'Agent logs', href: `${REPO}/tree/main/.agent-logs`, external: true },
        { label: 'Capture test', href: `${REPO}/blob/main/CAPTURE-TEST.md`, external: true },
        { label: 'Issues', href: `${REPO}/issues`, external: true },
      ],
    },
  ]

  return (
    <footer className="mt-12">
      <div className="bg-accent text-black">
        <div className="mx-auto max-w-[96rem] px-4 pb-10 pt-12 sm:px-5">
          <div className="grid gap-y-10 lg:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] lg:gap-x-6">
            {/* Sized down from the section display scale: at 40px
                "Camera-native" wrapped onto its own lines and the two-line
                wordmark of the reference became four. */}
            {/* Not the .display class: that is defined after Tailwind's
                utilities in globals.css, so its clamp() font-size beat any
                text-[…] override on the same element. Styled directly instead.
                Each line is nowrap because the hyphen in "Camera-native" is a
                break opportunity and the wordmark kept becoming three lines. */}
            <h2 className="text-[1.75rem] font-extrabold uppercase leading-[1.03] tracking-[-0.025em] text-black sm:text-[2rem]">
              <span className="whitespace-nowrap">Camera-native</span>
              <br />
              <span className="whitespace-nowrap">image suite</span>
            </h2>

            {columns.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                {/* 60%, not 45%. Black at 45% over this lime computes to 3.31:1 and
                    Lighthouse flagged it; 60% clears 4.5 at 5.56 and still reads
                    as a muted column heading. */}
                <h3 className="text-[15px] font-medium text-black/60">{col.heading}</h3>
                <ul className="mt-3.5 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a
                          href={l.href}
                          className="text-[15px] text-black underline-offset-4 hover:underline"
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="text-[15px] text-black underline-offset-4 hover:underline"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-y-4 text-[15px]">
            <p className="text-black">
              A study build. Not affiliated with Higgsfield.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <a href={REPO} className="text-black underline-offset-4 hover:underline">
                GitHub
              </a>
              <Link href="/feed" className="text-black underline-offset-4 hover:underline">
                Community
              </Link>
              <Link href="/create" className="text-black underline-offset-4 hover:underline">
                Start creating
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ink">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-y-3 px-4 py-5 text-[13px] text-muted sm:px-5">
          <p>© {new Date().getFullYear()} higgsfield.clone — built by abjt01.</p>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            <Link href="/pricing" className="transition hover:text-fg">
              Pricing
            </Link>
            <a href={`${REPO}/blob/main/CAPTURE-TEST.md`} className="transition hover:text-fg">
              Capture test
            </a>
            <a href={`${REPO}/blob/main/PLAN.md`} className="transition hover:text-fg">
              Build plan
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
