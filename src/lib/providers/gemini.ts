import { GoogleGenAI } from '@google/genai'

import {
  type GenerateOpts,
  type GeneratedImage,
  type ImageProvider,
  ProviderError,
} from './types'

const MODEL = 'gemini-2.5-flash-image'

/**
 * Google AI Studio, gemini-2.5-flash-image ("nano banana"). Free tier, no card.
 *
 * Note: outputMimeType/outputCompressionQuality exist on ImageConfig but are
 * Vertex-only and are NOT supported by the Gemini API, so output is PNG and we
 * do not ask for JPEG here. Transcoding belongs at the Blob-write step.
 */
export const gemini: ImageProvider = {
  name: 'gemini',
  model: MODEL,

  available() {
    return Boolean(process.env.GEMINI_API_KEY)
  },

  async generate({ prompt, aspectRatio }: GenerateOpts): Promise<GeneratedImage> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new ProviderError('gemini', 'GEMINI_API_KEY is not set')

    const ai = new GoogleGenAI({ apiKey })

    let res
    try {
      res = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseModalities: ['IMAGE'],
          // 2K because the camera-move renderer crops into the still: at 1K a
          // 1.95x crash zoom resamples the source and the clip comes out soft.
          imageConfig: { aspectRatio, imageSize: '2K' },
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // 429 RESOURCE_EXHAUSTED is the daily free-tier quota. Everything else
      // (network, 5xx, timeout) is equally worth falling through on.
      throw new ProviderError('gemini', message)
    }

    for (const part of res.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData
      if (inline?.data) {
        return {
          bytes: Buffer.from(inline.data, 'base64'),
          mime: inline.mimeType ?? 'image/png',
          provider: 'gemini',
          model: MODEL,
        }
      }
    }

    // No image part: almost always a safety refusal. Falling through to the
    // secondary provider is the right call for a live demo.
    throw new ProviderError('gemini', 'no image in response (likely a safety refusal)')
  },
}
