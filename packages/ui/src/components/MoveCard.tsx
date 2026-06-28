'use client'
import type { CSSProperties } from 'react'
import { Badge } from './Badge'
import { Button } from './Button'

export interface MoveCardProps {
  rank?: number
  category?: string
  /** The non-obvious finding, set in editorial serif. */
  pattern: string
  why?: string
  /** The ✓ list of concrete actions. */
  moves?: string[]
  /** Grounded impact range string, e.g. "+$1.1–1.5k/mo". */
  impact?: string
  confidence?: string
  ctaLabel?: string
  onApply?: () => void
  style?: CSSProperties
}

/**
 * MoveCard — the signature SimpleSense unit: a ranked, prescriptive recommendation.
 * Structure IS Pattern → Why → Move → Impact (§19). This is the product's hero component.
 */
export function MoveCard({
  rank,
  category = 'Move',
  pattern,
  why,
  moves = [],
  impact,
  confidence,
  ctaLabel = 'Apply this move',
  onApply,
  style,
}: MoveCardProps) {
  return (
    <article
      style={{
        position: 'relative',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '22px 24px',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {rank != null ? (
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--ss-blue-500)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              lineHeight: 1,
              boxShadow: 'var(--shadow-inset-glint)',
              flex: 'none',
            }}
          >
            {rank}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            className="ss-eyebrow"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            {category}
          </span>
        </div>
        {impact ? (
          <Badge tone="success" dot>
            {impact}
          </Badge>
        ) : null}
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: 'var(--text-strong)',
        }}
      >
        {pattern}
      </p>

      {why ? (
        <p
          style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--text-body)' }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>Why · </span>
          {why}
        </p>
      ) : null}

      {moves.length ? (
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 9 }}>
          {moves.map((m, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontSize: 14,
                lineHeight: 1.45,
                color: 'var(--text-body)',
              }}
            >
              <i
                className="bi bi-check2"
                aria-hidden="true"
                style={{ color: 'var(--ss-success)', fontSize: 16, marginTop: 1, flex: 'none' }}
              />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border-hairline)',
        }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          {confidence ? (
            <>
              <i className="bi bi-bullseye" aria-hidden="true" style={{ marginRight: 6 }} />
              {confidence}
            </>
          ) : null}
        </span>
        {onApply ? (
          <Button size="sm" variant="primary" iconRight="arrow-right" onClick={onApply}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </article>
  )
}
