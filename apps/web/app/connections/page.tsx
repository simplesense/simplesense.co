import { prisma } from '@ss/db'
import { shopifyConfig, missingScopes } from '@ss/config'
import { Badge } from '@ss/ui'
import { getSession } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { DisconnectButton } from '@/components/DisconnectButton'
import { SyncButton } from '@/components/SyncButton'
import { ConnectNotice } from '@/components/ConnectNotice'
import { ConnectForm } from '@/components/ConnectForm'

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; syncing?: string }>
}) {
  const { orgId } = await getSession()
  const { connected: connectedShop, error, syncing } = await searchParams
  const connected = await prisma.store.findFirst({
    where: { orgId, accessTokenEnc: { not: null } },
    orderBy: { createdAt: 'desc' },
  })
  const cfg = shopifyConfig()
  const orderCount = connected ? await prisma.order.count({ where: { storeId: connected.id } }) : 0
  // Scopes the deployment now requests that this store's recorded grant lacks — re-consent
  // picks them up. Empty for legacy stores (null grant): we can't tell, so we don't nag.
  const missing = connected ? missingScopes(connected.grantedScopes) : []

  return (
    <AppShell>
      <ConnectNotice connectedShop={connectedShop} error={error} syncing={syncing === '1'} />
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
            {missing.length > 0 && (
              <div
                style={{
                  background: 'var(--ss-warning-bg)',
                  color: 'var(--ss-warning)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                New permissions are available for this store (<code>{missing.join(', ')}</code>).{' '}
                <a
                  href={`/api/stores/connect/start?shop=${encodeURIComponent(connected.shopDomain)}`}
                >
                  Re-connect Shopify
                </a>{' '}
                to grant them
                {missing.includes('read_all_orders')
                  ? ' and unlock your full 24-month order history'
                  : ''}
                . After re-connecting, click <strong>Re-sync</strong> to pull the new data.
              </div>
            )}
            <SyncButton
              storeId={connected.id}
              initialStatus={connected.syncStatus}
              initialError={connected.syncError}
            />
            <DisconnectButton storeId={connected.id} />
          </div>
        ) : cfg.hasCredentials ? (
          <ConnectForm />
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
        Connecting starts your first sync automatically — we pull your order history and generate
        your first grounded moves. You can re-sync anytime from here. (Until then, the dashboard
        shows the demo store.)
      </p>
    </AppShell>
  )
}
