import type { Recommendation as PrismaRecommendation } from '@ss/db'
import { prisma, getOrgStore, DEMO } from '@ss/db'
import { analyzeStore, openRecommendations, latestRunId, latestMetricValue } from '@ss/jobs'
import { createLlmClient } from '@ss/engine'
import { llmConfig } from '@ss/config'
import type { Recommendation } from '@ss/core'
import { getSession } from './auth'
import { resolveStoreId } from './store-resolve'

export interface DashboardData {
  storeName: string
  model: string
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

/** Ensure a completed analysis run exists; the first load triggers one (live synthesis). */
async function ensureRun(storeId: string): Promise<void> {
  if (!(await latestRunId(prisma, storeId))) {
    await analyzeStore(prisma, storeId, { llm: createLlmClient() })
  }
}

/** Dashboard data for the current session's org, read from the DB (tenant-scoped). */
export async function getDashboard(): Promise<DashboardData> {
  const { orgId } = await getSession()
  const storeId = await resolveStoreId(orgId)
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store) throw new Error('store not found — run `pnpm --filter @ss/db seed`')
  await ensureRun(store.id)
  const rows = await openRecommendations(prisma, store.id)
  return {
    storeName: store.shopDomain === DEMO.shopDomain ? DEMO.storeName : store.shopDomain,
    model: modelLabel(),
    recommendations: rows.map(toCore),
    metrics: {
      revenue: await latestMetricValue(prisma, store.id, 'pareto.revenue_total'),
      top20: await latestMetricValue(prisma, store.id, 'pareto.top20_revenue_share'),
      within5: await latestMetricValue(prisma, store.id, 'geo.within_5mi_revenue_share'),
      repeat: await latestMetricValue(prisma, store.id, 'cohort.repeat_purchase_rate'),
    },
  }
}
