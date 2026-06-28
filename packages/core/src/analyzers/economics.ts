import type { Analyzer, Metric } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { sum, roundTo, safeShare } from '../math'

/**
 * Discount dependency: share of orders and revenue tied to discount codes, plus the
 * average discount rate — a margin-risk signal.
 */
export const discountAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  if (orders.length === 0) {
    return [
      insufficient('discount.revenue_share_discounted', 'no orders in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  let discountedOrders = 0
  let discountedRev = 0
  let totalRev = 0
  let totalPaid = 0
  let totalDiscount = 0
  for (const o of orders) {
    const rev = netRevenue(o)
    totalRev += rev
    totalPaid += o.totalPrice
    totalDiscount += o.discountTotal
    if (o.discountTotal > 0) {
      discountedOrders++
      discountedRev += rev
    }
  }
  const preDiscount = totalPaid + totalDiscount
  const revShare = safeShare(discountedRev, totalRev)
  return [
    metric(
      'discount.order_share_discounted',
      roundTo(safeShare(discountedOrders, orders.length) ?? 0, 4),
      {
        unit: 'ratio',
        window: win,
      },
    ),
    revShare == null
      ? insufficient('discount.revenue_share_discounted', 'net revenue in window is zero', {
          unit: 'ratio',
          window: win,
        })
      : metric('discount.revenue_share_discounted', roundTo(revShare, 4), {
          unit: 'ratio',
          window: win,
        }),
    metric('discount.avg_discount_rate', roundTo(safeShare(totalDiscount, preDiscount) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
  ]
}

/**
 * Returns analysis: value-based return rate over the window. A 0 with "no refunds
 * recorded" is a real measurement, distinct from insufficient data.
 */
export const returnsAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  if (orders.length === 0) {
    return [
      insufficient('returns.rate_overall', 'no orders in window', { unit: 'ratio', window: win }),
    ]
  }
  const refunded = sum(orders.map((o) => o.refundedAmount ?? 0))
  const gross = sum(orders.map((o) => o.totalPrice))
  const rate = safeShare(refunded, gross)
  if (rate == null) {
    return [
      insufficient('returns.rate_overall', 'no gross revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }
  return [
    metric('returns.rate_overall', roundTo(rate, 4), {
      unit: 'ratio',
      window: win,
      note: refunded === 0 ? 'no refunds recorded in window' : undefined,
    }),
  ]
}

/**
 * AOV and free-shipping-threshold gap. Flags whether the configured free-ship
 * threshold sits below / at / above AOV (an AOV-lift opportunity when below).
 */
export const aovFreeshipAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  if (orders.length === 0) {
    return [insufficient('aov.value', 'no orders in window', { unit: 'USD/order', window: win })]
  }
  const aov = sum(orders.map((o) => o.totalPrice)) / orders.length
  const out: Metric[] = [metric('aov.value', roundTo(aov, 2), { unit: 'USD/order', window: win })]

  const threshold = ctx.store.freeShippingThreshold
  if (threshold == null) {
    out.push(
      insufficient('aov.freeship_gap', 'no free-shipping threshold configured', {
        unit: 'USD',
        window: win,
      }),
    )
  } else {
    const position = threshold < aov ? 'below' : threshold > aov ? 'above' : 'at'
    out.push(metric('aov.freeship_threshold', roundTo(threshold, 2), { unit: 'USD', window: win }))
    out.push(
      metric('aov.freeship_gap', roundTo(threshold - aov, 2), {
        unit: 'USD',
        window: win,
        valueJson: { position, aov: roundTo(aov, 2) },
      }),
    )
  }
  return out
}
