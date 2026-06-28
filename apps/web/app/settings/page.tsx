import { prisma, getOrgStore } from '@ss/db'
import { getSession } from '@/lib/auth'
import { resolveStoreId } from '@/lib/store-resolve'
import { AppShell } from '@/components/AppShell'
import { SettingsForm } from '@/components/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { orgId } = await getSession()
  const store = await getOrgStore(prisma, orgId, await resolveStoreId(orgId))
  const initial = {
    hasPhysicalLocations: store?.hasPhysicalLocations ?? false,
    freeShippingThreshold:
      store?.freeShippingThreshold != null ? Number(store.freeShippingThreshold) : null,
  }

  return (
    <AppShell storeName={store?.shopDomain ?? 'Store'} openMoves={0} model="">
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
      <SettingsForm initial={initial} />
    </AppShell>
  )
}
