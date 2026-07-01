import type { Recommendation as PrismaRecommendation } from '@ss/db'
import { prisma, DEMO } from '@ss/db'
import { analyzeStore, openRecommendations, latestRunId, latestMetricValue } from '@ss/jobs'
import { createLlmClient } from '@ss/engine'
import { llmConfig, shopifyConfig } from '@ss/config'
import type { Recommendation } from '@ss/core'
import { getSession } from './auth'
import { resolveActiveStore } from './store-resolve'

export interface DashboardData {
  storeName: string
  model: string
  isDemo: boolean
  /** A background sync/analysis is in flight — show a "preparing your moves" state. */
  syncing: boolean
  /** Connected but never synced (or sync failed) and no analysis exists — prompt to sync. */
  needsSync: boolean
  /** Real store capped at ~60 days of orders (no read_all_orders) — show the partial-history notice. */
  historyLimited: boolean
  recommendations: Recommendation[]
  metrics: {
    revenue: number | null
    top20: number | null
    within5: number | null
    repeat: number | null
  }
}

/** Map a persisted recommendation row to the core shape the UI consumes. */
function toCore(r: PrismaRecommendation): Recommendation {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    rationale: r.rationale,
    evidenceMetricIds: r.evidenceMetricIds,
    impactLow: r.impactLow,
    impactHigh: r.impactHigh,
    impactUnit: r.impactUnit,
    effort: r.effort,
    confidence: r.confidence,
    rankScore: r.rankScore,
    status: r.status,
    suggestedExecution: (r.suggestedExecution ?? { type: 'manual', spec: {} }) as {
      type: string
      spec: Record<string, unknown>
    },
  }
}

const modelLabel = (): string => {
  const cfg = llmConfig()
  return cfg.hasApiKey ? cfg.model : 'mock'
}

/**
 * Ensure a completed analysis run exists; the first load triggers one (live synthesis).
 * Only runs when the store's data is actually READY (or it's the seeded demo) — analyzing a
 * PENDING/SYNCING/ERROR store would produce an "empty run" that reads as "all caught up" on a
 * store that was never synced, and double-run the LLM against half-ingested data.
 */
async function ensureRun(storeId: string, ready: boolean): Promise<void> {
  if (!ready) return
  if (!(await latestRunId(prisma, storeId))) {
    await analyzeStore(prisma, storeId, { llm: createLlmClient() })
  }
}

/** Dashboard data for the current session's org, read from the DB (tenant-scoped). */
export async function getDashboard(): Promise<DashboardData> {
  const { orgId } = await getSession()
  const { store, isDemo } = await resolveActiveStore(orgId)
  const syncing = !isDemo && store.syncStatus === 'SYNCING'
  await ensureRun(store.id, isDemo || store.syncStatus === 'READY')
  const hasRun = Boolean(await latestRunId(prisma, store.id))
  const rows = await openRecommendations(prisma, store.id)
  return {
    storeName: isDemo ? DEMO.storeName : store.shopDomain,
    model: modelLabel(),
    isDemo,
    syncing,
    // Connected but never successfully synced+analyzed (PENDING/ERROR, no run) — prompt the
    // user to sync rather than pretending work is in flight or showing "all caught up".
    needsSync: !isDemo && !syncing && !hasRun,
    historyLimited: !isDemo && !shopifyConfig().hasAllOrdersScope,
    recommendations: rows.map(toCore),
    metrics: {
      revenue: await latestMetricValue(prisma, store.id, 'pareto.revenue_total'),
      top20: await latestMetricValue(prisma, store.id, 'pareto.top20_revenue_share'),
      within5: await latestMetricValue(prisma, store.id, 'geo.within_5mi_revenue_share'),
      repeat: await latestMetricValue(prisma, store.id, 'cohort.repeat_purchase_rate'),
    },
  }
}
