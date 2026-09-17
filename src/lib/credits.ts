/**
 * Credit balance changes in a route handler, but it is displayed in the nav,
 * which is a sibling of the page that spent it. Rather than lifting state
 * through the tree or refetching the whole route, the composer announces the
 * new balance and the badge listens.
 */
export const CREDITS_EVENT = 'hf:credits'

export function announceCredits(credits: number): void {
  window.dispatchEvent(new CustomEvent<number>(CREDITS_EVENT, { detail: credits }))
}

export function onCredits(handler: (credits: number) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<number>).detail)
  window.addEventListener(CREDITS_EVENT, listener)
  return () => window.removeEventListener(CREDITS_EVENT, listener)
}
