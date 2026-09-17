import { and, desc, eq, lt, sql } from 'drizzle-orm'
import { after } from 'next/server'

import { getDb } from '@/db'
import { generations, jobs, users } from '@/db/schema'
import { HttpError, json, route } from '@/lib/http'
import { processJob } from '@/lib/jobs'
import { buildPrompt, getPreset } from '@/lib/presets'
import { ASPECT_RATIOS, type AspectRatio } from '@/lib/providers'
import { checkIpRate, checkUserRate, clientIp } from '@/lib/rate-limit'
import { getOrCreateUser, readUser } from '@/lib/session'
import { boundedInt, cursorDate, jsonBody, optionalString, requiredText } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// after() keeps running past the response, but only within the function's
// budget. The default would kill a generation mid-flight and strand the job.
export const maxDuration = 60

const MAX_PROMPT = 2000

function presetOr400(value: unknown, field: string, group: 'camera' | 'style') {
  const id = optionalString(value, field, 80)
  if (!id) return undefined

  const preset = getPreset(id)
  if (!preset || preset.group !== group) throw new HttpError(`Unknown ${group} preset: ${id}`, 400)
  return preset
}

/** Create a generation and queue its job. Returns immediately; the client polls. */
export const POST = route(async (request: Request) => {
  checkIpRate(clientIp(request))

  const body = await jsonBody(request)
  const subject = requiredText(body.prompt, 'Prompt', MAX_PROMPT)
  const camera = presetOr400(body.cameraId, 'cameraId', 'camera')
  const style = presetOr400(body.styleId, 'styleId', 'style')

  const requested = optionalString(body.aspectRatio, 'aspectRatio', 10)
  if (requested && !(ASPECT_RATIOS as readonly string[]).includes(requested)) {
    throw new HttpError(`Unsupported aspect ratio: ${requested}`, 400)
  }
  const ratio = (requested ?? '1:1') as AspectRatio

  // Public by default: this is a community gallery and an empty feed is a dead
  // demo. Opt-out is explicit in the composer rather than buried.
  const visibilityRaw = optionalString(body.visibility, 'visibility', 10)
  if (visibilityRaw && visibilityRaw !== 'public' && visibilityRaw !== 'private') {
    throw new HttpError('visibility must be "public" or "private"', 400)
  }
  const visibility = visibilityRaw ?? 'public'

  const db = getDb()
  const user = await getOrCreateUser()
  await checkUserRate(user.id)

  if (user.credits <= 0) throw new HttpError('Out of credits', 402)

  const composed = buildPrompt(subject, camera?.id, style?.id)

  const [generation] = await db
    .insert(generations)
    .values({
      userId: user.id,
      prompt: composed.prompt,
      subject,
      cameraPresetId: camera?.id ?? null,
      presetId: style?.id ?? null,
      aspectRatio: ratio,
      visibility,
      provider: 'pending',
      model: 'pending',
    })
    .returning()

  const [job] = await db.insert(jobs).values({ generationId: generation.id }).returning()

  // Guarded so concurrent requests cannot drive a balance negative.
  const [charged] = await db
    .update(users)
    .set({ credits: sql`${users.credits} - 1` })
    .where(and(eq(users.id, user.id), sql`${users.credits} > 0`))
    // No projection: the Neon/node-postgres union drops the typed overload.
    .returning()

  if (!charged) throw new HttpError('Out of credits', 402)

  after(() => processJob(job.id))

  return json({ id: generation.id, jobId: job.id, status: 'queued', creditsLeft: charged.credits }, 202)
})

/** The current user's generations, newest first, keyset paginated. */
export const GET = route(async (request: Request) => {
  // Read-only: a GET must not mint a user. It previously created a row and a
  // session on every anonymous request.
  const user = await readUser()
  if (!user) return json({ items: [], nextCursor: null })

  const url = new URL(request.url)
  const limit = boundedInt(url.searchParams.get('limit'), 24, 1, 50)
  const cursor = cursorDate(url.searchParams.get('cursor'))

  const db = getDb()
  const rows = await db
    .select()
    .from(generations)
    .where(
      cursor
        ? and(eq(generations.userId, user.id), lt(generations.createdAt, cursor))
        : eq(generations.userId, user.id),
    )
    .orderBy(desc(generations.createdAt))
    .limit(limit)

  return json({
    items: rows,
    nextCursor: rows.length === limit ? rows[rows.length - 1].createdAt.toISOString() : null,
  })
})
