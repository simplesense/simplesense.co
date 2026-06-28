'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Shown on the dashboard while a background sync/analysis runs; auto-refreshes until moves land. */
export function SyncingBanner() {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(t)
  }, [router])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--ss-info-bg)',
        color: 'var(--text-link)',
        border: '1px solid var(--ss-blue-300)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        fontSize: 13.5,
        marginBottom: 20,
      }}
    >
      <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1.4s linear infinite' }} />
      Preparing your moves — pulling your store history and analyzing it. This page updates
      automatically.
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
