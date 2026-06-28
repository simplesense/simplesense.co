import type { Analyzer, Order } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { roundTo, safeShare } from '../math'

/**
 * The id of each customer's first-ever order across ALL store history. Identity (id),
 * not timestamp, so two orders sharing a truncated timestamp don't both count as "new".
 * Ties on time are broken by id for determinism.
 */
function firstOrderIds(allOrders: Order[]): Set<string> {
  const best = new Map<string, { t: number; id: string }>()
  for (const o of allOrders) {
    if (!o.customerId) continue
    const t = o.createdAt.getTime()
    const cur = best.get(o.customerId)
    if (!cur || t < cur.t || (t === cur.t && o.id < cur.id)) best.set(o.customerId, { t, id: o.id })
  }
  return new Set([...best.values()].map((v) => v.id))
}

/**
 * New vs returning revenue mix over the window. An order is "new" when it is the
 * customer's first-ever order (all-time), else "returning". Guest/anonymous orders
 * (no customerId) carry no identity and are excluded from both buckets — surfaced as a
 * separate guest share rather than silently counted as returning.
 */
export const newVsReturningAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const firsts = firstOrderIds(ctx.store.orders)
  const orders = ordersInWindow(ctx)
  let newRev = 0
  let retRev = 0
  let guestRev = 0
  let newOrders = 0
  let retOrders = 0
  for (const o of orders) {
    const rev = netRevenue(o)
    if (rev <= 0) continue
    if (!o.customerId) {
      guestRev += rev
      continue
    }
    if (firsts.has(o.id)) {
      newRev += rev
      newOrders++
    } else {
      retRev += rev
      retOrders++
    }
  }
  const identified = newRev + retRev
  if (identified <= 0) {
    return [
      insufficient('mix.new_revenue_share', 'no identified-customer revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  const out = [
    metric('mix.new_revenue_share', roundTo(safeShare(newRev, identified) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('mix.returning_revenue_share', roundTo(safeShare(retRev, identified) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('mix.new_order_count', newOrders, { unit: 'count', window: win }),
    metric('mix.returning_order_count', retOrders, { unit: 'count', window: win }),
  ]
  if (guestRev > 0) {
    out.push(
      metric('mix.guest_revenue_share', roundTo(guestRev / (identified + guestRev), 4), {
        unit: 'ratio',
        window: win,
      }),
    )
  }
  return out
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
