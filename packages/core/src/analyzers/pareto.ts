import type { Analyzer } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { sum, safeShare, roundTo } from '../math'

const MIN_CUSTOMERS = 5

/**
 * Pareto / customer concentration — revenue share of the top 1/5/10/20% of paying
 * customers over the trailing window. The hero "top 20% drive ~70%" insight.
 */
export const paretoAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const byCustomer = new Map<string, number>()
  for (const o of ordersInWindow(ctx)) {
    const id = o.customerId
    if (!id) continue
    byCustomer.set(id, (byCustomer.get(id) ?? 0) + netRevenue(o))
  }
  const revenues = [...byCustomer.values()].filter((v) => v > 0).sort((a, b) => b - a)
  const n = revenues.length

  if (n < MIN_CUSTOMERS) {
    return [
      insufficient(
        'pareto.top20_revenue_share',
        `only ${n} paying customers; need >= ${MIN_CUSTOMERS}`,
        { unit: 'ratio', window: win },
      ),
    ]
  }

  const total = sum(revenues)
  // For small stores, ceil(n*pct) can collapse several tiers onto the same customer
  // count. Record the EFFECTIVE percentile so Stage 3 never mislabels e.g. "top 1%"
  // when it is really "top 10%" (Prime Directive #1).
  const topShare = (key: string, pct: number) => {
    const count = Math.max(1, Math.ceil(n * pct))
    const share = roundTo(safeShare(sum(revenues.slice(0, count)), total) ?? 0, 4)
    return metric(key, share, {
      unit: 'ratio',
      window: win,
      valueJson: {
        nominal_pct: pct,
        effective_customer_count: count,
        effective_pct: roundTo(count / n, 4),
      },
    })
  }

  return [
    metric('pareto.customer_count', n, { unit: 'count', window: win }),
    metric('pareto.revenue_total', roundTo(total, 2), { unit: 'USD', window: win }),
    topShare('pareto.top1_revenue_share', 0.01),
    topShare('pareto.top5_revenue_share', 0.05),
    topShare('pareto.top10_revenue_share', 0.1),
    topShare('pareto.top20_revenue_share', 0.2),
    metric('pareto.top20_customer_count', Math.max(1, Math.ceil(n * 0.2)), {
      unit: 'count',
      window: win,
    }),
  ]
}
