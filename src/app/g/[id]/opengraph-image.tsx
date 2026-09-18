import { ImageResponse } from 'next/og'

import { getShareable } from '@/lib/feed'
import { safeQuery } from '@/lib/safe-db'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Generation'

/**
 * Per-generation share card.
 *
 * Renders the image itself with the prompt and presets over it. A data-URL
 * image (the dev fallback when Blob is not configured) is skipped rather than
 * embedded: it would blow past what the OG renderer will accept and produce a
 * broken card instead of a plain one.
 */
export default async function Image({ params }: { params: { id: string } }) {
  const card = /^[0-9a-f-]{36}$/i.test(params.id)
    ? await safeQuery('og lookup', () => getShareable(params.id))
    : null

  const usable = card?.imageUrl && !card.imageUrl.startsWith('data:') ? card.imageUrl : null
  const subject = card?.subject ?? 'Higgsfield clone'
  const tags = [card?.camera?.label, card?.style?.label].filter(Boolean).join('  ·  ')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#000',
          color: '#f5f5f5',
          fontFamily: 'sans-serif',
        }}
      >
        {usable && (
           
          <img
            src={usable}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 20%, rgba(0,0,0,0.25) 70%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 64,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', fontSize: 22, color: '#d7fc51', letterSpacing: 2 }}>
            HIGGSFIELD.CLONE
          </div>
          <div style={{ display: 'flex', fontSize: 52, lineHeight: 1.15, marginTop: 18 }}>
            {subject.slice(0, 110)}
          </div>
          {tags && (
            <div style={{ display: 'flex', fontSize: 26, color: '#8b8b8b', marginTop: 20 }}>
              {tags}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}
