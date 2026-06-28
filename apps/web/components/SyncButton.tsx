'use client'
import { useState } from 'react'
import { Button } from '@ss/ui'
import { syncStoreAction } from '@/app/connections/actions'

export function SyncButton({ storeId }: { storeId: string }) {
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState('')

  async function run(): Promise<void> {
    setPending(true)
    setMsg('')
    const r = await syncStoreAction(storeId)
    setPending(false)
    setMsg(r.ok ? "Synced — open This week's moves" : `Sync failed: ${r.error ?? ''}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Button variant="primary" disabled={pending} onClick={() => void run()}>
        {pending ? 'Syncing…' : 'Sync now'}
      </Button>
      {msg ? <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{msg}</span> : null}
    </div>
  )
}
