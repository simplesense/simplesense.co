'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@ss/ui'
import { syncStoreAction, getSyncStatus } from '@/app/connections/actions'

/**
 * Triggers a background sync, then polls its persisted status until it lands. The heavy work
 * runs off the request path (server action `after()`), so this never blocks on a long backfill —
 * it just watches `Store.syncStatus` flip SYNCING → READY/ERROR and refreshes the page when done.
 */
export function SyncButton({
  storeId,
  initialStatus,
  initialError,
}: {
  storeId: string
  initialStatus: string
  initialError?: string | null
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'SYNCING') return
    let active = true
    const tick = async (): Promise<void> => {
      const s = await getSyncStatus(storeId)
      if (!active) return
      setStatus(s.status)
      setError(s.error)
      if (s.status === 'SYNCING') {
        timer.current = setTimeout(() => void tick(), 3000)
      } else {
        router.refresh() // pull in the freshly-synced data + moves
      }
    }
    timer.current = setTimeout(() => void tick(), 3000)
    return () => {
      active = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [status, storeId, router])

  async function run(): Promise<void> {
    setError(null)
    const r = await syncStoreAction(storeId)
    if (!r.ok) {
      setError(r.error ?? 'sync failed')
      return
    }
    setStatus('SYNCING') // kicks off the polling effect
  }

  const syncing = status === 'SYNCING'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Button variant="primary" disabled={syncing} onClick={() => void run()}>
        {syncing ? 'Syncing…' : status === 'READY' ? 'Re-sync' : 'Sync now'}
      </Button>
      {syncing ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Pulling your history &amp; analyzing — this can take a few minutes for large stores.
        </span>
      ) : status === 'READY' && !error ? (
        <span style={{ fontSize: 13, color: 'var(--ss-success)' }}>
          Synced — open This week&apos;s moves.
        </span>
      ) : error ? (
        <span style={{ fontSize: 13, color: 'var(--ss-danger, #c0392b)' }}>
          Sync failed: {error} — try again.
        </span>
      ) : null}
    </div>
  )
}
