'use client'

import Image from 'next/image'
import { memo, useDeferredValue, useMemo, useState } from 'react'

import { filterClientPresets, type ClientPreset } from '@/lib/presets/client'

interface Props {
  presets: ClientPreset[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Copy for the "no preset" tile. */
  noneLabel: string
}

/**
 * One tile. Memoised because the grid renders 40+ of them and the parent
 * re-renders on every search keystroke.
 */
const Tile = memo(function Tile({
  preset,
  selected,
  onSelect,
}: {
  preset: ClientPreset
  selected: boolean
  onSelect: (id: string) => void
}) {
  const [broken, setBroken] = useState(false)

  // A thumbnail that fails to load must not leave a dead tile. Losing 69 of
  // them to a stray `git add -A` was invisible until the grid was looked at,
  // so the fallback is a deterministic gradient keyed off the id rather than
  // an empty box.
  const hue = useMemo(
    () => [...preset.id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360,
    [preset.id],
  )

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      aria-pressed={selected}
      title={preset.description}
      className={`group relative overflow-hidden rounded-[var(--radius-card)] border text-left transition ${
        selected
          ? 'border-accent ring-2 ring-accent/60'
          : 'border-line hover:border-muted/60'
      }`}
    >
      <div
        className="relative aspect-square bg-surface-2"
        style={
          broken
            ? { background: `linear-gradient(145deg, hsl(${hue} 30% 26%), hsl(${(hue + 40) % 360} 30% 8%))` }
            : undefined
        }
      >
        {!broken && (
          <Image
            src={preset.thumb}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, 150px"
            onError={() => setBroken(true)}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
          <p className="truncate text-[11px] font-medium leading-tight">{preset.label}</p>
          <p className="truncate text-[10px] leading-tight text-muted">{preset.family}</p>
        </div>
      </div>
    </button>
  )
})

export function PresetPicker({ presets, selectedId, onSelect, noneLabel }: Props) {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<string | null>(null)

  // Keeps typing responsive: the input updates immediately, the 81-tile grid
  // re-filters at a lower priority instead of blocking each keystroke.
  const deferredQuery = useDeferredValue(query)

  const families = useMemo(() => {
    const seen: string[] = []
    for (const p of presets) if (!seen.includes(p.family)) seen.push(p.family)
    return seen
  }, [presets])

  const visible = useMemo(() => {
    const byFamily = family ? presets.filter((p) => p.family === family) : presets
    return filterClientPresets(byFamily, deferredQuery)
  }, [presets, family, deferredQuery])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-3 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${presets.length} presets…`}
          aria-label="Search presets"
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent/60"
        />

        <div className="flex flex-wrap gap-1.5">
          <Chip active={family === null} onClick={() => setFamily(null)}>
            All
          </Chip>
          {families.map((f) => (
            <Chip key={f} active={family === f} onClick={() => setFamily(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={selectedId === null}
            className={`flex aspect-square items-center justify-center rounded-[var(--radius-card)] border text-center text-[11px] leading-tight transition ${
              selectedId === null
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:border-muted/60'
            }`}
          >
            {noneLabel}
          </button>

          {visible.map((p) => (
            <Tile key={p.id} preset={p} selected={p.id === selectedId} onSelect={onSelect} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Nothing matches “{deferredQuery}”.
          </p>
        )}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
        active
          ? 'border-accent bg-accent text-black'
          : 'border-line text-muted hover:border-muted/60 hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}
