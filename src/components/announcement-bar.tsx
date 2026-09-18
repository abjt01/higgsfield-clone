import { DismissButton } from './announcement-dismiss'

/**
 * Lime bar above the nav.
 *
 * Rendered on the server and hidden before first paint by an inline script, so
 * it neither flashes in nor shifts the page. The previous client-only version
 * mounted after hydration and was measurably responsible for the page's
 * cumulative layout shift.
 */
export const ANNOUNCEMENT_KEY = 'hf:announcement-dismissed'

/** Runs before paint. Kept tiny and inlined; a network round trip would defeat it. */
export const ANNOUNCEMENT_SCRIPT = `try{if(localStorage.getItem('${ANNOUNCEMENT_KEY}')==='1')document.documentElement.classList.add('hf-ann-hidden')}catch(e){}`

export function AnnouncementBar() {
  return (
    <div data-announcement className="relative bg-accent text-black">
      <div className="mx-auto flex max-w-[90rem] items-center justify-center gap-3 px-10 py-2 text-center">
        <p className="text-[13px] font-medium">
          Every visitor gets 50 credits. No card, no signup.
        </p>
        <a
          href="/create"
          className="hidden rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-accent transition hover:bg-black/80 sm:inline-block"
        >
          Start creating
        </a>
      </div>
      <DismissButton />
    </div>
  )
}
