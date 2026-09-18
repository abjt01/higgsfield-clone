'use client'

import { ANNOUNCEMENT_KEY } from './announcement-bar'

export function DismissButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          localStorage.setItem(ANNOUNCEMENT_KEY, '1')
        } catch {
          /* private mode: it just will not be remembered */
        }
        document.documentElement.classList.add('hf-ann-hidden')
      }}
      aria-label="Dismiss announcement"
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-black/70 transition hover:text-black"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </svg>
    </button>
  )
}
