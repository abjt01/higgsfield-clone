import { eq, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { generations, jobs, users } from '@/db/schema'
import { generateImage } from '@/lib/providers'
import type { AspectRatio } from '@/lib/providers'
import { putImage } from '@/lib/storage'

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/**
 * Run one generation job to completion.
 *
 * Called from `after()` so it executes once the POST response has already been
 * sent: the client gets an id immediately and polls, rather than holding a
 * request open for the length of a generation.
 */
export async function processJob(jobId: string): Promise<void> {
  const db = getDb()

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1)
  if (!job || job.status !== 'queued') return

  const [generation] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, job.generationId))
    .limit(1)
  if (!generation) return

  await db
    .update(jobs)
    .set({ status: 'running', attempts: job.attempts + 1, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))

  try {
    const image = await generateImage({
      prompt: generation.prompt,
      aspectRatio: generation.aspectRatio as AspectRatio,
    })

    const url = await putImage(image.bytes, image.mime, generation.id)

    await db
      .update(generations)
      .set({
        imageUrl: url,
        mime: image.mime,
        provider: image.provider,
        model: image.model,
      })
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
      .set({ status: 'failed', error: message, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))

    // A failed generation must not cost the user a credit.
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + 1` })
      .where(eq(users.id, generation.userId))
  }
}
