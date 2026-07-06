import { prisma } from '@ss/db'
import { shopifyConfig } from '@ss/config'
import { Badge } from '@ss/ui'
import { getSession } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { DisconnectButton } from '@/components/DisconnectButton'
import { SyncButton } from '@/components/SyncButton'
import { ConnectNotice } from '@/components/ConnectNotice'

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const { orgId } = await getSession()
  const { connected: connectedShop, error } = await searchParams
  const connected = await prisma.store.findFirst({
    where: { orgId, accessTokenEnc: { not: null } },
    orderBy: { createdAt: 'desc' },
  })
  const cfg = shopifyConfig()
  const orderCount = connected ? await prisma.order.count({ where: { storeId: connected.id } }) : 0

  return (
    <AppShell>
      <ConnectNotice connectedShop={connectedShop} error={error} />
      <p className="ss-eyebrow" style={{ margin: 0 }}>
        CONNECTIONS
      </p>
      <h1
        style={{
          margin: '4px 0 24px',
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
        }}
      >
        Connect your store
      </h1>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: 24,
          maxWidth: 660,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <i className="bi bi-bag-check" style={{ fontSize: 22, color: 'var(--ss-success)' }} />
          <strong style={{ fontSize: 18, color: 'var(--text-strong)' }}>Shopify</strong>
          {connected ? (
            <Badge tone="success" dot>
              Connected
            </Badge>
          ) : (
            <Badge tone="neutral">Not connected</Badge>
          )}
        </div>

        {connected ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ margin: 0, color: 'var(--text-body)' }}>
              {connected.shopDomain} · {orderCount.toLocaleString()} orders ingested · token stored
              encrypted · status {connected.syncStatus.toLowerCase()}.
            </p>
            <SyncButton
              storeId={connected.id}
              initialStatus={connected.syncStatus}
              initialError={connected.syncError}
            />
            <DisconnectButton storeId={connected.id} />
          </div>
        ) : cfg.hasCredentials ? (
          <form
            action="/api/stores/connect/start"
            method="get"
            style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input
              name="shop"
              placeholder="your-store.myshopify.com"
              style={{
                flex: 1,
                minWidth: 260,
                height: 42,
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-card)',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              style={{
                height: 42,
                padding: '0 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--action-primary)',
                color: 'var(--text-onbrand)',
                fontWeight: 600,
                boxShadow: 'var(--shadow-inset-glint), var(--shadow-sm)',
                cursor: 'pointer',
              }}
            >
              Connect Shopify
            </button>
          </form>
        ) : (
          <div
            style={{
              background: 'var(--ss-warning-bg)',
              color: 'var(--ss-warning)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontSize: 13.5,
            }}
          >
            Add <code>SHOPIFY_API_KEY</code> + <code>SHOPIFY_API_SECRET</code> to enable connect.
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', maxWidth: 660 }}>
        After connecting, click <strong>Sync now</strong> to pull your order history and generate
        your first grounded moves. (Until then, the dashboard shows the demo store.)
      </p>
    </AppShell>
  )
}
