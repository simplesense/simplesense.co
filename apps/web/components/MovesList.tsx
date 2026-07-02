'use client'
import { useState, useTransition } from 'react'
import type { Recommendation } from '@ss/core'
import { MoveCard, recommendationToMove } from '@ss/ui'
import { setMoveStatus } from '@/app/app/actions'
import { LockedMovesCard } from '@/components/locked'

type Status = 'NEW' | 'IMPLEMENTED' | 'DISMISSED'

/**
 * Interactive "This week's moves" list. Apply marks a move IMPLEMENTED, "Not now"
 * dismisses it — both persist to the DB via a tenant-scoped server action (optimistic
 * local update). IMPLEMENTED will trigger the §8.6 outcome job once Slice 9 lands.
 */
export function MovesList({
  recommendations,
  lockedCount = 0,
}: {
  recommendations: Recommendation[]
  /** Moves the tier can't see (server never sent them) — rendered as an upgrade card. */
  lockedCount?: number
}) {
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [, startTransition] = useTransition()
  const statusOf = (id: string): Status => statuses[id] ?? 'NEW'
  const set = (id: string, s: Status) => {
    const prevStatus = statusOf(id)
    setStatuses((prev) => ({ ...prev, [id]: s })) // optimistic
    startTransition(() => {
      void setMoveStatus(id, s).then((r) => {
        // Roll back if the server refused (e.g. the read-only demo store) so we never show a
        // false "Applied — measuring lift" for a write that didn't happen.
        if (!r?.ok) setStatuses((prev) => ({ ...prev, [id]: prevStatus }))
      })
    })
  }

  const open = recommendations.filter((r) => statusOf(r.id) === 'NEW')
  const applied = recommendations.filter((r) => statusOf(r.id) === 'IMPLEMENTED')

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <p className="ss-eyebrow" style={{ margin: 0 }}>
            THIS WEEK
          </p>
          <h1
            style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--text-strong)',
            }}
          >
            Your next moves
          </h1>
        </div>
        {applied.length > 0 ? (
          <span style={{ fontSize: 13, color: 'var(--ss-success)' }}>
            <i className="bi bi-check2-circle" style={{ marginRight: 6 }} />
            {applied.length} applied · measuring lift
          </span>
        ) : null}
      </div>

      {open.length === 0 ? (
        // Never claim "all caught up" while locked moves exist — the upsell stays honest.
        lockedCount > 0 ? (
          <LockedMovesCard count={lockedCount} />
        ) : (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <i className="bi bi-check2-all" style={{ fontSize: 28, color: 'var(--ss-success)' }} />
            <p style={{ marginTop: 12, fontSize: 15 }}>
              You're all caught up. New moves appear after the next analysis run.
            </p>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {open.map((rec, i) => {
            const props = recommendationToMove(rec, i + 1)
            return (
              <div key={rec.id}>
                <MoveCard {...props} onApply={() => set(rec.id, 'IMPLEMENTED')} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}
                >
                  <a
                    href={`/app/moves/${rec.id}`}
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-link)',
                      textDecoration: 'none',
                      padding: '4px 6px',
                    }}
                  >
                    See the evidence <i className="bi bi-arrow-right" />
                  </a>
                  <button
                    onClick={() => set(rec.id, 'DISMISSED')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      color: 'var(--text-muted)',
                      padding: '4px 6px',
                    }}
                  >
                    Not now
                  </button>
                </div>
              </div>
            )
          })}
          <LockedMovesCard count={lockedCount} />
        </div>
      )}
    </section>
  )
}
