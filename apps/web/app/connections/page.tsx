import { prisma, getOrgStore, DEMO } from '@ss/db'
import { shopifyConfig } from '@ss/config'
import { Badge } from '@ss/ui'
import { getSession } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { DisconnectButton } from '@/components/DisconnectButton'

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage() {
  const { orgId } = await getSession()
  const store = await getOrgStore(prisma, orgId, DEMO.storeId)
  const cfg = shopifyConfig()
  const connected = !!store?.accessTokenEnc
  const orderCount = store ? await prisma.order.count({ where: { storeId: store.id } }) : 0

  return (
    <AppShell storeName={DEMO.storeName} openMoves={0} model={cfg.hasCredentials ? 'live' : 'demo'}>
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
          maxWidth: 640,
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
          <>
            <p style={{ color: 'var(--text-body)', marginTop: 0 }}>
              {DEMO.shopDomain} · {orderCount.toLocaleString()} orders ingested · token stored
              encrypted.
            </p>
            {store ? <DisconnectButton storeId={store.id} /> : null}
          </>
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
            <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
            Live connect is ready — add <code>SHOPIFY_API_KEY</code> and{' '}
            <code>SHOPIFY_API_SECRET</code> (from a Shopify Partner app) to <code>.env</code> to
            enable the OAuth flow. The demo store ({orderCount.toLocaleString()} orders) is seeded
            and analyzed in the meantime.
          </div>
        )}
      </div>
    </AppShell>
  )
}
