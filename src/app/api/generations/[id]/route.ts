import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { generations, jobs } from '@/db/schema'
import { json, route } from '@/lib/http'
import { reapIfStale } from '@/lib/jobs'
import { readUser } from '@/lib/session'
import { uuid } from '@/lib/validate'

export const runtime = 'nodejs'
// A cached poll response means the client sees "queued" forever and the
// generation appears to hang. The most demo-killing bug in the app.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const GET = route(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params
  uuid(id, 'generation id')

  const db = getDb()

  // One join, not a generation query followed by a job query.
  const [row] = await db
    .select({ generation: generations, job: jobs })
    .from(generations)
    .innerJoin(jobs, eq(jobs.generationId, generations.id))
    .where(eq(generations.id, id))
    .limit(1)

  if (!row) return json({ error: 'Not found' }, 404)

  // Private generations are only visible to their owner; public ones are open
  // so the community feed and share pages work without auth.
  if (row.generation.visibility !== 'public') {
    const user = await readUser()
    if (!user || user.id !== row.generation.userId) return json({ error: 'Not found' }, 404)
  }

  // A job whose worker died would otherwise sit in "running" forever and the
  // client would poll until its own timeout with no explanation.
  const job = await reapIfStale(row.job)

  return json({
    id: row.generation.id,
    status: job.status,
    error: job.error,
    attempts: job.attempts,
    subject: row.generation.subject,
    prompt: row.generation.prompt,
    cameraPresetId: row.generation.cameraPresetId,
    presetId: row.generation.presetId,
    aspectRatio: row.generation.aspectRatio,
    imageUrl: row.generation.imageUrl,
    provider: row.generation.provider,
    model: row.generation.model,
    visibility: row.generation.visibility,
    createdAt: row.generation.createdAt,
  })
})
