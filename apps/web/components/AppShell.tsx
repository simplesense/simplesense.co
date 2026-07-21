import type { ReactNode } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Sidebar } from './Sidebar'
import { getShellContext, type ShellSyncStatus } from '@/lib/shell'

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/** Honest sync pill — reflects the store's real state instead of always claiming "Synced". */
const PILL: Record<ShellSyncStatus, { label: string; fg: string; bg: string }> = {
  READY: { label: 'Synced', fg: 'var(--ss-success)', bg: 'var(--ss-success-bg)' },
  SYNCING: { label: 'Syncing…', fg: 'var(--text-link)', bg: 'var(--ss-info-bg)' },
  PENDING: { label: 'Not synced', fg: 'var(--text-muted)', bg: 'var(--surface-soft)' },
  ERROR: { label: 'Sync failed', fg: 'var(--ss-warning)', bg: 'var(--ss-warning-bg)' },
  DEMO: { label: 'Demo data', fg: 'var(--text-muted)', bg: 'var(--surface-soft)' },
}

function Topbar({
  storeName,
  syncStatus,
  model,
}: {
  storeName: string
  syncStatus: ShellSyncStatus
  model: string
}) {
  const pill = PILL[syncStatus]
  return (
    <header className="ss-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <i className="bi bi-shop" aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-strong)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {storeName}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: pill.fg,
            background: pill.bg,
            borderRadius: 'var(--radius-pill)',
            padding: '2px 10px',
            flex: 'none',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: pill.fg }} />
          {pill.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="ss-topbar-model">
          {model === 'mock' ? 'Demo data · mock synthesis' : model ? `Synthesis · ${model}` : ''}
        </span>
        {hasClerk ? <UserButton /> : null}
      </div>
    </header>
  )
}

/**
 * The app chrome. Self-resolves the store name, sync pill, nav badge, and model label ONCE per
 * request (getShellContext) so every screen shows correct, consistent chrome — pages just supply
 * their own body.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const ctx = await getShellContext()
  return (
    <div className="ss-shell">
      <Sidebar openMoves={ctx.openMoves} />
      <div className="ss-shell-col">
        <Topbar storeName={ctx.storeName} syncStatus={ctx.syncStatus} model={ctx.model} />
        <main className="ss-main">{children}</main>
      </div>
    </div>
  )
}
