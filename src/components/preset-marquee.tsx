import Image from 'next/image'

import type { ClientPreset } from '@/lib/presets/client'

/**
 * Two rows of preset tiles drifting in opposite directions.
 *
 * CSS-animated and duplicated inline rather than JS-driven: it is decorative,
 * so it should cost no main-thread work and should stop dead under
 * prefers-reduced-motion, which globals.css already enforces.
 */
export function PresetMarquee({ presets }: { presets: ClientPreset[] }) {
  const half = Math.ceil(presets.length / 2)
  const rows = [presets.slice(0, half), presets.slice(half)]

  return (
    <div className="relative space-y-3 overflow-hidden py-1">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-3" style={{ width: 'max-content' }}>
          {[...row, ...row].map((p, j) => (
            <figure
              key={`${p.id}-${j}`}
              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line sm:h-32 sm:w-32"
              style={{
                animation: `${i === 0 ? 'hf-drift-left' : 'hf-drift-right'} ${row.length * 3.5}s linear infinite`,
              }}
            >
              <Image
                src={p.thumb}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1.5 pt-5 text-[9px] leading-tight">
                {p.label}
              </figcaption>
            </figure>
          ))}
        </div>
      ))}

      {/* Feather the edges so tiles enter and leave instead of popping. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
    </div>
  )
}
