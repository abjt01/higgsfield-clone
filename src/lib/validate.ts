import { HttpError } from './http'

// Deliberately shape-only, not version/variant-checked: the job is to stop
// malformed input reaching Postgres (which raises and surfaces as a 500), not
// to reject uuids Postgres would happily accept. A well-formed id that does not
// exist must 404, not 400.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Postgres raises on a malformed uuid, which surfaces as a 500. Reject first. */
export function uuid(value: string, field = 'id'): string {
  if (!UUID_RE.test(value)) throw new HttpError(`Invalid ${field}`, 400)
  return value
}

export function optionalString(value: unknown, field: string, max = 200): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new HttpError(`${field} must be a string`, 400)
  if (value.length > max) throw new HttpError(`${field} is too long`, 400)
  return value
}

export function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(`${field} is required`, 400)
  if (value.length > max) throw new HttpError(`${field} is too long (max ${max} characters)`, 400)
  return value.trim()
}

/** Clamped and NaN-safe: Number('abc') previously reached the query as NaN. */
export function boundedInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new HttpError('limit must be a number', 400)
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/** An unparseable cursor produced Invalid Date and a 500 from Postgres. */
export function cursorDate(raw: string | null): Date | undefined {
  if (!raw) return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) throw new HttpError('Invalid cursor', 400)
  return d
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    throw new HttpError('Body must be JSON', 400)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError('Body must be a JSON object', 400)
  }
  return parsed as Record<string, unknown>
}
