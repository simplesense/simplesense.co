import type { Analyzer, Metric, Order } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { roundTo, safeShare, median } from '../math'

const DAY_MS = 1000 * 60 * 60 * 24

/** Group a customer's window orders by customerId, each sorted ascending by date. */
function ordersByCustomer(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>()
  for (const o of orders) {
    if (!o.customerId) continue
    const list = map.get(o.customerId)
    if (list) list.push(o)
    else map.set(o.customerId, [o])
  }
  for (const list of map.values())
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  return map
}

/**
 * RFM-style segmentation by frequency × recency × monetary, using explicit, testable
 * bands rather than data-dependent quintiles (deterministic for small stores).
 */
export const rfmAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const byCustomer = ordersByCustomer(ordersInWindow(ctx))
  const n = byCustomer.size
  if (n === 0) {
    return [
      insufficient('rfm.customer_count', 'no customers with orders in window', {
        unit: 'count',
        window: win,
      }),
    ]
  }

  // monetary high-value threshold = top 20% by spend
  const spends = [...byCustomer.values()].map((os) => os.reduce((s, o) => s + netRevenue(o), 0))
  const highValueCount = Math.max(1, Math.ceil(n * 0.2))
  const highValueFloor = [...spends].sort((a, b) => b - a)[highValueCount - 1] ?? 0

  let oneTime = 0
  let repeat = 0
  let loyal = 0
  let active = 0
  let lapsing = 0
  let dormant = 0
  let champions = 0
  let atRisk = 0

  for (const orders of byCustomer.values()) {
    const freq = orders.length
    const spend = orders.reduce((s, o) => s + netRevenue(o), 0)
    const last = orders[orders.length - 1]
    const recencyDays = last ? (ctx.now.getTime() - last.createdAt.getTime()) / DAY_MS : Infinity
    const highValue = spend >= highValueFloor && spend > 0

    if (freq <= 1) oneTime++
    else if (freq <= 3) repeat++
    else loyal++

    const isActive = recencyDays <= 90
    const isLapsing = recencyDays > 90 && recencyDays <= 180
    if (isActive) active++
    else if (isLapsing) lapsing++
    else dormant++

    if (freq >= 4 && isActive && highValue) champions++
    if (freq >= 2 && recencyDays > 180) atRisk++
  }

  return [
    metric('rfm.customer_count', n, { unit: 'count', window: win }),
    metric('rfm.one_time_count', oneTime, { unit: 'count', window: win }),
    metric('rfm.repeat_count', repeat, { unit: 'count', window: win }),
    metric('rfm.loyal_count', loyal, { unit: 'count', window: win }),
    metric('rfm.active_count', active, { unit: 'count', window: win }),
    metric('rfm.lapsing_count', lapsing, { unit: 'count', window: win }),
    metric('rfm.dormant_count', dormant, { unit: 'count', window: win }),
    metric('rfm.champions_count', champions, { unit: 'count', window: win }),
    metric('rfm.at_risk_count', atRisk, { unit: 'count', window: win }),
  ]
}

/**
 * Cohort retention / repeat-purchase: repeat rate, median time-to-second-order, and
 * 2nd→3rd-order conversion (all over the window).
 */
export const cohortAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const byCustomer = ordersByCustomer(ordersInWindow(ctx))
  const n = byCustomer.size
  if (n === 0) {
    return [
      insufficient('cohort.repeat_purchase_rate', 'no customers with orders in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }

  let withTwo = 0
  let withThree = 0
  const timeToSecond: number[] = []
  for (const orders of byCustomer.values()) {
    if (orders.length >= 2) {
      withTwo++
      const first = orders[0]
      const second = orders[1]
      if (first && second) {
        timeToSecond.push((second.createdAt.getTime() - first.createdAt.getTime()) / DAY_MS)
      }
    }
    if (orders.length >= 3) withThree++
  }

  const out: Metric[] = [
    metric('cohort.new_customers_count', n, { unit: 'count', window: win }),
    metric('cohort.repeat_purchase_rate', roundTo(safeShare(withTwo, n) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('cohort.second_to_third_conversion', roundTo(safeShare(withThree, withTwo) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
  ]
  const t2 = median(timeToSecond)
  out.push(
    t2 == null
      ? insufficient('cohort.time_to_second_order_median_days', 'no repeat purchasers', {
          unit: 'days',
          window: win,
        })
      : metric('cohort.time_to_second_order_median_days', roundTo(t2, 1), {
          unit: 'days',
          window: win,
        }),
  )
  return out
}

/**
 * Replenishment cadence: for SKUs the same customer buys more than once, the median
 * gap between reorders — so reminder timing can be aligned to it.
 */
export const replenishmentAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  // (customerId|productId) -> sorted purchase dates
  const seq = new Map<string, number[]>()
  for (const o of orders) {
    if (!o.customerId) continue
    for (const li of o.lineItems) {
      if (!li.productId) continue
      const k = `${o.customerId}|${li.productId}`
      const arr = seq.get(k)
      if (arr) arr.push(o.createdAt.getTime())
      else seq.set(k, [o.createdAt.getTime()])
    }
  }
  const intervals: number[] = []
  for (const dates of seq.values()) {
    if (dates.length < 2) continue
    dates.sort((a, b) => a - b)
    for (let i = 1; i < dates.length; i++) {
      intervals.push(((dates[i] as number) - (dates[i - 1] as number)) / DAY_MS)
    }
  }
  const med = median(intervals)
  if (med == null) {
    return [
      insufficient(
        'replenishment.median_reorder_interval_days',
        'no SKU was reordered by the same customer in the window',
        { unit: 'days', window: win },
      ),
    ]
  }
  return [
    metric('replenishment.median_reorder_interval_days', roundTo(med, 1), {
      unit: 'days',
      window: win,
    }),
    metric('replenishment.reordered_pair_count', intervals.length, { unit: 'count', window: win }),
  ]
}
