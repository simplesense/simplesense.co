export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: '4rem',
        maxWidth: 760,
        margin: '0 auto',
      }}
    >
      <p className="ss-eyebrow">SIMPLE SENSE</p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5rem',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
          margin: 0,
        }}
      >
        The co-pilot that tells your store where to turn next.
      </h1>
      <p style={{ fontSize: '1.125rem', maxWidth: '54ch', color: 'var(--text-body)' }}>
        Not another rear-view mirror — a ranked, grounded list of the next moves to make, with the
        why and the dollar impact. Every number is earned from your store's real data.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <a
          href="/app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--action-primary)',
            color: 'var(--text-onbrand)',
            padding: '0 22px',
            height: 48,
            borderRadius: 'var(--radius-pill)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-inset-glint), var(--shadow-sm)',
            textDecoration: 'none',
          }}
        >
          See this week's moves <i className="bi bi-arrow-right" />
        </a>
        <a
          href="/audit/demo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-strong)',
            padding: '0 22px',
            height: 48,
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-strong)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Free store audit
        </a>
      </div>
    </main>
  )
}
