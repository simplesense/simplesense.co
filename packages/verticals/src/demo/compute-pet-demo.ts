import { runAnalyzers } from '@ss/core'
import { generateStore } from '../generator/generate-store'
import { computeSubscriptionChurn } from '../compute/subscription-churn'
import { renderMoves, type RenderedMove } from '../render-moves'
import { petBrandsConfig } from '../configs/pet-brands'
import { requiredMetric, requiredPct } from './metric-access'

export interface VerticalDemoStat {
  label: string
  value: string
}

export interface VerticalDemoResult {
  storeName: string
  stats: VerticalDemoStat[]
  moves: RenderedMove[]
}

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)

/** Real-pipeline: synthetic store -> @ss/core's real analyzers -> pre-written move templates. Zero hand-written numbers. */
export function computePetBrandsDemo(now: Date): VerticalDemoResult {
  const params = petBrandsConfig.demoStore
  const store = generateStore(params, now)
  const metrics = runAnalyzers({ store, now, windowMonths: 24 })
  const byKey = new Map(metrics.map((m) => [m.key, m]))
  const churn = computeSubscriptionChurn(params)

  const top20SharePct = requiredPct(byKey, 'pareto.top20_revenue_share')
  const top20CustomerCount = requiredMetric(byKey, 'pareto.top20_customer_count')
  const vipNoFlowCount = Math.round(top20CustomerCount * (1 - params.vipFlowCoveragePct))
  const medianReorderDays = Math.round(
    requiredMetric(byKey, 'replenishment.median_reorder_interval_days'),
  )
  const localRevenuePct = requiredPct(byKey, 'geo.within_5mi_revenue_share')

  const computed = {
    top20SharePct,
    topTierPct: 20, // the Pareto analyzer's own tier definition ("top 20%"), not editorial
    vipNoFlowCount,
    medianReorderDays,
    localRevenuePct,
    localRadiusMiles: 5, // the geography analyzer's own fixed radius, not editorial
    churnedSubscriberCount: churn.churnedSubscriberCount,
    lapsedSubscriberValueUsd: usd(churn.lapsedSubscriberValueUsd),
  }

  return {
    storeName: params.storeName,
    stats: [
      { label: 'Top-20% revenue share', value: `${top20SharePct}%` },
      { label: 'Revenue within 5 miles', value: `${localRevenuePct}%` },
      { label: 'Median reorder cycle', value: `${medianReorderDays} days` },
      {
        label: 'Repeat-purchase rate',
        value: `${requiredPct(byKey, 'cohort.repeat_purchase_rate')}%`,
      },
    ],
    moves: renderMoves(petBrandsConfig.exampleMoves, computed),
  }
}
