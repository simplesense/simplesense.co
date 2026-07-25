import type { Address, Customer, NormalizedStore, Order, Product } from '@ss/core'
import type { DemoStoreParams } from '../types'

const DAY_MS = 86_400_000
/** Average orders per "repeat" customer in the trailing window — an editorial constant
 *  used only to size the synthetic customer base; the actual repeat-purchase rate a
 *  real analyzer computes on the resulting orders is what gets shown/verified (see
 *  fixtures/verticals's hand-derivation), never assumed to equal this input exactly. */
const AVG_REPEAT_ORDERS = 2.7
const WINDOW_YEARS = 2

/**
 * Turns editorial `DemoStoreParams` (anchored to cited category benchmarks — see
 * configs/*.ts) into a synthetic `NormalizedStore` for `@ss/core`'s real analyzers to
 * run on. Deterministic (index-based variance, no `Math.random`/`Date.now`) so the
 * resulting numbers are hand-verifiable and stable across rebuilds — `now` is always
 * injected, never read live.
 */
export function generateStore(params: DemoStoreParams, now: Date): NormalizedStore {
  const aov = params.annualRevenue / params.ordersPerYear
  const windowOrderCount = Math.round(params.ordersPerYear * WINDOW_YEARS)

  const avgOrdersPerCustomer =
    (1 - params.repeatPurchaseRate) * 1 + params.repeatPurchaseRate * AVG_REPEAT_ORDERS
  const customerCount = Math.max(10, Math.round(windowOrderCount / avgOrdersPerCustomer))
  const repeatCount = Math.round(customerCount * params.repeatPurchaseRate)

  const products: Product[] = params.skuTree.map((sku, i) => ({
    id: `sku_${i}`,
    title: sku.name,
    type: sku.category,
    unitCost: Math.round(sku.unitPrice * 0.4 * 100) / 100, // editorial ~40% COGS assumption
  }))

  const locationAddrFor = (customerIdx: number): { addr: Address; locIdx: number } => {
    // Deterministic weighted assignment: walk cumulative shareOfRevenue buckets.
    const t = (customerIdx % 997) / 997 // stable pseudo-uniform in [0,1)
    let acc = 0
    for (let i = 0; i < params.locations.length; i++) {
      acc += params.locations[i]!.shareOfRevenue
      if (t < acc) {
        const loc = params.locations[i]!
        return {
          locIdx: i,
          addr: {
            city: loc.city,
            region: loc.region,
            lat: loc.lat + ((customerIdx % 7) - 3) * 0.006,
            lng: loc.lng + ((customerIdx % 5) - 2) * 0.006,
            zip: `${10000 + (customerIdx % 500)}`,
          },
        }
      }
    }
    const last = params.locations[params.locations.length - 1]!
    return {
      locIdx: params.locations.length - 1,
      addr: { city: last.city, region: last.region, lat: last.lat, lng: last.lng, zip: '00000' },
    }
  }

  const customers: Customer[] = []
  const orders: Order[] = []
  let orderSeq = 0
  const repeatCycle = [2, 3, 2, 4, 3] // avg 2.8, close to AVG_REPEAT_ORDERS; exact resulting rate is what gets verified

  for (let c = 0; c < customerCount; c++) {
    const cid = `c${c}`
    customers.push({ id: cid })
    const isRepeat = c < repeatCount
    const orderCount = isRepeat ? repeatCycle[c % repeatCycle.length]! : 1
    const { addr } = locationAddrFor(c)
    for (let k = 0; k < orderCount; k++) {
      orderSeq++
      // Spread across the trailing window, newest orders for lower k (most-recent first per customer).
      const daysAgo = Math.round(((orderSeq * 37) % (WINDOW_YEARS * 365)) + k * 40)
      const created = new Date(now.getTime() - daysAgo * DAY_MS)
      const sku = params.skuTree[orderSeq % params.skuTree.length]!
      const skuIdx = orderSeq % params.skuTree.length
      const price = Math.round(sku.unitPrice * (0.85 + (orderSeq % 5) * 0.075) * 100) / 100
      const isDiscounted = (orderSeq % 100) / 100 < params.discountedRevenueShare
      const discount = isDiscounted ? Math.round(price * params.avgDiscountRate * 100) / 100 : 0
      const isReturned = (orderSeq % 1000) / 1000 < params.returnRate
      const refunded = isReturned ? Math.round((price - discount) * 100) / 100 : 0
      orders.push({
        id: `o${orderSeq}`,
        customerId: cid,
        createdAt: created,
        totalPrice: Math.max(1, Math.round((price - discount) * 100) / 100),
        discountTotal: discount,
        currency: 'USD',
        refundedAmount: refunded,
        sourceName: 'web',
        shippingAddress: addr,
        lineItems: [{ productId: `sku_${skuIdx}`, quantity: 1, price, discount }],
      })
    }
  }

  return {
    storeId: `demo_${params.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    currency: 'USD',
    hasPhysicalLocations: params.hasPhysicalLocations,
    locations: params.locations.map((l, i) => ({
      id: `loc_${i}`,
      name: `${params.storeName} — ${l.city}`,
      lat: l.lat,
      lng: l.lng,
      address: { city: l.city, region: l.region },
    })),
    customers,
    products,
    orders,
    freeShippingThreshold: Math.round(aov * 1.1),
  }
}
