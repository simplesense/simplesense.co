'use client'
import { useState } from 'react'
import type { Recommendation } from '@ss/core'
import { MoveCard, recommendationToMove } from '@ss/ui'

type Status = 'NEW' | 'IMPLEMENTED' | 'DISMISSED'

/**
 * Interactive "This week's moves" list. Apply marks a move IMPLEMENTED (which, once the
 * DB + flywheel land, schedules the §8.6 outcome job); "Not now" dismisses it. State is
 * local for the demo — persistence arrives with the data slices.
 */
export function MovesList({ recommendations }: { recommendations: Recommendation[] }) {
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const statusOf = (id: string): Status => statuses[id] ?? 'NEW'
  const set = (id: string, s: Status) => setStatuses((prev) => ({ ...prev, [id]: s }))

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
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {open.map((rec, i) => {
            const props = recommendationToMove(rec, i + 1)
            return (
              <div key={rec.id}>
                <MoveCard {...props} onApply={() => set(rec.id, 'IMPLEMENTED')} />
                <div style={{ textAlign: 'right', marginTop: 6 }}>
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
        </div>
      )}
    </section>
  )
}
