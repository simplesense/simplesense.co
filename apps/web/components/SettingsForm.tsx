'use client'
import { useState } from 'react'
import { Button } from '@ss/ui'
import { updateStoreSettings } from '@/app/settings/actions'

interface Initial {
  hasPhysicalLocations: boolean
  freeShippingThreshold: number | null
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const [physical, setPhysical] = useState(initial.hasPhysicalLocations)
  const [threshold, setThreshold] = useState(initial.freeShippingThreshold?.toString() ?? '')
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(): Promise<void> {
    setPending(true)
    setMsg('')
    const r = await updateStoreSettings({
      hasPhysicalLocations: physical,
      freeShippingThreshold: threshold.trim() === '' ? null : Number(threshold),
    })
    setPending(false)
    setMsg(r.ok ? 'Saved — moves re-analyzed' : 'Save failed')
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={physical}
          onChange={(e) => setPhysical(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--action-primary)' }}
        />
        <span>
          <strong style={{ color: 'var(--text-strong)' }}>I have physical retail locations</strong>
          <span
            style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}
          >
            Enables geo trade-area + BOPIS moves. Off = online-only (regional inventory / ads).
          </span>
        </span>
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>
          Free-shipping threshold (USD)
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Leave blank if you don't offer free shipping. Powers the AOV / free-ship move.
        </span>
        <input
          inputMode="decimal"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="e.g. 75"
          style={{
            height: 42,
            maxWidth: 200,
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-card)',
            fontSize: 14,
          }}
        />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="primary" disabled={pending} onClick={() => void save()}>
          {pending ? 'Saving…' : 'Save & re-analyze'}
        </Button>
        {msg ? <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{msg}</span> : null}
      </div>
    </div>
  )
}
