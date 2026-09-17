import { NextResponse } from 'next/server'

import { ASPECT_RATIOS, type AspectRatio, generateImage } from '@/lib/providers'

export const runtime = 'nodejs'

function isAspectRatio(value: unknown): value is AspectRatio {
  return typeof value === 'string' && (ASPECT_RATIOS as readonly string[]).includes(value)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const { prompt, aspectRatio } = (body ?? {}) as Record<string, unknown>

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'A prompt is required' }, { status: 400 })
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: 'Prompt is too long (max 2000 characters)' }, { status: 400 })
  }

  const ratio: AspectRatio = isAspectRatio(aspectRatio) ? aspectRatio : '1:1'
  const startedAt = Date.now()

  try {
    const image = await generateImage({ prompt: prompt.trim(), aspectRatio: ratio })

    return NextResponse.json(
      {
        // Thin slice: the bytes come straight back as a data URL. Vercel Blob
        // and the generations row land in the next pass.
        dataUrl: `data:${image.mime};base64,${image.bytes.toString('base64')}`,
        provider: image.provider,
        model: image.model,
        mime: image.mime,
        fellBackFrom: image.fellBackFrom,
        ms: Date.now() - startedAt,
      },
      // Never cache a generation response.
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate] all providers failed:', message)
    return NextResponse.json({ error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
