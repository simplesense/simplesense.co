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
  const topShare = (pct: number): number => {
    const count = Math.max(1, Math.ceil(n * pct))
    return roundTo(safeShare(sum(revenues.slice(0, count)), total) ?? 0, 4)
  }

  return [
    metric('pareto.customer_count', n, { unit: 'count', window: win }),
    metric('pareto.revenue_total', roundTo(total, 2), { unit: 'USD', window: win }),
    metric('pareto.top1_revenue_share', topShare(0.01), { unit: 'ratio', window: win }),
    metric('pareto.top5_revenue_share', topShare(0.05), { unit: 'ratio', window: win }),
    metric('pareto.top10_revenue_share', topShare(0.1), { unit: 'ratio', window: win }),
    metric('pareto.top20_revenue_share', topShare(0.2), { unit: 'ratio', window: win }),
    metric('pareto.top20_customer_count', Math.max(1, Math.ceil(n * 0.2)), {
      unit: 'count',
      window: win,
    }),
  ]
}
