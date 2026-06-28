import type { NormalizedStore } from './types'

/**
 * Grounded execution exports (§ "Export to Klaviyo" / "Export segments" / "Export CSV").
 * Pure functions over the NormalizedStore — the same data the analyzers see, so a segment
 * the app recommends is the exact segment the operator downloads. No estimates, no creds.
 */

export interface VipRow {
  customerId: string
  email: string
  city: string
  region: string
  country: string
  orders: number
  totalSpent: number
  firstOrderAt: string
}

export interface SkuRow {
  productId: string
  title: string
  type: string
  unitsSold: number
  grossRevenue: number
  unitCost: number | ''
  estimatedCost: number | ''
  grossProfit: number | ''
  marginRate: number | ''
}

const round2 = (n: number): number => Math.round(n * 100) / 100
const blank = (s: string | null | undefined): string => (s == null ? '' : s)
const netOf = (o: NormalizedStore['orders'][number]): number =>
  Math.max(0, o.totalPrice - (o.refundedAmount ?? 0))

/**
 * The top `topPct` of customers by net lifetime spend — the VIP segment behind the
 * Pareto/RFM moves. Ranked desc; guest/no-customer orders are excluded (can't segment them).
 * Default 0.2 (top 20%). Ties at the cutoff are kept (>= threshold), so the count can exceed
 * the exact percentile but never fabricates membership.
 */
export function buildVipSegment(store: NormalizedStore, topPct = 0.2): VipRow[] {
  const byCustomer = new Map<string, { spent: number; orders: number }>()
  for (const o of store.orders) {
    if (!o.customerId) continue
    const agg = byCustomer.get(o.customerId) ?? { spent: 0, orders: 0 }
    agg.spent += netOf(o)
    agg.orders += 1
    byCustomer.set(o.customerId, agg)
  }
  if (byCustomer.size === 0) return []

  const custById = new Map(store.customers.map((c) => [c.id, c]))
  const ranked = [...byCustomer.entries()]
    .map(([customerId, agg]) => ({ customerId, ...agg }))
    .sort((a, b) => b.spent - a.spent)

  const cutoffIndex = Math.max(1, Math.ceil(ranked.length * Math.min(1, Math.max(0, topPct))))
  const threshold = ranked[cutoffIndex - 1]?.spent ?? 0
  const top = ranked.filter((r, i) => i < cutoffIndex || r.spent >= threshold)

  return top.map((r) => {
    const c = custById.get(r.customerId)
    const addr = c?.defaultAddress
    return {
      customerId: r.customerId,
      email: blank(c?.email),
      city: blank(addr?.city),
      region: blank(addr?.region),
      country: blank(addr?.country),
      orders: r.orders,
      totalSpent: round2(r.spent),
      firstOrderAt: c?.firstOrderAt ? c.firstOrderAt.toISOString().slice(0, 10) : '',
    }
  })
}

/**
 * Per-SKU economics: units, gross revenue (net of line discounts), and — when unitCost is
 * known — estimated COGS, gross profit and margin rate. Margin fields are blank (never 0)
 * when cost is missing, honoring the grounding rule. Sorted by gross profit ascending so the
 * money-losing SKUs surface first (matches the margin moves).
 */
export function buildSkuEconomics(store: NormalizedStore): SkuRow[] {
  const agg = new Map<string, { units: number; revenue: number }>()
  for (const o of store.orders) {
    for (const li of o.lineItems) {
      if (!li.productId) continue
      const a = agg.get(li.productId) ?? { units: 0, revenue: 0 }
      a.units += li.quantity
      a.revenue += li.price * li.quantity - (li.discount ?? 0)
      agg.set(li.productId, a)
    }
  }

  const prodById = new Map(store.products.map((p) => [p.id, p]))
  const rows: SkuRow[] = []
  for (const [productId, a] of agg) {
    const p = prodById.get(productId)
    if (!p) continue
    const revenue = round2(a.revenue)
    const knownCost = p.unitCost != null
    const estimatedCost = knownCost ? round2(p.unitCost! * a.units) : ''
    const grossProfit = knownCost ? round2(revenue - (estimatedCost as number)) : ''
    const marginRate =
      knownCost && revenue !== 0 ? round2((grossProfit as number) / revenue) : knownCost ? 0 : ''
    rows.push({
      productId,
      title: p.title,
      type: blank(p.type),
      unitsSold: a.units,
      grossRevenue: revenue,
      unitCost: knownCost ? round2(p.unitCost!) : '',
      estimatedCost,
      grossProfit,
      marginRate,
    })
  }

  return rows.sort((x, y) => {
    const px = typeof x.grossProfit === 'number' ? x.grossProfit : Infinity
    const py = typeof y.grossProfit === 'number' ? y.grossProfit : Infinity
    if (px !== py) return px - py
    return y.grossRevenue - x.grossRevenue
  })
}

/** RFC-4180 CSV serializer: quotes any field containing a comma, quote, or newline. */
export function toCsv(headers: string[], rows: readonly object[]): string {
  const esc = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = headers.map(esc).join(',')
  const body = rows
    .map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(','))
    .join('\r\n')
  return body ? `${head}\r\n${body}\r\n` : `${head}\r\n`
}
