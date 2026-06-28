import type { ReactNode } from 'react'

interface NavItem {
  label: string
  icon: string
  href: string
  badge?: number
  active?: boolean
}

/** Canonical app nav (§19.5). Only implemented routes link out; others are placeholders. */
function navItems(openMoves: number): NavItem[] {
  return [
    { label: "This week's moves", icon: 'compass', href: '/app', badge: openMoves, active: true },
    { label: 'Store audit', icon: 'clipboard-data', href: '/audit/demo' },
    { label: 'Monitoring', icon: 'activity', href: '/monitoring' },
    { label: 'Customers', icon: 'people', href: '#' },
    { label: 'Geography', icon: 'geo-alt', href: '#' },
    { label: 'Products', icon: 'box-seam', href: '#' },
    { label: 'Connections', icon: 'plug', href: '/connections' },
    { label: 'Plans & billing', icon: 'credit-card', href: '#' },
    { label: 'Settings', icon: 'gear', href: '#' },
  ]
}

function Sidebar({ openMoves }: { openMoves: number }) {
  return (
    <aside
      style={{
        width: '16.5rem',
        flex: 'none',
        borderRight: '1px solid var(--border-hairline)',
        background: 'var(--surface-card)',
        height: '100dvh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: 6,
      }}
    >
      <div style={{ padding: '6px 10px 18px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            letterSpacing: '-0.01em',
            color: 'var(--text-strong)',
          }}
        >
          Simple Sense
        </span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems(openMoves).map((it) => (
          <a
            key={it.label}
            href={it.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 11px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: it.active ? 600 : 500,
              color: it.active ? 'var(--text-strong)' : 'var(--text-body)',
              background: it.active ? 'var(--surface-soft)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            <i
              className={`bi bi-${it.icon}`}
              aria-hidden="true"
              style={{
                fontSize: 17,
                color: it.active ? 'var(--action-primary)' : 'var(--text-muted)',
              }}
            />
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-onbrand)',
                  background: 'var(--action-primary)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '1px 8px',
                }}
              >
                {it.badge}
              </span>
            ) : null}
          </a>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', padding: '10px', fontSize: 12, color: 'var(--text-muted)' }}>
        Operator co-pilot
      </div>
    </aside>
  )
}

function Topbar({ storeName, model }: { storeName: string; model?: string }) {
  return (
    <header
      style={{
        height: '4rem',
        flex: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid var(--border-hairline)',
        background: 'color-mix(in srgb, var(--surface-card) 92%, transparent)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="bi bi-shop" aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>
          {storeName}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--ss-success)',
            background: 'var(--ss-success-bg)',
            borderRadius: 'var(--radius-pill)',
            padding: '2px 10px',
          }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ss-success)' }}
          />
          Synced
        </span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {model === 'mock' ? 'Demo data · mock synthesis' : `Synthesis · ${model ?? 'live'}`}
      </span>
    </header>
  )
}

export function AppShell({
  children,
  storeName,
  openMoves,
  model,
}: {
  children: ReactNode
  storeName: string
  openMoves: number
  model?: string
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--surface-page)' }}>
      <Sidebar openMoves={openMoves} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar storeName={storeName} model={model} />
        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 1500,
            margin: '0 auto',
            padding: '32px 28px 64px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
