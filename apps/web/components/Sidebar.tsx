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
    <aside className="ss-sidebar">
      <div>
        <Link href="/app" className="ss-brand" aria-label="Simple Sense">
          <span className="ss-brand-full">Simple Sense</span>
          <span className="ss-brand-mini" aria-hidden="true">
            S
          </span>
        </Link>
      </div>
      <nav className="ss-nav">
        {navItems(openMoves).map((it) => {
          const active = isActive(pathname, it.href)
          return (
            <Link
              key={it.label}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              aria-label={it.label}
              title={it.label}
              className="ss-nav-item"
            >
              <i className={`bi bi-${it.icon} ss-nav-icon`} aria-hidden="true" />
              <span className="ss-nav-label">{it.label}</span>
              {it.badge ? <span className="ss-nav-badge">{it.badge}</span> : null}
            </Link>
          )
        })}
      </nav>
      <div className="ss-sidebar-foot">Operator co-pilot</div>
    </aside>
  )
}
