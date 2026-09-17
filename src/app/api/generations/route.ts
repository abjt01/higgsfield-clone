import { desc, eq, sql } from 'drizzle-orm'
import { after, NextResponse } from 'next/server'

import { getDb } from '@/db'
import { generations, jobs, users } from '@/db/schema'
import { processJob } from '@/lib/jobs'
import { buildPrompt, getPreset } from '@/lib/presets'
import { ASPECT_RATIOS, type AspectRatio } from '@/lib/providers'
import { getOrCreateUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

function isAspectRatio(v: unknown): v is AspectRatio {
  return typeof v === 'string' && (ASPECT_RATIOS as readonly string[]).includes(v)
}

/** Create a generation and queue its job. Returns immediately; the client polls. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400, headers: NO_STORE })
  }

  const { prompt, aspectRatio, cameraId, styleId } = (body ?? {}) as Record<string, unknown>

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'A prompt is required' }, { status: 400, headers: NO_STORE })
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: 'Prompt is too long (max 2000 characters)' }, { status: 400, headers: NO_STORE })
  }

  const camera = typeof cameraId === 'string' ? getPreset(cameraId) : undefined
  const style = typeof styleId === 'string' ? getPreset(styleId) : undefined
  if (typeof cameraId === 'string' && cameraId && !camera) {
    return NextResponse.json({ error: `Unknown camera preset: ${cameraId}` }, { status: 400, headers: NO_STORE })
  }
  if (typeof styleId === 'string' && styleId && !style) {
    return NextResponse.json({ error: `Unknown style preset: ${styleId}` }, { status: 400, headers: NO_STORE })
  }

  const ratio: AspectRatio = isAspectRatio(aspectRatio) ? aspectRatio : '1:1'
  const db = getDb()
  const user = await getOrCreateUser()

  if (user.credits <= 0) {
    return NextResponse.json({ error: 'Out of credits' }, { status: 402, headers: NO_STORE })
  }

  // The composed prompt is stored, not the raw subject: it is what was actually
  // sent to the provider, and remix needs the preset ids to rebuild the composer.
  const composed = buildPrompt(prompt, camera?.id, style?.id)

  const [generation] = await db
    .insert(generations)
    .values({
      userId: user.id,
      prompt: composed.prompt,
      subject: prompt.trim(),
      cameraPresetId: camera?.id ?? null,
      presetId: style?.id ?? null,
      aspectRatio: ratio,
      provider: 'pending',
      model: 'pending',
    })
    .returning()

  const [job] = await db.insert(jobs).values({ generationId: generation.id }).returning()

  await db
    .update(users)
    .set({ credits: sql`${users.credits} - 1` })
    .where(eq(users.id, user.id))

  // Runs after the response is flushed.
  after(() => processJob(job.id))

  return NextResponse.json(
    { id: generation.id, jobId: job.id, status: 'queued', creditsLeft: user.credits - 1 },
    { status: 202, headers: NO_STORE },
  )
}

/** The signed-in user's generations, newest first. Keyset paginated. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 24), 50)

  const db = getDb()
  const user = await getOrCreateUser()

  const rows = await db
    .select()
    .from(generations)
    .where(
      cursor
        ? sql`${generations.userId} = ${user.id} and ${generations.createdAt} < ${new Date(cursor)}`
        : eq(generations.userId, user.id),
    )
    .orderBy(desc(generations.createdAt))
    .limit(limit)

  return NextResponse.json(
    {
      items: rows,
      nextCursor: rows.length === limit ? rows[rows.length - 1].createdAt.toISOString() : null,
    },
    { headers: NO_STORE },
  )
}
