import { prisma, DEMO } from '@ss/db'
import { latestMetrics } from '@ss/jobs'
import { getSession } from './auth'
import { resolveActiveStore } from './store-resolve'

export interface MetricView {
  storeName: string
  isDemo: boolean
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
  const metrics = await latestMetrics(prisma, store.id)
  const byKey = new Map(metrics.map((m) => [m.key, m]))
  return {
    storeName: isDemo ? DEMO.storeName : store.shopDomain,
    isDemo,
    num: (key) => byKey.get(key)?.valueNumeric ?? null,
    json: <T>(key: string) => (byKey.get(key)?.valueJson as T | undefined) ?? null,
    has: (key) => byKey.has(key),
  }
}
