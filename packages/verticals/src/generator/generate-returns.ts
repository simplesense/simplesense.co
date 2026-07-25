import type { NormalizedOrder, NormalizedReturn, OrderLineItem } from '@ss/csv-ingest'
import type { DemoStoreParams } from '../types'

const DAY_MS = 86_400_000
const WINDOW_YEARS = 2
const BASE_RETURN_RATE = 0.12 // editorial "normal customer" return rate, distinct from the abuse cohort's

/**
 * Generates synthetic order/return data in `@ss/csv-ingest`'s real normalized shape —
 * the same types M5 ReturnLens's `analyzeReturns()` consumes — so the apparel page's
 * abuse-cohort/bracketing metrics are computed by the actual, already-tested M5
 * pipeline, not new bespoke math. Requires `params.abusePatternSeed`.
 */
export function generateReturnsData(
  params: DemoStoreParams,
  now: Date,
): { orders: NormalizedOrder[]; returns: NormalizedReturn[] } {
  const seed = params.abusePatternSeed
  if (!seed) throw new Error('generateReturnsData requires params.abusePatternSeed')

  const windowOrderCount = Math.round(params.ordersPerYear * WINDOW_YEARS)
  const customerCount = Math.max(20, Math.round(windowOrderCount / 2.2))
  const abuseCustomerCount = Math.max(1, Math.round(customerCount * seed.abuseCustomerSharePct))

  const orders: NormalizedOrder[] = []
  const returns: NormalizedReturn[] = []
  let orderSeq = 0

  const nonBracketSkus = params.skuTree.filter(
    (s) => !seed.bracketingStyleSkuNames.includes(s.name),
  )

  const addOrder = (
    email: string,
    daysAgo: number,
    lineItems: OrderLineItem[],
  ): NormalizedOrder => {
    orderSeq++
    const createdAt = new Date(now.getTime() - daysAgo * DAY_MS).toISOString()
    const total = Math.round(lineItems.reduce((s, li) => s + li.price * li.quantity, 0) * 100) / 100
    const order: NormalizedOrder = {
      orderName: `#${5000 + orderSeq}`,
      email,
      createdAt,
      financialStatus: 'paid',
      total,
      refundedAmount: 0,
      lineItems,
      shippingAddressKey: null,
    }
    orders.push(order)
    return order
  }

  const addReturn = (
    order: NormalizedOrder,
    li: OrderLineItem,
    daysAfterOrder: number,
    reason: string,
  ) => {
    const orderedAt = Date.parse(order.createdAt)
    const createdAt = new Date(orderedAt + daysAfterOrder * DAY_MS).toISOString()
    returns.push({
      orderName: order.orderName,
      email: order.email,
      sku: li.sku,
      quantity: li.quantity,
      reason,
      status: 'CLOSED',
      refundAmount: Math.round(li.price * li.quantity * 100) / 100,
      createdAt,
      processedAt: null,
    })
  }

  // --- Abuse cohort: serial refunders, 3-5 orders each, ~75% returned. ---
  for (let a = 0; a < abuseCustomerCount; a++) {
    const email = `abuse${a}@example.com`
    const orderCount = 3 + (a % 3) // 3,4,5
    for (let k = 0; k < orderCount; k++) {
      orderSeq++
      const sku = nonBracketSkus[orderSeq % nonBracketSkus.length]!
      const skuId = `sku_${params.skuTree.indexOf(sku)}`
      // +25 floor: comfortably exceeds the max return offset below (8 + 4 = 12) so no
      // return date can land after "now" — a real bug the tests caught (see LEDGER.md).
      const daysAgo = ((a * 13 + k * 61) % (WINDOW_YEARS * 365 - 25)) + 25
      const li: OrderLineItem = { sku: skuId, name: sku.name, quantity: 1, price: sku.unitPrice }
      const order = addOrder(email, daysAgo, [li])
      // ~75% of this cohort's orders get returned (deterministic pattern).
      if (k % 4 !== 3) {
        addReturn(order, li, 8 + (k % 5), 'OTHER')
      }
    }
  }

  // --- Bracketing cohort: same customers buy 2-3 sizes of the seeded style, return most. ---
  const bracketOrderCount = Math.max(5, Math.round(customerCount * 0.04))
  for (let b = 0; b < bracketOrderCount; b++) {
    orderSeq++
    const email = `bracket${b}@example.com`
    const sizes: OrderLineItem[] = seed.bracketingStyleSkuNames.map((name, i) => {
      const sku = params.skuTree.find((s) => s.name === name)!
      const skuId = `sku_${params.skuTree.indexOf(sku)}`
      return { sku: `${skuId}_sz${i}`, name, quantity: 1, price: sku.unitPrice }
    })
    // +20 floor: comfortably exceeds the max return offset below (6 + 1 = 7).
    const daysAgo = ((b * 29) % (WINDOW_YEARS * 365 - 20)) + 20
    const order = addOrder(email, daysAgo, sizes)
    // Keep exactly one size, return the rest.
    sizes
      .slice(0, -1)
      .forEach((li, i) =>
        addReturn(order, li, 6 + i, i % 2 === 0 ? 'SIZE_TOO_LARGE' : 'SIZE_TOO_SMALL'),
      )
  }

  // --- Normal cohort: everyone else, base return rate, no bracketing. ---
  const normalCustomerCount = customerCount - abuseCustomerCount - bracketOrderCount
  for (let n = 0; n < normalCustomerCount; n++) {
    orderSeq++
    const email = `cust${n}@example.com`
    const sku = params.skuTree[orderSeq % params.skuTree.length]!
    const skuId = `sku_${params.skuTree.indexOf(sku)}`
    // +15 floor: comfortably exceeds the max return offset below (5 + 5 = 10).
    const daysAgo = ((n * 17) % (WINDOW_YEARS * 365 - 15)) + 15
    const li: OrderLineItem = { sku: skuId, name: sku.name, quantity: 1, price: sku.unitPrice }
    const order = addOrder(email, daysAgo, [li])
    if ((n % 1000) / 1000 < BASE_RETURN_RATE) {
      addReturn(order, li, 5 + (n % 6), 'DEFECTIVE')
    }
  }

  return { orders, returns }
}
