import type { Motion } from '@/lib/presets/types'

export type EasingName = Motion['easing']

/**
 * Easing curves. These carry most of the perceived quality: a crash zoom that
 * moves linearly reads as a slideshow pan, the same move on easeInExpo reads as
 * a camera being thrown at the subject.
 */
export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  // Near-stationary hang, then a violent snap. This is the crash zoom curve.
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  // Immediate launch that decays: a whip that runs out of energy.
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Smooth deterministic displacement for handheld moves.
 *
 * Summed sinusoids at incommensurate frequencies, not Math.random: white noise
 * per frame looks like video interference, whereas this reads as a human
 * failing to hold a camera still. Deterministic also means a re-record of the
 * same clip is identical.
 */
export function shakeOffset(t: number, amount: number): [number, number] {
  if (!amount) return [0, 0]
  const x =
    Math.sin(t * 11.3) * 0.6 + Math.sin(t * 27.7 + 1.3) * 0.3 + Math.sin(t * 43.1 + 2.1) * 0.1
  const y =
    Math.cos(t * 9.7 + 0.5) * 0.6 + Math.cos(t * 31.3 + 2.7) * 0.3 + Math.cos(t * 47.9) * 0.1
  return [x * amount, y * amount]
}
