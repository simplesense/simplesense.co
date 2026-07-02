import { prisma, DEMO, type Recommendation as PrismaRecommendation } from '@ss/db'
import { latestRunId } from '@ss/jobs'
import type { Recommendation } from '@ss/core'
import { getSession } from './auth'
import { resolveActiveStore } from './store-resolve'
import { entitlementsForOrg } from './billing'
import { FREE_TOP_MOVES, canExport } from './gating'

/** One grounded evidence row: a metric the recommendation cites, with its real value. */
export interface EvidenceMetric {
  key: string
  label: string
  display: string
  window: string | null
}

export interface MoveDetail {
  rec: Recommendation
  evidence: EvidenceMetric[]
  isDemo: boolean
  storeName: string
  /** Tier not entitled to CSV exports — the segment-download CTA renders locked. */
  exportLocked: boolean
}

/** Friendly labels for the evidence keys analyzers emit (§6). Falls back to a generic humanizer. */
const LABELS: Record<string, string> = {
  'pareto.revenue_total': 'Total revenue',
  'pareto.customer_count': 'Customers',
  'pareto.top1_revenue_share': 'Revenue from top 1% of customers',
  'pareto.top5_revenue_share': 'Revenue from top 5% of customers',
  'pareto.top10_revenue_share': 'Revenue from top 10% of customers',
  'pareto.top20_revenue_share': 'Revenue from top 20% of customers',
  'pareto.top20_customer_count': 'Customers in the top 20%',
  'geo.within_5mi_revenue_share': 'Revenue within 5 miles',
  'geo.single_region_share': 'Revenue from the top region',
  'geo.top_zip_cluster_share': 'Revenue from the densest ZIP cluster',
  'geo.region_count': 'Distinct regions',
  'geo.geocoded_revenue_fraction': 'Revenue we could place on a map',
  'geo.unlocatable_revenue_fraction': 'Revenue with no usable address',
  'geo.trade_area_overlap_share': 'Revenue inside a store trade area',
  'geo.has_physical_locations': 'Has physical locations',
  'cohort.repeat_purchase_rate': 'Repeat purchase rate',
  'cohort.second_to_third_conversion': 'Second → third order rate',
  'cohort.time_to_second_order_median_days': 'Median days to second order',
  'cohort.new_customer_count': 'New customers (window)',
  'cohort.window_customer_count': 'Customers in window',
  'discount.revenue_share_discounted': 'Revenue sold at a discount',
  'discount.order_share_discounted': 'Orders with a discount',
  'discount.avg_discount_rate': 'Average discount depth',
  'aov.value': 'Average order value',
  'aov.freeship_threshold': 'Free-shipping threshold',
  'aov.freeship_gap': 'Gap to free-shipping threshold',
  'sku_margin.gross_margin_rate': 'Gross margin rate',
  'sku_margin.negative_margin_sku_count': 'SKUs losing money',
  'sku_margin.worst_sku_margin': 'Worst SKU margin',
  'returns.rate_overall': 'Return rate',
  'mix.new_revenue_share': 'Revenue from new customers',
  'mix.returning_revenue_share': 'Revenue from returning customers',
  'mix.guest_revenue_share': 'Revenue from guest checkout',
  'rfm.champions_count': 'Champion customers',
  'rfm.at_risk_count': 'At-risk customers',
  'rfm.loyal_count': 'Loyal customers',
  'rfm.dormant_count': 'Dormant customers',
  'replenishment.median_reorder_interval_days': 'Median reorder interval',
  'channel_profitability.ltv_cac': 'LTV : CAC ratio',
  'owned_channel.email_revenue_share': 'Revenue attributable to email',
  'acquisition.top_source_share': 'Revenue from the top acquisition source',
}

function humanize(key: string): string {
  const tail = key.includes('.') ? key.slice(key.indexOf('.') + 1) : key
  const words = tail.replace(/_/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const usd = (v: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  }).format(v)

/** Format a metric value the way its key/unit implies (share→%, count→int, days, USD). */
function formatMetric(
  key: string,
  value: number | null,
  json: unknown,
  unit: string | null,
): string {
  if (value == null) {
    if (json != null) return Array.isArray(json) ? `${json.length} entries` : 'see breakdown'
    return 'insufficient data'
  }
  const k = key.toLowerCase()
  if (/_share$|_rate$|_fraction$|conversion$/.test(k) || unit === 'ratio') {
    return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`
  }
  if (/ltv_cac/.test(k)) return `${value.toFixed(1)}×`
  if (/_days$|interval_days/.test(k)) return `${Math.round(value)} days`
  if (k.endsWith('_count')) return Math.round(value).toLocaleString('en-US')
  if (unit === 'USD' || /revenue_total|\.value$|threshold|gap|margin$/.test(k)) return usd(value)
  if (/has_/.test(k)) return value ? 'Yes' : 'No'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

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
 * Load a single move by id for the current session's org, with its cited evidence metrics
 * resolved to real values from the same run. Tenant-scoped: the move must belong to the
 * org's active store (or the shared demo). Returns null if not found / not owned.
 */
export async function loadMoveDetail(moveId: string): Promise<MoveDetail | null> {
  const { orgId } = await getSession()
  const { store, isDemo } = await resolveActiveStore(orgId)
  const runId = await latestRunId(prisma, store.id)
  if (!runId) return null

  const row = await prisma.recommendation.findFirst({ where: { id: moveId, runId } })
  if (!row) return null // not in this store's latest run — refuse (no cross-tenant peeking)

  // Tier gating: the free tier's visible set is the run's FIXED top-N by rank across ALL
  // statuses — the same anchor the dashboard slices — so a direct URL to a locked move 404s,
  // and no amount of dismissing/applying rotates locked moves into reach. Acted-on moves that
  // were in the fixed top-N stay accessible (membership, not status, decides).
  const ent = await entitlementsForOrg(orgId)
  if (!isDemo && ent.moves === 'top') {
    const topOfRun = await prisma.recommendation.findMany({
      where: { runId },
      orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
      take: FREE_TOP_MOVES,
      select: { id: true },
    })
    if (!topOfRun.some((t) => t.id === row.id)) return null
  }
  const rec = toCore(row)

  const metrics = rec.evidenceMetricIds.length
    ? await prisma.metric.findMany({
        where: { runId, key: { in: rec.evidenceMetricIds } },
        select: { key: true, valueNumeric: true, valueJson: true, unit: true, window: true },
      })
    : []
  const byKey = new Map(metrics.map((m) => [m.key, m]))

  const evidence: EvidenceMetric[] = rec.evidenceMetricIds.map((key) => {
    const m = byKey.get(key)
    return {
      key,
      label: LABELS[key] ?? humanize(key),
      display: formatMetric(key, m?.valueNumeric ?? null, m?.valueJson ?? null, m?.unit ?? null),
      window: m?.window ?? null,
    }
  })

  return {
    rec,
    evidence,
    isDemo,
    storeName: isDemo ? DEMO.storeName : store.shopDomain,
    exportLocked: !canExport(ent),
  }
}
