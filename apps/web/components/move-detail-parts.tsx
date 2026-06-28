'use client'
import { useState, useTransition } from 'react'
import { Button } from '@ss/ui'
import { setMoveStatus } from '@/app/app/actions'

/** Left-column "The move" checklist — each step togglable, tracks doneCount (§19 Move Detail). */
export function MoveChecklist({ steps }: { steps: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div>
      <div style={{ display: 'grid', gap: 10 }}>
        {steps.map((step, i) => {
          const checked = done.has(i)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                textAlign: 'left',
                width: '100%',
                background: checked ? 'var(--ss-success-bg)' : 'var(--surface-soft)',
                border: `1px solid ${checked ? 'var(--ss-success)' : 'var(--border-hairline)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'background var(--dur-fast), border-color var(--dur-fast)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 22,
                  height: 22,
                  flex: 'none',
                  borderRadius: '50%',
                  marginTop: 1,
                  background: checked ? 'var(--ss-success)' : 'transparent',
                  border: checked ? 'none' : '1.5px solid var(--border-strong)',
                  color: '#fff',
                  fontSize: 12,
                }}
              >
                {checked ? <i className="bi bi-check2" /> : null}
              </span>
              <span
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.45,
                  color: 'var(--text-body)',
                  textDecoration: checked ? 'line-through' : 'none',
                  opacity: checked ? 0.7 : 1,
                }}
              >
                {step}
              </span>
            </button>
          )
        })}
      </div>
      <p style={{ margin: '12px 2px 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
        {done.size}/{steps.length} steps done
      </p>
    </div>
  )
}

type Applied = 'NONE' | 'IMPLEMENTED' | 'DISMISSED'

/** Right-rail apply / schedule controls — persists status via the tenant-scoped action. */
export function MoveApply({ moveId, initial }: { moveId: string; initial: Applied }) {
  const [state, setState] = useState<Applied>(initial)
  const [pending, startTransition] = useTransition()
  const act = (status: Applied) => {
    setState(status) // optimistic
    startTransition(() => {
      void setMoveStatus(moveId, status === 'NONE' ? 'VIEWED' : status)
    })
  }

  if (state === 'IMPLEMENTED') {
    return (
      <div
        style={{
          background: 'var(--ss-success-bg)',
          border: '1px solid var(--ss-success)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          color: 'var(--ss-success)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <i className="bi bi-check2-circle" style={{ marginRight: 8 }} />
        Applied — measuring lift after the attribution window.
        <button
          onClick={() => act('NONE')}
          disabled={pending}
          style={{
            display: 'block',
            marginTop: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          Undo
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Button
        variant="primary"
        iconRight="arrow-right"
        onClick={() => act('IMPLEMENTED')}
        disabled={pending}
      >
        Apply this move
      </Button>
      <Button variant="ghost" onClick={() => act('DISMISSED')} disabled={pending}>
        {state === 'DISMISSED' ? 'Dismissed' : 'Schedule for later'}
      </Button>
    </div>
  )
}
