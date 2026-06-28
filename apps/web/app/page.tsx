import { roundTo } from '@ss/core'

export default function HomePage() {
  // Trivial use of @ss/core to prove the workspace wiring end to end.
  const share = roundTo(0.7012, 2)

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '4rem',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <p className="ss-eyebrow">SIMPLE SENSE</p>
      <h1
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '3rem',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
          margin: 0,
        }}
      >
        The co-pilot that tells your store where to turn next.
      </h1>
      <p style={{ fontSize: '1.125rem', maxWidth: '52ch' }}>
        Not another rear-view mirror — a ranked, grounded list of the next moves to make, with the
        why and the dollar impact. (Scaffold online; share util check: {share})
      </p>
      <p style={{ color: 'var(--text-body)' }}>
        <a href="/api/health" style={{ color: 'var(--action-primary)' }}>
          /api/health
        </a>
      </p>
    </main>
  )
}
