import type { ReactNode } from 'react'

/** Small info banner shown on detail screens when viewing demo data. */
export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <a
      href="/connections"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--ss-info-bg)',
        color: 'var(--text-link)',
        border: '1px solid var(--ss-blue-300)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        fontSize: 13.5,
        marginBottom: 20,
        textDecoration: 'none',
      }}
    >
      <i className="bi bi-info-circle" />
      Demo data — connect your Shopify store to see your own numbers →
    </a>
  )
}

export function PageHeading({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string
  title: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p className="ss-eyebrow" style={{ margin: 0 }}>
          {eyebrow}
        </p>
        <h1
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            letterSpacing: '-0.02em',
            color: 'var(--text-strong)',
          }}
        >
          {title}
        </h1>
        {sub ? (
          <p style={{ margin: '8px 0 0', color: 'var(--text-body)', maxWidth: '64ch' }}>{sub}</p>
        ) : null}
      </div>
      {action ? <div style={{ flex: 'none', marginTop: 4 }}>{action}</div> : null}
    </div>
  )
}

/** A download link styled as a secondary button — used for grounded CSV exports (§19). */
export function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13.5,
        fontWeight: 600,
        color: 'var(--text-strong)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-pill)',
        padding: '9px 16px',
        textDecoration: 'none',
      }}
    >
      <i className="bi bi-download" aria-hidden="true" />
      {label}
    </a>
  )
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}
    >
      {children}
    </div>
  )
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 22,
        marginBottom: 20,
        maxWidth: 720,
      }}
    >
      <h2
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Horizontal labelled bars (e.g. RFM segments). */
export function StatBars({
  rows,
  valueSuffix = '',
}: {
  rows: { label: string; value: number | null; tone?: string }[]
  valueSuffix?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr 56px',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{r.label}</span>
          <div
            style={{
              height: 10,
              background: 'var(--surface-soft)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: 10,
                width: `${Math.round(((r.value ?? 0) / max) * 100)}%`,
                background: r.tone ?? 'var(--action-primary)',
              }}
            />
          </div>
          <span style={{ fontSize: 13, textAlign: 'right', color: 'var(--text-strong)' }}>
            {r.value == null ? '—' : `${r.value.toLocaleString()}${valueSuffix}`}
          </span>
        </div>
      ))}
    </div>
  )
}
