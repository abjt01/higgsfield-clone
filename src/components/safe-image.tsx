import Image, { type ImageProps } from 'next/image'

/**
 * next/image with a fallback that needs no JavaScript.
 *
 * The first version of this was a client component using onError. That made
 * every tile client-rendered, so the browser could not discover any of them
 * until hydration — with ~40 tiles on the landing wall it pushed mobile LCP
 * from 2.9s to 12.6s and performance from 95 to 53.
 *
 * Instead the fallback is painted *behind* the image as a gradient derived
 * from `seed`. If the file 404s the image simply draws nothing and the
 * gradient shows through, which is the same result with zero client cost and
 * a server-rendered `<img>` the preloader can find.
 *
 * Requires a positioned ancestor, which every caller already has for `fill`.
 */
export function SafeImage({
  seed,
  alt,
  ...props
}: ImageProps & { seed: string }) {
  let h = 0
  for (const ch of seed) h = (h + ch.charCodeAt(0) * 7) % 360

  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, hsl(${h} 28% 24%), hsl(${(h + 40) % 360} 28% 8%))`,
        }}
      />
      <Image {...props} alt={alt} />
    </>
  )
}
