import type { CSSProperties } from 'react'
import { Badge, type BadgeTone } from './Badge'

export interface MetricCardProps {
  label: string
  value: string | number
  delta?: string
  deltaTone?: BadgeTone
  /** Bootstrap Icon name (without `bi-`). */
  icon?: string
  style?: CSSProperties
}

/** Dashboard metric tile — label, large value, optional delta badge & icon. */
export function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  icon,
  style,
}: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon ? (
            <i
              className={`bi bi-${icon}`}
              aria-hidden="true"
              style={{ color: 'var(--ss-blue-500)', fontSize: 15 }}
            />
          ) : null}
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            {label}
          </p>
        </div>
        <strong
          style={{
            display: 'block',
            marginTop: 8,
            fontSize: 30,
            lineHeight: 1.1,
            color: 'var(--text-strong)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {value}
        </strong>
      </div>
      {delta != null ? <Badge tone={deltaTone}>{delta}</Badge> : null}
    </div>
  )
}
