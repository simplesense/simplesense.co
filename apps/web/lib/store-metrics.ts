import { prisma, DEMO } from '@ss/db'
import { latestMetrics } from '@ss/jobs'
import { shopifyConfig } from '@ss/config'
import { getSession } from './auth'
import { resolveActiveStore } from './store-resolve'
import { entitlementsForOrg } from './billing'
import { detailUnlocked, canExport } from './gating'

export interface MetricView {
  storeName: string
  isDemo: boolean
  /** Real store whose order history is capped at ~60 days (no read_all_orders) — show a notice. */
  historyLimited: boolean
  /** Tier not entitled to geo+Pareto detail (free, non-demo) — pages render locked panels. */
  detailLocked: boolean
  /** Tier not entitled to CSV exports — ExportButton renders its locked variant. */
  exportLocked: boolean
  /** Numeric value of a metric, or null when absent / insufficient. */
  num: (key: string) => number | null
  /** valueJson of a metric (typed by the caller), or null. */
  json: <T>(key: string) => T | null
  has: (key: string) => boolean
}

/** Load the active store's latest-run metrics for the detail screens (tenant-scoped). */
export async function loadStoreMetrics(): Promise<MetricView> {
  const { orgId } = await getSession()
  const { store, isDemo } = await resolveActiveStore(orgId)
  const ent = await entitlementsForOrg(orgId)
  const metrics = await latestMetrics(prisma, store.id)
  const byKey = new Map(metrics.map((m) => [m.key, m]))
  return {
    storeName: isDemo ? DEMO.storeName : store.shopDomain,
    isDemo,
    historyLimited: !isDemo && !shopifyConfig().hasAllOrdersScope,
    detailLocked: !detailUnlocked(ent, isDemo),
    exportLocked: !canExport(ent),
    num: (key) => byKey.get(key)?.valueNumeric ?? null,
    json: <T>(key: string) => (byKey.get(key)?.valueJson as T | undefined) ?? null,
    has: (key) => byKey.has(key),
  }
}
