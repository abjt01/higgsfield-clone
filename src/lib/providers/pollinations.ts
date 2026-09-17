import {
  type GenerateOpts,
  type GeneratedImage,
  type ImageProvider,
  ProviderError,
  RATIO_DIMENSIONS,
} from './types'

const MODEL = 'flux'
const TIMEOUT_MS = 45_000

/**
 * Pollinations. No API key, no account, no quota to exhaust.
 *
 * This exists so the deployed link cannot go dead while someone is clicking it.
 */
export const pollinations: ImageProvider = {
  name: 'pollinations',
  model: MODEL,

  available() {
    return true
  },

  async generate({ prompt, aspectRatio, seed }: GenerateOpts): Promise<GeneratedImage> {
    const [width, height] = RATIO_DIMENSIONS[aspectRatio]

    const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`)
    url.searchParams.set('width', String(width))
    url.searchParams.set('height', String(height))
    url.searchParams.set('model', MODEL)
    url.searchParams.set('nologo', 'true')
    if (seed !== undefined) url.searchParams.set('seed', String(seed))

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) }).catch((err) => {
      throw new ProviderError('pollinations', err instanceof Error ? err.message : String(err))
    })

    if (!res.ok) {
      throw new ProviderError('pollinations', `HTTP ${res.status}`)
    }

    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.byteLength === 0) {
      throw new ProviderError('pollinations', 'empty response body')
    }

    return {
      bytes,
      mime: res.headers.get('content-type') ?? 'image/jpeg',
      provider: 'pollinations',
      model: MODEL,
    }
  },
}
