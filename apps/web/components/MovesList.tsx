'use client'
import { useState, useTransition } from 'react'
import type { Recommendation } from '@ss/core'
import { MoveCard, recommendationToMove } from '@ss/ui'
import { setMoveStatus } from '@/app/app/actions'
import { LockedMovesCard } from '@/components/locked'
import { REASON_COPY } from '@/lib/action-result'

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
  const [notice, setNotice] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const statusOf = (id: string): Status => statuses[id] ?? 'NEW'
  const set = (id: string, s: Status) => {
    const prevStatus = statusOf(id)
    setNotice(null)
    setStatuses((prev) => ({ ...prev, [id]: s })) // optimistic
    startTransition(() => {
      void setMoveStatus(id, s).then((r) => {
        // On refusal, roll back the optimistic update AND explain why (demo read-only, tier-
        // locked, …) instead of a silent flicker that reads as a broken button.
        if (!r?.ok) {
          setStatuses((prev) => ({ ...prev, [id]: prevStatus }))
          setNotice(REASON_COPY[r.reason])
        }
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

      {notice ? (
        <div
          role="status"
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
            marginBottom: 18,
          }}
        >
          <i className="bi bi-info-circle" aria-hidden="true" />
          {notice}
          <a href="/connections" style={{ marginLeft: 'auto', color: 'var(--text-link)' }}>
            Connect your store →
          </a>
        </div>
      ) : null}

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
                    className="ss-link"
                    style={{ fontSize: 12.5, padding: '4px 6px' }}
                  >
                    See the evidence <i className="bi bi-arrow-right" />
                  </a>
                  <button
                    onClick={() => set(rec.id, 'DISMISSED')}
                    className="ss-link ss-link--muted"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12.5,
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
