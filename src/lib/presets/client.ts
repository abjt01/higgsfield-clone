import { ALL_PRESETS } from './index'
import type { Preset, PresetGroup } from './types'

/**
 * The shape the browser gets.
 *
 * Scaffolds are deliberately omitted: they are the largest field, they are only
 * ever applied server-side, and shipping 81 of them would bloat the client
 * bundle for no gain.
 */
export interface ClientPreset {
  id: string
  label: string
  group: PresetGroup
  family: string
  description: string
  keywords: string[]
  thumb: string
}

function toClient(p: Preset): ClientPreset {
  return {
    id: p.id,
    label: p.label,
    group: p.group,
    family: p.family,
    description: p.description,
    keywords: p.keywords ?? [],
    thumb: `/presets/${p.id}.webp`,
  }
}

export function clientPresets(): ClientPreset[] {
  return ALL_PRESETS.map(toClient)
}

/** Same matching rules as the server-side search, on the slim shape. */
export function filterClientPresets(presets: ClientPreset[], query: string): ClientPreset[] {
  const q = query.trim().toLowerCase()
  if (!q) return presets

  const terms = q.split(/\s+/)
  return presets.filter((p) => {
    const haystack = [p.label, p.description, p.family, ...p.keywords].join(' ').toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}
