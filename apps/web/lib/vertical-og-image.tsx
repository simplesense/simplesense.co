import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/** Same branded template as the root OG image (opengraph-image.tsx) — one shared
 *  builder, per-vertical headline text, per addendum §4 "template + niche headline". */
export function buildVerticalOgImage(eyebrow: string, headline: string) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#fffdf9',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: '#0871e7',
            color: '#fffdf9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, color: '#211c15' }}>Simple Sense</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{ fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: '#c25a3c' }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 58, lineHeight: 1.08, color: '#211c15', maxWidth: 980 }}>
          {headline}
        </div>
      </div>
      <div style={{ fontSize: 24, color: '#837a68' }}>simplesense.co</div>
    </div>,
    OG_SIZE,
  )
}
