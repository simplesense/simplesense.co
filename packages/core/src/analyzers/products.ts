import type { Analyzer, Metric } from '../types'
import { ordersInWindow, windowLabel } from '../window'
import { metric, insufficient } from '../metrics'
import { roundTo, safeShare } from '../math'

/**
 * Product affinity / cross-sell: products frequently bought together in the same
 * order. Emits the top co-purchased pair and its support (order count).
 */
export const affinityAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const pairCounts = new Map<string, number>()
  for (const o of ordersInWindow(ctx)) {
    const ids = [...new Set(o.lineItems.map((li) => li.productId).filter((x): x is string => !!x))]
    ids.sort()
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }
  if (pairCounts.size === 0) {
    return [
      insufficient('affinity.top_pair_support', 'no multi-product orders in window', {
        unit: 'count',
        window: win,
      }),
    ]
  }
  const sorted = [...pairCounts.entries()].sort((a, b) => b[1] - a[1])
  const topEntry = sorted[0]
  if (!topEntry) {
    return [
      insufficient('affinity.top_pair_support', 'no co-purchase pairs', {
        unit: 'count',
        window: win,
      }),
    ]
  }
  const [topKey, topSupport] = topEntry
  const [a, b] = topKey.split('|')
  const title = (id?: string): string =>
    ctx.store.products.find((p) => p.id === id)?.title ?? id ?? 'unknown'
  return [
    metric('affinity.distinct_pairs', pairCounts.size, { unit: 'count', window: win }),
    metric('affinity.top_pair_support', topSupport, {
      unit: 'count',
      window: win,
      valueJson: { products: [a, b], titles: [title(a), title(b)] },
    }),
  ]
}

/**
 * Per-SKU true margin: line revenue (net of line discounts) minus cost of goods,
 * for SKUs where unit cost is known. Flags money-losing SKUs. If no cost data exists,
 * emits "insufficient" rather than guessing margin.
 */
export const skuMarginAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const costById = new Map<string, number>()
  for (const p of ctx.store.products) if (p.unitCost != null) costById.set(p.id, p.unitCost)

  if (costById.size === 0) {
    return [
      insufficient('sku_margin.gross_margin_rate', 'no product cost data; cannot compute margin', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }

  const revById = new Map<string, number>()
  const costAccById = new Map<string, number>()
  for (const o of ordersInWindow(ctx)) {
    for (const li of o.lineItems) {
      const pid = li.productId
      if (!pid || !costById.has(pid)) continue
      const lineRev = li.price * li.quantity - (li.discount ?? 0)
      const lineCost = (costById.get(pid) ?? 0) * li.quantity
      revById.set(pid, (revById.get(pid) ?? 0) + lineRev)
      costAccById.set(pid, (costAccById.get(pid) ?? 0) + lineCost)
    }
  }

  let totalRev = 0
  let totalMargin = 0
  let negativeCount = 0
  let worstId: string | null = null
  let worstMargin = Infinity
  for (const [pid, rev] of revById) {
    const cost = costAccById.get(pid) ?? 0
    const margin = rev - cost
    totalRev += rev
    totalMargin += margin
    if (margin < 0) negativeCount++
    if (margin < worstMargin) {
      worstMargin = margin
      worstId = pid
    }
  }

  if (totalRev <= 0) {
    return [
      insufficient('sku_margin.gross_margin_rate', 'no costed SKU sold in window', {
        unit: 'ratio',
        window: win,
      }),
    ]
  }

  const out: Metric[] = [
    metric('sku_margin.gross_margin_rate', roundTo(safeShare(totalMargin, totalRev) ?? 0, 4), {
      unit: 'ratio',
      window: win,
    }),
    metric('sku_margin.negative_margin_sku_count', negativeCount, { unit: 'count', window: win }),
  ]
  // Only surface a "worst SKU" when it is actually losing money — otherwise the mere
  // presence of the metric would read as a money-losing signal (Prime Directive #1).
  if (worstId && worstMargin < 0) {
    const worst = ctx.store.products.find((p) => p.id === worstId)
    out.push(
      metric('sku_margin.worst_sku_margin', roundTo(worstMargin, 2), {
        unit: 'USD',
        window: win,
        valueJson: { productId: worstId, title: worst?.title ?? worstId },
      }),
    )
  }
  return out
}
