import { runAnalyzers } from '@ss/core'
import { generateStore } from '../generator/generate-store'
import { computeQ4GiftBuyerStats } from '../compute/q4-gift-buyers'
import { renderMoves } from '../render-moves'
import { candleBrandsConfig } from '../configs/candle-brands'
import type { VerticalDemoResult } from './compute-pet-demo'

const pct = (v: number | null | undefined) => (v == null ? 0 : Math.round(v * 1000) / 10)

/** Real-pipeline: synthetic store -> @ss/core's real analyzers + a real Q4-cohort computation -> pre-written move templates. */
export function computeCandleBrandsDemo(now: Date): VerticalDemoResult {
  const params = candleBrandsConfig.demoStore
  const store = generateStore(params, now)
  const metrics = runAnalyzers({ store, now, windowMonths: 24 })
  const byKey = new Map(metrics.map((m) => [m.key, m]))
  const gift = computeQ4GiftBuyerStats(store, now)

  const discountedRevenuePct = pct(byKey.get('discount.revenue_share_discounted')?.valueNumeric)
  const avgDiscountPct = pct(byKey.get('discount.avg_discount_rate')?.valueNumeric)
  const localRevenuePct = pct(byKey.get('geo.within_5mi_revenue_share')?.valueNumeric)

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
        value: `${pct(byKey.get('cohort.repeat_purchase_rate')?.valueNumeric)}%`,
      },
      { label: 'Q4 one-time buyers', value: `${gift.giftBuyerOneTimePct}%` },
    ],
    moves: renderMoves(candleBrandsConfig.exampleMoves, computed),
  }
}
