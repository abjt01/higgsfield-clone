'use client'

import Image, { type ImageProps } from 'next/image'
import { useMemo, useState } from 'react'

/**
 * next/image that degrades instead of leaving a dead box.
 *
 * A missing upstream file makes the image optimiser return 400, which renders
 * as an empty rectangle and logs a console error. Generated images can vanish
 * (a purged blob, an expired URL, a file that never got committed), so the
 * fallback is a deterministic gradient keyed off `seed` rather than nothing.
 */
export function SafeImage({
  seed,
  alt,
  ...props
}: ImageProps & { seed: string }) {
  const [broken, setBroken] = useState(false)

  const hue = useMemo(
    () => [...seed].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360,
    [seed],
  )

  if (broken) {
    return (
      <span
        aria-hidden
        className="absolute inset-0 block"
        style={{
          background: `linear-gradient(145deg, hsl(${hue} 28% 24%), hsl(${(hue + 40) % 360} 28% 8%))`,
        }}
      />
    )
  }

  return <Image {...props} alt={alt} onError={() => setBroken(true)} />
}
