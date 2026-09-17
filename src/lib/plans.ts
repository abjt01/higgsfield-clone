export interface Plan {
  id: string
  name: string
  blurb: string
  monthly: number
  /** Per month when billed annually. */
  annual: number
  credits: number
  highlight?: boolean
  badge?: string
  features: { label: string; included: boolean }[]
}

/**
 * Plans are presentational. Billing is explicitly out of scope, so nothing here
 * takes payment — the pricing page states that rather than implying a checkout
 * that does not exist.
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    blurb: 'What every visitor gets, without signing up.',
    monthly: 0,
    annual: 0,
    credits: 50,
    features: [
      { label: '50 credits on arrival', included: true },
      { label: 'All 44 camera moves and 37 styles', included: true },
      { label: 'Camera-move clips, watermark free', included: true },
      { label: 'Community feed and remix', included: true },
      { label: 'Private generations', included: false },
      { label: 'Priority queue', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For consistent, everyday creation.',
    monthly: 24,
    annual: 19,
    credits: 900,
    highlight: true,
    badge: 'Most popular',
    features: [
      { label: '900 credits per month', included: true },
      { label: 'All 44 camera moves and 37 styles', included: true },
      { label: 'Camera-move clips, watermark free', included: true },
      { label: 'Community feed and remix', included: true },
      { label: 'Private generations', included: true },
      { label: 'Priority queue', included: true },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    blurb: 'Highest volume and the lowest cost per credit.',
    monthly: 79,
    annual: 63,
    credits: 4000,
    badge: 'Best value',
    features: [
      { label: '4,000 credits per month', included: true },
      { label: 'All 44 camera moves and 37 styles', included: true },
      { label: 'Camera-move clips, watermark free', included: true },
      { label: 'Community feed and remix', included: true },
      { label: 'Private generations', included: true },
      { label: 'Priority queue', included: true },
    ],
  },
]

export const CREDIT_COST = [
  { label: 'Image generation', credits: 1 },
  { label: 'Camera-move clip', credits: 0, note: 'Rendered in your browser, so it costs nothing' },
  { label: 'Remix', credits: 1, note: 'Same as any generation' },
  { label: 'Failed generation', credits: 0, note: 'Refunded automatically' },
]
