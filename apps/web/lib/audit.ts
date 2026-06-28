import type { Recommendation as PrismaRecommendation } from '@ss/db'
import { prisma, DEMO } from '@ss/db'
import { analyzeStore, latestRecommendations, latestRunId, latestMetricValue } from '@ss/jobs'
import { createLlmClient } from '@ss/engine'
import type { Recommendation } from '@ss/core'

export interface AuditStat {
  label: string
  value: string
}

export interface PublicAudit {
  storeName: string
  slug: string
  headline: string
  generatedNote: string
  /** Curated highest-conviction subset. Aggregate metrics only — no customer PII. */
  moves: Recommendation[]
  stats: AuditStat[]
}

const usd = (v: number | null): string =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)
const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)

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

/**
 * Build the public Audit payload (Slice 8 wedge) from the latest persisted run. The demo
 * slug maps to the demo store; a real Audit row (publicSlug → store) lands with sharing.
 * Contains NO raw customer PII — only aggregate computed metrics and prescriptive copy.
 */
export async function buildAudit(slug: string): Promise<PublicAudit> {
  const storeId = DEMO.storeId
  if (!(await latestRunId(prisma, storeId))) {
    await analyzeStore(prisma, storeId, { llm: createLlmClient() })
  }
  const rows = await latestRecommendations(prisma, storeId)
  const moves = rows.slice(0, 3).map(toCore)
  const stats: AuditStat[] = [
    {
      label: 'Trailing revenue (24m)',
      value: usd(await latestMetricValue(prisma, storeId, 'pareto.revenue_total')),
    },
    {
      label: 'Top-20% revenue share',
      value: pct(await latestMetricValue(prisma, storeId, 'pareto.top20_revenue_share')),
    },
    {
      label: 'Revenue within 5 miles',
      value: pct(await latestMetricValue(prisma, storeId, 'geo.within_5mi_revenue_share')),
    },
    {
      label: 'Repeat-purchase rate',
      value: pct(await latestMetricValue(prisma, storeId, 'cohort.repeat_purchase_rate')),
    },
  ]
  return {
    storeName: DEMO.storeName,
    slug,
    headline: `${DEMO.storeName}: your highest-conviction moves`,
    generatedNote:
      'A free, grounded snapshot from Simple Sense — every number earned from your own store data.',
    moves,
    stats,
  }
}

/** Public-surface PII guard: returns any email-looking leaks in the payload. */
export function findPiiLeaks(payload: unknown): string[] {
  const json = JSON.stringify(payload)
  return json.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []
}
