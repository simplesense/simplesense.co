'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  icon: string
  href: string
  badge?: number
}

/** Canonical app nav (§19.5). Active state derives from the real route, never a hardcoded flag. */
function navItems(openMoves: number): NavItem[] {
  return [
    { label: "This week's moves", icon: 'compass', href: '/app', badge: openMoves },
    { label: 'Store audit', icon: 'clipboard-data', href: '/audit/demo' },
    { label: 'Monitoring', icon: 'activity', href: '/monitoring' },
    { label: 'Customers', icon: 'people', href: '/customers' },
    { label: 'Geography', icon: 'geo-alt', href: '/geography' },
    { label: 'Products', icon: 'box-seam', href: '/products' },
    { label: 'Connections', icon: 'plug', href: '/connections' },
    { label: 'Plans & billing', icon: 'credit-card', href: '/plans' },
    { label: 'Settings', icon: 'gear', href: '/settings' },
  ]
}

/** Longest-prefix match so /app/moves/123 lights up "This week's moves", etc. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/app') return pathname === '/app' || pathname.startsWith('/app/')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ openMoves }: { openMoves: number }) {
  const pathname = usePathname() ?? ''
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
        <Link
          href="/app"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            letterSpacing: '-0.01em',
            color: 'var(--text-strong)',
            textDecoration: 'none',
          }}
        >
          Simple Sense
        </Link>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems(openMoves).map((it) => {
          const active = isActive(pathname, it.href)
          return (
            <Link
              key={it.label}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className="ss-nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--text-strong)' : 'var(--text-body)',
                background: active ? 'var(--surface-soft)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <i
                className={`bi bi-${it.icon}`}
                aria-hidden="true"
                style={{
                  fontSize: 17,
                  color: active ? 'var(--action-primary)' : 'var(--text-muted)',
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
            </Link>
          )
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: '10px', fontSize: 12, color: 'var(--text-muted)' }}>
        Operator co-pilot
      </div>
    </aside>
  )
}
