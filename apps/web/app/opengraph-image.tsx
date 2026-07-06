import { ImageResponse } from 'next/og'

export const alt = 'Simple Sense — the prescriptive operator brain for e-commerce'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Branded default social card (cream / signal-blue / clay) — code-generated, no binary asset. */
export default function OpengraphImage() {
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
        <div style={{ fontSize: 66, lineHeight: 1.05, color: '#211c15' }}>
          Stop drowning in data.
        </div>
        <div style={{ fontSize: 66, lineHeight: 1.05, color: '#c1603a', marginBottom: 8 }}>
          Start executing.
        </div>
        <div style={{ fontSize: 30, color: '#6d6455', maxWidth: 880 }}>
          The few moves to make this week — what to do, why, and the dollar impact. Every number
          earned from your own store.
        </div>
      </div>
      <div style={{ fontSize: 24, color: '#837a68' }}>simplesense.co</div>
    </div>,
    size,
  )
}
