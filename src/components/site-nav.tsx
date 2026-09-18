'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { CreditsBadge } from './credits-badge'

const LINKS = [
  { href: '/create', label: 'Create' },
  { href: '/feed', label: 'Community' },
  { href: '/library', label: 'Library' },
  { href: '/pricing', label: 'Pricing', badge: 'Free' },
]

export function SiteNav() {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  // The menu closes on navigation. Stored with the path it was opened at and
  // compared during render, rather than reset by an effect that fires after a
  // frame of the menu still being open.
  const [menu, setMenu] = useState({ open: false, at: pathname })
  const open = menu.open && menu.at === pathname
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setMenu((m) => ({ open: typeof next === 'function' ? next(m.open && m.at === pathname) : next, at: pathname }))

  useEffect(() => {
    if (!open) return

    // Closes by setting state directly: setOpen is rebuilt every render, so
    // depending on it would resubscribe these listeners on each one.
    const close = () => setMenu({ open: false, at: pathname })

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-[90rem] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-black"
          >
            h
          </span>
          higgsfield<span className="text-accent">.clone</span>
        </Link>

        <ul className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
                    active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {l.label}
                  {l.badge && (
                    <span className="rounded bg-accent px-1 py-px text-[9px] font-bold uppercase text-black">
                      {l.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <CreditsBadge />

          <Link
            href="/create"
            className="hidden rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-accent-dim sm:inline-block"
          >
            Create
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg border border-line p-2 text-muted transition hover:text-fg md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {open ? (
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" fill="none" />
              ) : (
                <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.6" fill="none" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div ref={panelRef} id="mobile-menu" className="border-t border-line bg-ink md:hidden">
          <ul className="mx-auto max-w-[90rem] px-4 py-2 sm:px-6">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm ${
                      active ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {l.label}
                    {l.badge && (
                      <span className="rounded bg-accent px-1 py-px text-[9px] font-bold uppercase text-black">
                        {l.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
