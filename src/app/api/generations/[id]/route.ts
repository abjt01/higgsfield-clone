import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { getDb } from '@/db'
import { generations, jobs } from '@/db/schema'

export const runtime = 'nodejs'
// A cached poll response means the client sees "queued" forever and the
// generation appears to hang. This is the single most demo-killing bug in the
// app, so the route is explicitly dynamic and explicitly no-store.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()

  // One join, not a generation query followed by a job query per row.
  const [row] = await db
    .select({ generation: generations, job: jobs })
    .from(generations)
    .innerJoin(jobs, eq(jobs.generationId, generations.id))
    .where(eq(generations.id, id))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json(
    {
      id: row.generation.id,
      status: row.job.status,
      error: row.job.error,
      attempts: row.job.attempts,
      subject: row.generation.subject,
      prompt: row.generation.prompt,
      cameraPresetId: row.generation.cameraPresetId,
      presetId: row.generation.presetId,
      aspectRatio: row.generation.aspectRatio,
      imageUrl: row.generation.imageUrl,
      provider: row.generation.provider,
      model: row.generation.model,
      createdAt: row.generation.createdAt,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
