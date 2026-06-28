import type { Address, Customer, NormalizedStore, Order, Product } from '@ss/core'

/**
 * Deterministic demo store — "Wildflower Skincare", an omnichannel SF brand. Generated
 * relative to a passed `now` so it always sits inside the trailing window. Tuned to
 * surface the hero moves: VIP/Pareto concentration, geo (within-5mi → BOPIS), discount
 * dependency, an AOV/free-ship gap, and a money-losing SKU. This is fixture data, not a
 * real merchant — every number the engine shows still traces to these computed rows.
 */

const STORE = { lat: 37.7749, lng: -122.4194 } // San Francisco flagship
const DAY = 86_400_000

const PRODUCTS: Product[] = [
  { id: 'p1', title: 'Daily Hydrating Serum', type: 'Skincare', unitCost: 12 },
  { id: 'p2', title: 'Vitamin C Brightening Set', type: 'Skincare', unitCost: 18 },
  { id: 'p3', title: 'Overnight Repair Cream', type: 'Skincare', unitCost: 22 },
  { id: 'p4', title: 'Gentle Foaming Cleanser', type: 'Skincare', unitCost: 6 },
  { id: 'p5', title: 'Limited Holiday Bundle', type: 'Bundle', unitCost: 65 }, // loss leader
]

function nearAddr(i: number): Address {
  return {
    region: 'CA',
    city: 'San Francisco',
    zip: `941${String(10 + (i % 40)).padStart(2, '0')}`,
    lat: STORE.lat + ((i % 6) - 3) * 0.004, // within ~1 mile
    lng: STORE.lng + ((i % 5) - 2) * 0.004,
  }
}

function farAddr(i: number): Address {
  return {
    region: 'CA',
    city: 'Los Angeles',
    zip: `900${String(10 + (i % 40)).padStart(2, '0')}`,
    lat: 34.0522 + (i % 5) * 0.01, // ~350 mi from the SF store
    lng: -118.2437,
  }
}

export function makeSeedStore(now: Date): NormalizedStore {
  const customers: Customer[] = []
  const orders: Order[] = []
  let oid = 0

  const SOURCES = ['web', 'google', 'facebook', 'web', 'web', 'instagram']

  const addOrder = (
    cid: string,
    total: number,
    monthsAgo: number,
    addr: Address,
    pid: string,
    discounted: boolean,
  ) => {
    oid++
    const created = new Date(now.getTime() - monthsAgo * 30 * DAY - (oid % 24) * DAY)
    const discount = discounted ? Math.round(total * 0.15) : 0
    orders.push({
      id: `o${oid}`,
      customerId: cid,
      createdAt: created,
      totalPrice: total,
      discountTotal: discount,
      currency: 'USD',
      refundedAmount: 0,
      sourceName: SOURCES[oid % SOURCES.length] ?? 'web',
      shippingAddress: addr,
      lineItems: [{ productId: pid, quantity: 1, price: total, discount }],
    })
  }

  // 6 "whales" (near) — the top 20% that drives most revenue
  const whaleTotals = [3200, 2600, 2100, 1800, 1500, 1250]
  whaleTotals.forEach((tot, idx) => {
    const cid = `c${idx + 1}`
    customers.push({ id: cid })
    for (let k = 0; k < 4; k++) {
      addOrder(
        cid,
        Math.round(tot / 4),
        (idx % 12) + 1 + k,
        nearAddr(idx),
        `p${(idx % 4) + 1}`,
        (idx + k) % 2 === 0,
      )
    }
  })

  // 16 mid customers (near) — moderate spend, mixed repeat
  for (let i = 0; i < 16; i++) {
    const cid = `c${i + 7}`
    customers.push({ id: cid })
    const tot = 380 - i * 15
    const orderCount = (i % 3) + 1
    for (let k = 0; k < orderCount; k++) {
      addOrder(
        cid,
        Math.max(45, Math.round(tot / orderCount)),
        (i % 18) + 1,
        nearAddr(i + 6),
        `p${(i % 4) + 1}`,
        (i + k) % 2 === 0,
      )
    }
  }

  // 8 tail customers (far, Los Angeles) — small single orders
  for (let i = 0; i < 8; i++) {
    const cid = `c${i + 23}`
    customers.push({ id: cid })
    addOrder(
      cid,
      Math.max(40, 120 - i * 8),
      (i % 20) + 1,
      farAddr(i),
      `p${(i % 4) + 1}`,
      i % 3 === 0,
    )
  }

  // 5 explicit money-losing Holiday Bundle (p5) orders — sold under the $65 cost
  for (let i = 0; i < 5; i++) {
    const cid = `c${i + 1}` // whales also grabbed the loss-leader bundle
    addOrder(cid, 55, (i % 10) + 2, nearAddr(i), 'p5', true)
  }

  return {
    storeId: 'demo_wildflower',
    currency: 'USD',
    hasPhysicalLocations: true,
    locations: [
      {
        id: 'loc_sf',
        name: 'Wildflower SF Flagship',
        lat: STORE.lat,
        lng: STORE.lng,
        address: { region: 'CA', city: 'San Francisco' },
      },
    ],
    customers,
    products: PRODUCTS,
    orders,
    freeShippingThreshold: 75,
  }
}
