import { gemini } from './gemini'
import { pollinations } from './pollinations'
import { stub } from './stub'
import type { GenerateOpts, GeneratedImage, ImageProvider, ProviderName } from './types'

export * from './types'

/** Order matters: first available provider wins, the rest are fallbacks. */
const CHAIN: ImageProvider[] = [gemini, pollinations]

/** Opt-in only, never reached unless IMAGE_PROVIDER names it. */
const OPT_IN: ImageProvider[] = [stub]

export interface GenerateResult extends GeneratedImage {
  /** Providers that failed before this one succeeded, for honest UI + logs. */
  fellBackFrom: { provider: ProviderName; reason: string }[]
}

/**
 * Try each provider in order until one returns an image.
 *
 * IMAGE_PROVIDER pins a single provider, so the fallback path can be shown on
 * demand in the walkthrough instead of waiting for quota to run out on camera.
 */
export async function generateImage(opts: GenerateOpts): Promise<GenerateResult> {
  const forced = process.env.IMAGE_PROVIDER as ProviderName | undefined
  const chain = forced ? [...CHAIN, ...OPT_IN].filter((p) => p.name === forced) : CHAIN

  if (chain.length === 0) {
    throw new Error(`IMAGE_PROVIDER="${forced}" matches no provider`)
  }

  const fellBackFrom: GenerateResult['fellBackFrom'] = []

  for (const provider of chain) {
    if (!provider.available()) {
      fellBackFrom.push({ provider: provider.name, reason: 'not configured' })
      continue
    }
    try {
      const image = await provider.generate(opts)
      return { ...image, fellBackFrom }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.warn(`[providers] ${provider.name} failed, falling through: ${reason}`)
      fellBackFrom.push({ provider: provider.name, reason })
    }
  }

  throw new Error(
    `every provider failed: ${fellBackFrom.map((f) => `${f.provider} (${f.reason})`).join(', ')}`,
  )
}
