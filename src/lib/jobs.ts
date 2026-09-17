import { and, eq, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { generations, jobs, users } from '@/db/schema'
import { generateImage } from '@/lib/providers'
import type { AspectRatio } from '@/lib/providers'
import { putImage } from '@/lib/storage'

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface JobRow {
  id: string
  generationId: string
  status: string
  error: string | null
  attempts: number
  updatedAt: Date
}

/** A job running longer than this had its worker killed mid-flight. */
const STALE_AFTER_MS = 150_000

/**
 * Mark a job failed if it has been "running" implausibly long.
 *
 * after() runs inside the function's lifetime, so a cold stop, a deploy or a
 * timeout can strand a job in "running" with nothing left to finish it. Without
 * this the client polls until its own timeout and the user sees a spinner with
 * no explanation. Checked on read, so no cron or queue is needed.
 */
export async function reapIfStale(job: JobRow): Promise<JobRow> {
  if (job.status !== 'running') return job
  if (Date.now() - job.updatedAt.getTime() < STALE_AFTER_MS) return job

  const db = getDb()
  const [reaped] = await db
    .update(jobs)
    .set({
      status: 'failed',
      error: 'The worker stopped before finishing. Try generating again.',
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, job.id), eq(jobs.status, 'running')))
    .returning()

  if (reaped) await refundCredit(job.generationId)

  return reaped ?? job
}

async function refundCredit(generationId: string): Promise<void> {
  const db = getDb()
  const [generation] = await db
    .select({ userId: generations.userId })
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1)

  if (!generation) return

  await db
    .update(users)
    .set({ credits: sql`${users.credits} + 1` })
    .where(eq(users.id, generation.userId))
}

/**
 * Run one generation job to completion.
 *
 * Called from after() so it executes once the POST response has been sent: the
 * client gets an id immediately and polls, rather than holding a request open
 * for the length of a generation.
 */
export async function processJob(jobId: string): Promise<void> {
  const db = getDb()

  // Claim the job atomically. Reading the status and then updating it let two
  // invocations both see "queued" and generate the same image twice, burning
  // two units of a rate-limited free tier for one result.
  const [claimed] = await db
    .update(jobs)
    .set({ status: 'running', attempts: sql`${jobs.attempts} + 1`, updatedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, 'queued')))
    .returning()

  if (!claimed) return

  const [generation] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, claimed.generationId))
    .limit(1)

  if (!generation) {
    await db
      .update(jobs)
      .set({ status: 'failed', error: 'Generation row missing', updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
    return
  }

  try {
    const image = await generateImage({
      prompt: generation.prompt,
      aspectRatio: generation.aspectRatio as AspectRatio,
    })

    const url = await putImage(image.bytes, image.mime, generation.id)

    await db
      .update(generations)
      .set({ imageUrl: url, mime: image.mime, provider: image.provider, model: image.model })
      .where(eq(generations.id, generation.id))

    await db
      .update(jobs)
      .set({ status: 'succeeded', error: null, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[jobs] ${jobId} failed:`, message)

    await db
      .update(jobs)
      .set({ status: 'failed', error: message.slice(0, 500), updatedAt: new Date() })
      .where(eq(jobs.id, jobId))

    // A failed generation must not cost the user a credit.
    await refundCredit(generation.id)
  }
}
