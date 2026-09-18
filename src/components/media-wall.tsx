import { SafeImage } from './safe-image'

export interface WallTile {
  src: string
  label: string
  /** Column span, used to break the grid out of a uniform checkerboard. */
  wide?: boolean
  tall?: boolean
}

/**
 * Dense mixed-aspect media grid.
 *
 * The reference leans on these heavily: tight gaps, no borders, no captions on
 * the tiles, varied aspect ratios so the wall does not read as a uniform
 * checkerboard. Tiles are decorative, so they carry empty alt text and the
 * label is only a tooltip.
 */
export function MediaWall({
  tiles,
  columns = 5,
  className = '',
}: {
  tiles: WallTile[]
  columns?: 4 | 5
  className?: string
}) {
  return (
    <div
      className={`grid auto-rows-[92px] gap-2 sm:auto-rows-[118px] ${
        columns === 5 ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'
      } ${className}`}
    >
      {tiles.map((t, i) => (
        <div
          key={`${t.src}-${i}`}
          title={t.label}
          className={`relative overflow-hidden rounded-[var(--radius-tile)] bg-surface-2 ${
            t.wide ? 'col-span-2' : ''
          } ${t.tall ? 'row-span-2' : ''}`}
        >
          {/* SafeImage, not Image: wall tiles include generated images, which
              can 404 if a blob is purged, and a dead rectangle in a dense grid
              is very visible. */}
          <SafeImage
            seed={t.src}
            src={t.src}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            unoptimized={t.src.startsWith('data:')}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}
