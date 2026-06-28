import type { Analyzer, Metric, Order } from '../types'
import { ordersInWindow, windowLabel, windowBounds, netRevenue } from '../window'
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

  // High-value = the top 20% of customers by spend, chosen as DISTINCT customers with a
  // deterministic id tiebreak (so ties don't push >20% over the line).
  const entries = [...byCustomer.entries()].map(([id, os]) => ({
    id,
    freq: os.length,
    spend: os.reduce((s, o) => s + netRevenue(o), 0),
    last: os[os.length - 1],
  }))
  const highValueCount = Math.max(1, Math.ceil(n * 0.2))
  const highValueIds = new Set(
    [...entries]
      .sort((a, b) => b.spend - a.spend || (a.id < b.id ? -1 : 1))
      .slice(0, highValueCount)
      .filter((e) => e.spend > 0)
      .map((e) => e.id),
  )

  let oneTime = 0
  let repeat = 0
  let loyal = 0
  let active = 0
  let lapsing = 0
  let dormant = 0
  let champions = 0
  let atRisk = 0

  for (const e of entries) {
    const recencyDays = e.last
      ? (ctx.now.getTime() - e.last.createdAt.getTime()) / DAY_MS
      : Infinity
    if (e.freq <= 1) oneTime++
    else if (e.freq <= 3) repeat++
    else loyal++

    const isActive = recencyDays <= 90
    if (isActive) active++
    else if (recencyDays <= 180) lapsing++
    else dormant++

    if (e.freq >= 4 && isActive && highValueIds.has(e.id)) champions++
    if (e.freq >= 2 && recencyDays > 180) atRisk++
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
 * Cohort retention / repeat-purchase. `window_customer_count` is everyone who ordered
 * in the window; `new_customer_count` is the true first-purchase cohort (first-ever
 * order falls inside the window). Repeat rate, 2nd→3rd conversion and median
 * time-to-second are over the window; 2nd→3rd is "insufficient" (not a fake 0) when no
 * one has reordered.
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

  // true new-customer cohort: first-ever order (all store history) inside the window
  const { start, end } = windowBounds(ctx)
  const firstEver = new Map<string, number>()
  for (const o of ctx.store.orders) {
    if (!o.customerId) continue
    const t = o.createdAt.getTime()
    const prev = firstEver.get(o.customerId)
    if (prev == null || t < prev) firstEver.set(o.customerId, t)
  }
  let newCohort = 0
  for (const t of firstEver.values()) if (t >= start.getTime() && t <= end.getTime()) newCohort++

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

  const s2t3 = safeShare(withThree, withTwo)
  const out: Metric[] = [
    metric('cohort.window_customer_count', n, { unit: 'count', window: win }),
    metric('cohort.new_customer_count', newCohort, { unit: 'count', window: win }),
    metric('cohort.repeat_purchase_rate', roundTo(safeShare(withTwo, n) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    s2t3 == null
      ? insufficient('cohort.second_to_third_conversion', 'no customers with two or more orders', {
          unit: 'ratio',
          window: win,
        })
      : metric('cohort.second_to_third_conversion', roundTo(s2t3, 4), {
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
  // (customerId|productId) -> purchase dates
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
  let reorderedPairs = 0
  for (const dates of seq.values()) {
    if (dates.length < 2) continue
    reorderedPairs++
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
    metric('replenishment.reordered_pair_count', reorderedPairs, { unit: 'count', window: win }),
    metric('replenishment.reorder_interval_count', intervals.length, {
      unit: 'count',
      window: win,
    }),
  ]
}
