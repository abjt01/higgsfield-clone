export const ASPECT_RATIOS = [
  '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9',
] as const

export type AspectRatio = (typeof ASPECT_RATIOS)[number]

export type ProviderName = 'gemini' | 'pollinations' | 'stub'

export interface GenerateOpts {
  prompt: string
  aspectRatio: AspectRatio
  seed?: number
}

export interface GeneratedImage {
  bytes: Buffer
  mime: string
  provider: ProviderName
  model: string
}

export interface ImageProvider {
  name: ProviderName
  model: string
  /** False when the provider is missing config, so the pipeline can skip it. */
  available(): boolean
  generate(opts: GenerateOpts): Promise<GeneratedImage>
}

/** Thrown when a provider fails in a way the pipeline should fall through on. */
export class ProviderError extends Error {
  constructor(
    readonly provider: ProviderName,
    message: string,
    readonly retryable = true,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

/** Pixel dimensions per ratio, for providers that take width/height not a ratio. */
export const RATIO_DIMENSIONS: Record<AspectRatio, [number, number]> = {
  '1:1': [1024, 1024],
  '2:3': [832, 1248],
  '3:2': [1248, 832],
  '3:4': [880, 1176],
  '4:3': [1176, 880],
  '4:5': [912, 1144],
  '5:4': [1144, 912],
  '9:16': [768, 1360],
  '16:9': [1360, 768],
  '21:9': [1584, 672],
}
