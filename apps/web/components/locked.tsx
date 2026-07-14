import type { ReactNode } from 'react'

/**
 * Locked-state UI for tier gating (Slice 10). These are upsell surfaces, not the enforcement —
 * the server never sends locked data in the first place (see lib/gating.ts).
 */

function UpgradeLink({ children }: { children: ReactNode }) {
  return (
    <a href="/plans" className="ss-btn-primary">
      {children}
    </a>
  )
}

/** Replaces an analytics panel the current tier isn't entitled to. */
export function LockedPanel({
  title,
  copy,
  tierName = 'Basic',
}: {
  title: string
  copy: string
  tierName?: string
}) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 24px',
        textAlign: 'center',
        marginBottom: 20,
      }}
    >
      <i
        className="bi bi-lock"
        aria-hidden="true"
        style={{ fontSize: 22, color: 'var(--text-muted)' }}
      />
      <h3
        style={{
          margin: '10px 0 6px',
          fontFamily: 'var(--font-ui-display)',
          fontSize: 18,
          color: 'var(--text-strong)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: '0 auto 16px',
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--text-body)',
          maxWidth: '48ch',
        }}
      >
        {copy}
      </p>
      <UpgradeLink>
        Unlock with {tierName} <i className="bi bi-arrow-right" aria-hidden="true" />
      </UpgradeLink>
    </section>
  )
}

/** Shown at the end of the free tier's moves list: "N more moves" behind the plan wall. */
export function LockedMovesCard({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '26px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <i
          className="bi bi-lock"
          aria-hidden="true"
          style={{ fontSize: 20, color: 'var(--text-muted)', flex: 'none' }}
        />
        <div>
          <strong style={{ color: 'var(--text-strong)', fontSize: 15 }}>
            {count} more {count === 1 ? 'move' : 'moves'} found in your data
          </strong>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-body)' }}>
            The free plan shows your top moves. Basic unlocks the full ranked list, geo + Pareto
            detail, and segment exports.
          </p>
        </div>
      </div>
      <UpgradeLink>See plans</UpgradeLink>
    </div>
  )
}
