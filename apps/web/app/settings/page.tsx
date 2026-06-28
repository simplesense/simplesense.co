import { prisma, getOrgStore } from '@ss/db'
import { getSession } from '@/lib/auth'
import { ownStoreId } from '@/lib/store-resolve'
import { AppShell } from '@/components/AppShell'
import { SettingsForm } from '@/components/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { orgId } = await getSession()
  const storeId = await ownStoreId(orgId)
  const store = storeId ? await getOrgStore(prisma, orgId, storeId) : null

  return (
    <AppShell storeName={store?.shopDomain ?? 'Settings'} openMoves={0} model="">
      <p className="ss-eyebrow" style={{ margin: 0 }}>
        SETTINGS
      </p>
      <h1
        style={{
          margin: '4px 0 8px',
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
        }}
      >
        Store settings
      </h1>
      <p style={{ marginTop: 0, marginBottom: 24, color: 'var(--text-body)' }}>
        These tell the engine which moves apply to your store. Saving re-runs the analysis.
      </p>
      {store ? (
        <SettingsForm
          initial={{
            hasPhysicalLocations: store.hasPhysicalLocations,
            freeShippingThreshold:
              store.freeShippingThreshold != null ? Number(store.freeShippingThreshold) : null,
          }}
        />
      ) : (
        <div
          style={{
            background: 'var(--ss-warning-bg)',
            color: 'var(--ss-warning)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 14,
            maxWidth: 560,
          }}
        >
          <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
          Connect your store on{' '}
          <a href="/connections" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Connections
          </a>{' '}
          first — then store settings appear here.
        </div>
      )}
    </AppShell>
  )
}
