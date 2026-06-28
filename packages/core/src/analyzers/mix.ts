import type { Analyzer, Order } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { roundTo, safeShare } from '../math'

/** Earliest order time per customer across ALL store history (not just the window). */
function firstOrderTimes(allOrders: Order[]): Map<string, number> {
  const first = new Map<string, number>()
  for (const o of allOrders) {
    if (!o.customerId) continue
    const t = o.createdAt.getTime()
    const prev = first.get(o.customerId)
    if (prev == null || t < prev) first.set(o.customerId, t)
  }
  return first
}

/**
 * New vs returning revenue mix over the window. An order is "new" when it is the
 * customer's first-ever order (all-time), else "returning".
 */
export const newVsReturningAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const firsts = firstOrderTimes(ctx.store.orders)
  const orders = ordersInWindow(ctx)
  let newRev = 0
  let retRev = 0
  let newOrders = 0
  let retOrders = 0
  for (const o of orders) {
    const rev = netRevenue(o)
    if (rev <= 0) continue
    const isNew = o.customerId != null && firsts.get(o.customerId) === o.createdAt.getTime()
    if (isNew) {
      newRev += rev
      newOrders++
    } else {
      retRev += rev
      retOrders++
    }
  }
  const total = newRev + retRev
  if (total <= 0) {
    return [
      insufficient('mix.new_revenue_share', 'no attributable revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  return [
    metric('mix.new_revenue_share', roundTo(safeShare(newRev, total) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('mix.returning_revenue_share', roundTo(safeShare(retRev, total) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('mix.new_order_count', newOrders, { unit: 'count', window: win }),
    metric('mix.returning_order_count', retOrders, { unit: 'count', window: win }),
  ]
}

/**
 * Acquisition mix (Shopify-native): revenue attributed to the source of each
 * customer's FIRST order (first-order attribution only). Insufficient when Shopify
 * carries no source data.
 */
export const acquisitionAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  // each customer's first-order source (across all history)
  const firstSource = new Map<string, string>()
  const firstTime = new Map<string, number>()
  for (const o of ctx.store.orders) {
    if (!o.customerId || !o.sourceName) continue
    const t = o.createdAt.getTime()
    const prev = firstTime.get(o.customerId)
    if (prev == null || t < prev) {
      firstTime.set(o.customerId, t)
      firstSource.set(o.customerId, o.sourceName)
    }
  }
  if (firstSource.size === 0) {
    return [
      insufficient('acquisition.top_source_share', 'no Shopify source/UTM data on orders', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  const bySource = new Map<string, number>()
  let total = 0
  for (const o of ordersInWindow(ctx)) {
    const rev = netRevenue(o)
    if (rev <= 0 || !o.customerId) continue
    const src = firstSource.get(o.customerId)
    if (!src) continue
    total += rev
    bySource.set(src, (bySource.get(src) ?? 0) + rev)
  }
  if (total <= 0) {
    return [
      insufficient('acquisition.top_source_share', 'no source-attributable revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  const sorted = [...bySource.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  if (!top) {
    return [
      insufficient('acquisition.top_source_share', 'no source-attributable revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  return [
    metric('acquisition.source_count', sorted.length, { unit: 'count', window: win }),
    metric('acquisition.top_source_share', roundTo(top[1] / total, 4), {
      unit: 'ratio',
      window: win,
      valueJson: { source: top[0] },
    }),
  ]
}
