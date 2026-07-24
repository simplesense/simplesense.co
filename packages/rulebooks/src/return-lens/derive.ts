import type { NormalizedOrder, NormalizedReturn } from '@ss/csv-ingest'
import type {
  BracketingCandidate,
  EntitySummary,
  ReturnsSnapshot,
  SkuReturnSummary,
  WardrobingStats,
} from './types'

const MIN_ORDERS_FOR_COHORT_BASELINE = 2
const WEAR_WINDOW_MIN_DAYS = 5
const WEAR_WINDOW_MAX_DAYS = 21

/** Minimal union-find so an order's email and shipping address are treated as the same identity. */
class UnionFind {
  private parent = new Map<string, string>()
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let root = x
    while (this.parent.get(root) !== root) root = this.parent.get(root)!
    let cur = x
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur)!
      this.parent.set(cur, root)
      cur = next
    }
    return root
  }
  union(a: string, b: string): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }
}

/**
 * Strips common size/variant tokens from a line-item name to approximate its "base
 * style" for bracketing detection (v0 heuristic, not a real product taxonomy —
 * documented as such in the rule's citation). e.g. "Wool Coat - Medium" -> "wool coat".
 */
function baseStyle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[-/]\s*(x?small|x?large|small|medium|large|xs|s|m|l|xl|xxl|\d{1,2})\s*$/i, '')
    .trim()
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best: string | null = null
  let bestCount = 0
  for (const [v, count] of counts) {
    if (count > bestCount) {
      best = v
      bestCount = count
    }
  }
  return best
}

/** Turns raw parsed orders/returns into the pre-aggregated snapshot every M5 rule reads. */
export function analyzeReturns(
  orders: NormalizedOrder[],
  returns: NormalizedReturn[],
  windowDays: number,
): ReturnsSnapshot {
  // --- Entity resolution: union an order's email with its shipping-address key. ---
  const uf = new UnionFind()
  for (const o of orders) {
    const emailToken = o.email ? `email:${o.email}` : null
    const addrToken = o.shippingAddressKey ? `addr:${o.shippingAddressKey}` : null
    if (emailToken && addrToken) uf.union(emailToken, addrToken)
    else if (emailToken) uf.find(emailToken)
    else if (addrToken) uf.find(addrToken)
  }

  const returnedOrderNames = new Set(returns.map((r) => r.orderName))
  const refundByOrderName = new Map<string, number>()
  for (const r of returns) {
    refundByOrderName.set(r.orderName, (refundByOrderName.get(r.orderName) ?? 0) + r.refundAmount)
  }

  interface Bucket {
    emails: Set<string>
    orderNames: Set<string>
    returnedOrderNames: Set<string>
    refundTotal: number
  }
  const buckets = new Map<string, Bucket>()
  for (const o of orders) {
    const emailToken = o.email ? `email:${o.email}` : null
    const addrToken = o.shippingAddressKey ? `addr:${o.shippingAddressKey}` : null
    const token = emailToken ?? addrToken
    if (!token) continue // no identity signal at all — excluded from entity resolution
    const root = uf.find(token)
    let bucket = buckets.get(root)
    if (!bucket) {
      bucket = {
        emails: new Set(),
        orderNames: new Set(),
        returnedOrderNames: new Set(),
        refundTotal: 0,
      }
      buckets.set(root, bucket)
    }
    if (o.email) bucket.emails.add(o.email)
    bucket.orderNames.add(o.orderName)
    if (returnedOrderNames.has(o.orderName)) bucket.returnedOrderNames.add(o.orderName)
    bucket.refundTotal += refundByOrderName.get(o.orderName) ?? 0
  }

  const entities: EntitySummary[] = [...buckets.entries()].map(([key, b]) => ({
    key,
    emails: [...b.emails],
    spansMultipleEmails: b.emails.size >= 2,
    orderCount: b.orderNames.size,
    returnedOrderCount: b.returnedOrderNames.size,
    returnRate: b.orderNames.size > 0 ? b.returnedOrderNames.size / b.orderNames.size : 0,
    refundTotal: Math.round(b.refundTotal * 100) / 100,
  }))

  const baselineEntities = entities.filter((e) => e.orderCount >= MIN_ORDERS_FOR_COHORT_BASELINE)
  const cohortAvgReturnRate =
    baselineEntities.length > 0
      ? baselineEntities.reduce((sum, e) => sum + e.returnRate, 0) / baselineEntities.length
      : null

  // --- Per-SKU return stats. ---
  const orderedBySku = new Map<string, number>()
  for (const o of orders) {
    for (const li of o.lineItems) {
      const sku = li.sku ?? li.name
      orderedBySku.set(sku, (orderedBySku.get(sku) ?? 0) + li.quantity)
    }
  }
  const returnedBySku = new Map<string, number>()
  const reasonsBySku = new Map<string, string[]>()
  for (const r of returns) {
    const sku = r.sku ?? '(unknown sku)'
    returnedBySku.set(sku, (returnedBySku.get(sku) ?? 0) + r.quantity)
    if (r.reason) reasonsBySku.set(sku, [...(reasonsBySku.get(sku) ?? []), r.reason])
  }
  const skuStats: SkuReturnSummary[] = [...returnedBySku.entries()].map(
    ([sku, returnedQuantity]) => {
      const orderedQuantity = orderedBySku.get(sku) ?? 0
      return {
        sku,
        orderedQuantity,
        returnedQuantity,
        returnRate: orderedQuantity > 0 ? returnedQuantity / orderedQuantity : 0,
        dominantReason: mostCommon(reasonsBySku.get(sku) ?? []),
      }
    },
  )

  // --- Bracketing: multi-variant orders of the same base style, mostly returned. ---
  const returnedSkusByOrder = new Map<string, Set<string>>()
  for (const r of returns) {
    const sku = r.sku ?? '(unknown sku)'
    const set = returnedSkusByOrder.get(r.orderName) ?? new Set<string>()
    set.add(sku)
    returnedSkusByOrder.set(r.orderName, set)
  }
  const bracketingCandidates: BracketingCandidate[] = []
  for (const o of orders) {
    const byStyle = new Map<string, { sku: string; name: string }[]>()
    for (const li of o.lineItems) {
      const style = baseStyle(li.name)
      byStyle.set(style, [...(byStyle.get(style) ?? []), { sku: li.sku ?? li.name, name: li.name }])
    }
    const returnedSkus = returnedSkusByOrder.get(o.orderName) ?? new Set<string>()
    for (const [style, variants] of byStyle) {
      if (variants.length < 2) continue
      const variantsReturned = variants.filter((v) => returnedSkus.has(v.sku)).length
      if (variantsReturned >= 2) {
        bracketingCandidates.push({
          orderName: o.orderName,
          baseStyle: style,
          variantsOrdered: variants.length,
          variantsReturned,
        })
      }
    }
  }

  // --- Wardrobing: share of returns filed within the "wear window" of their order date. ---
  const orderCreatedAt = new Map(orders.map((o) => [o.orderName, o.createdAt]))
  let wearWindowReturns = 0
  for (const r of returns) {
    const orderedAt = orderCreatedAt.get(r.orderName)
    if (!orderedAt) continue
    const days = daysBetween(orderedAt, r.createdAt)
    if (days >= WEAR_WINDOW_MIN_DAYS && days <= WEAR_WINDOW_MAX_DAYS) wearWindowReturns += 1
  }
  const wardrobing: WardrobingStats = {
    totalReturns: returns.length,
    wearWindowReturns,
    wearWindowSharePct:
      returns.length > 0 ? Math.round((wearWindowReturns / returns.length) * 1000) / 10 : null,
  }

  return {
    windowDays,
    orderCount: orders.length,
    returnCount: returns.length,
    entities,
    cohortAvgReturnRate,
    skuStats,
    bracketingCandidates,
    wardrobing,
  }
}
