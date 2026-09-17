import { CAMERA_PRESETS } from './cameras'
import { STYLE_PRESETS } from './styles'
import type { Preset, PresetGroup } from './types'

export * from './types'
export { CAMERA_PRESETS, STYLE_PRESETS }

export const ALL_PRESETS: Preset[] = [...CAMERA_PRESETS, ...STYLE_PRESETS]

const BY_ID = new Map(ALL_PRESETS.map((p) => [p.id, p]))

export function getPreset(id: string | null | undefined): Preset | undefined {
  return id ? BY_ID.get(id) : undefined
}

export function familiesFor(group: PresetGroup): string[] {
  const seen = new Set<string>()
  for (const p of ALL_PRESETS) if (p.group === group) seen.add(p.family)
  return [...seen]
}

/**
 * Compose the final prompt sent to the provider.
 *
 * The user's subject leads, then the camera scaffold, then the style scaffold.
 * Order matters: image models weight earlier tokens more heavily, so the
 * subject must not be buried behind preset text.
 */
export function buildPrompt(
  subject: string,
  cameraId?: string | null,
  styleId?: string | null,
): { prompt: string; negative?: string } {
  const camera = getPreset(cameraId)
  const style = getPreset(styleId)

  const parts = [subject.trim()]
  if (camera) parts.push(camera.scaffold)
  if (style) parts.push(style.scaffold)

  const negatives = [camera?.negative, style?.negative].filter(Boolean)

  return {
    prompt: parts.join('. '),
    negative: negatives.length ? negatives.join(', ') : undefined,
  }
}

/** Substring search across label, description, family and keywords. */
export function searchPresets(presets: Preset[], query: string): Preset[] {
  const q = query.trim().toLowerCase()
  if (!q) return presets

  const terms = q.split(/\s+/)
  return presets.filter((p) => {
    const haystack = [p.label, p.description, p.family, ...(p.keywords ?? [])]
      .join(' ')
      .toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

/** Public path of a preset's grid thumbnail. */
export function thumbFor(preset: Preset): string {
  return `/presets/${preset.id}.webp`
}
