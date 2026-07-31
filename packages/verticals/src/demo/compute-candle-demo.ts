import { runAnalyzers } from '@ss/core'
import { generateStore } from '../generator/generate-store'
import { computeQ4GiftBuyerStats } from '../compute/q4-gift-buyers'
import { renderMoves } from '../render-moves'
import { candleBrandsConfig } from '../configs/candle-brands'
import { requiredPct } from './metric-access'
import type { VerticalDemoResult } from './compute-pet-demo'

/** Real-pipeline: synthetic store -> @ss/core's real analyzers + a real Q4-cohort computation -> pre-written move templates. */
export function computeCandleBrandsDemo(now: Date): VerticalDemoResult {
  const params = candleBrandsConfig.demoStore
  const store = generateStore(params, now)
  const metrics = runAnalyzers({ store, now, windowMonths: 24 })
  const byKey = new Map(metrics.map((m) => [m.key, m]))
  const gift = computeQ4GiftBuyerStats(store, now)

  const discountedRevenuePct = requiredPct(byKey, 'discount.revenue_share_discounted')
  const avgDiscountPct = requiredPct(byKey, 'discount.avg_discount_rate')
  const localRevenuePct = requiredPct(byKey, 'geo.within_5mi_revenue_share')

  const computed = {
    giftBuyerOneTimePct: gift.giftBuyerOneTimePct,
    q4OneTimeBuyerCount: gift.q4OneTimeBuyerCount,
    discountedRevenuePct,
    avgDiscountPct,
    localRevenuePct,
    localRadiusMiles: 5,
  }

  return {
    storeName: params.storeName,
    stats: [
      { label: 'Discounted revenue share', value: `${discountedRevenuePct}%` },
      { label: 'Revenue within 5 miles', value: `${localRevenuePct}%` },
      {
        label: 'Repeat-purchase rate',
        value: `${requiredPct(byKey, 'cohort.repeat_purchase_rate')}%`,
      },
      { label: 'Q4 one-time buyers', value: `${gift.giftBuyerOneTimePct}%` },
    ],
    moves: renderMoves(candleBrandsConfig.exampleMoves, computed),
  }
}
