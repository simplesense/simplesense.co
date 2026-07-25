import { runAnalyzers } from '@ss/core'
import { returnLens } from '@ss/rulebooks'
import { generateStore } from '../generator/generate-store'
import { generateReturnsData } from '../generator/generate-returns'
import { renderMoves } from '../render-moves'
import { apparelBrandsConfig } from '../configs/apparel-brands'
import type { VerticalDemoResult } from './compute-pet-demo'

const { analyzeReturns } = returnLens

const pct = (v: number | null | undefined) => (v == null ? 0 : Math.round(v * 1000) / 10)
const usd = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)

const ABUSE_MIN_ORDERS = 3
const ABUSE_MIN_RETURN_RATE = 0.5

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function mode(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
}

/**
 * Real-pipeline: synthetic store -> @ss/core's real analyzers for general metrics,
 * PLUS synthetic order/return data -> M5 ReturnLens's real `analyzeReturns()` for the
 * abuse-cohort/bracketing/SKU metrics — the same tested pipeline built for the M5
 * ReturnLens audit itself, not new bespoke math.
 */
export function computeApparelBrandsDemo(now: Date): VerticalDemoResult {
  const params = apparelBrandsConfig.demoStore
  const store = generateStore(params, now)
  const generalMetrics = runAnalyzers({ store, now, windowMonths: 24 })
  const byKey = new Map(generalMetrics.map((m) => [m.key, m]))

  const { orders, returns } = generateReturnsData(params, now)
  const snapshot = analyzeReturns(orders, returns, 730)

  const abuseEntities = snapshot.entities.filter(
    (e) => e.orderCount >= ABUSE_MIN_ORDERS && e.returnRate >= ABUSE_MIN_RETURN_RATE,
  )
  const abuseCohortPct = pct(
    snapshot.entities.length > 0 ? abuseEntities.length / snapshot.entities.length : 0,
  )
  const totalRefund = snapshot.entities.reduce((s, e) => s + e.refundTotal, 0)
  const abuseRefund = abuseEntities.reduce((s, e) => s + e.refundTotal, 0)
  const abuseReturnSharePct = pct(totalRefund > 0 ? abuseRefund / totalRefund : 0)

  const jacketSkuNames = new Set(params.abusePatternSeed!.bracketingStyleSkuNames)
  const jacketOrderCount = orders.filter((o) =>
    o.lineItems.some((li) => jacketSkuNames.has(li.name)),
  ).length
  const bracketingOrdersPct = pct(
    jacketOrderCount > 0 ? snapshot.bracketingCandidates.length / jacketOrderCount : 0,
  )
  const bracketingTopSku = snapshot.bracketingCandidates[0]
    ? titleCase(snapshot.bracketingCandidates[0].baseStyle)
    : 'the flagged style'

  const topSkus = [...snapshot.skuStats]
    .sort((a, b) => b.returnedQuantity - a.returnedQuantity)
    .slice(0, 3)
  const totalReturnedQty = snapshot.skuStats.reduce((s, sk) => s + sk.returnedQuantity, 0)
  const top3ReturnedQty = topSkus.reduce((s, sk) => s + sk.returnedQuantity, 0)
  const top3ReturnSkuSharePct = pct(totalReturnedQty > 0 ? top3ReturnedQty / totalReturnedQty : 0)
  const top3SkuIds = new Set(topSkus.map((s) => s.sku))
  const topReturnReason = mode(
    returns.filter((r) => r.sku && top3SkuIds.has(r.sku)).map((r) => r.reason ?? 'unspecified'),
  )

  const computed = {
    abuseCohortPct,
    abuseReturnSharePct,
    abuseReturnValue: usd(abuseRefund),
    bracketingOrdersPct,
    bracketingTopSku,
    top3ReturnSkuSharePct,
    topReturnReason: topReturnReason ?? 'unspecified',
  }

  return {
    storeName: params.storeName,
    stats: [
      { label: 'Return rate', value: `${pct(byKey.get('returns.rate_overall')?.valueNumeric)}%` },
      {
        label: 'Repeat-purchase rate',
        value: `${pct(byKey.get('cohort.repeat_purchase_rate')?.valueNumeric)}%`,
      },
      { label: 'Abuse-cohort share of return $', value: `${abuseReturnSharePct}%` },
      { label: 'Bracketing pattern rate', value: `${bracketingOrdersPct}%` },
    ],
    moves: renderMoves(apparelBrandsConfig.exampleMoves, computed),
  }
}
