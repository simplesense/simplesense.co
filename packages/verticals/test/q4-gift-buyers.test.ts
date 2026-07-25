import { describe, it, expect } from 'vitest'
import { computeQ4GiftBuyerStats } from '../src/compute/q4-gift-buyers'
import type { NormalizedStore, Order } from '@ss/core'

const NOW = new Date('2026-07-25T00:00:00Z') // most recent COMPLETED Q4 is Oct-Dec 2025

function order(id: string, customerId: string, createdAt: string): Order {
  return {
    id,
    customerId,
    createdAt: new Date(createdAt),
    totalPrice: 40,
    discountTotal: 0,
    currency: 'USD',
    lineItems: [{ productId: 'p1', quantity: 1, price: 40 }],
  }
}

function store(orders: Order[]): NormalizedStore {
  return {
    storeId: 's1',
    currency: 'USD',
    hasPhysicalLocations: false,
    locations: [],
    customers: [],
    products: [],
    orders,
  }
}

describe('computeQ4GiftBuyerStats', () => {
  it('counts a Q4-only order as a one-time gift buyer', () => {
    const s = store([
      order('o1', 'c1', '2025-11-15T00:00:00Z'), // Q4-only -> one-time
      order('o2', 'c2', '2025-12-01T00:00:00Z'), // Q4 order...
      order('o3', 'c2', '2026-01-10T00:00:00Z'), // ...plus a January repeat -> NOT one-time
      order('o4', 'c3', '2025-09-15T00:00:00Z'), // pre-Q4 order...
      order('o5', 'c3', '2025-11-01T00:00:00Z'), // ...plus a Q4 order -> NOT one-time
      order('o6', 'c4', '2026-03-01T00:00:00Z'), // not in Q4 at all -> excluded
    ])
    const result = computeQ4GiftBuyerStats(s, NOW)
    // Q4 buyers: c1, c2, c3 = 3. One-time among them: only c1 = 1.
    expect(result.q4OneTimeBuyerCount).toBe(1)
    expect(result.giftBuyerOneTimePct).toBe(33.3)
  })

  it('returns 0% when there are no Q4 buyers', () => {
    const s = store([order('o1', 'c1', '2026-03-01T00:00:00Z')])
    const result = computeQ4GiftBuyerStats(s, NOW)
    expect(result.q4OneTimeBuyerCount).toBe(0)
    expect(result.giftBuyerOneTimePct).toBe(0)
  })

  it('excludes orders in the current, not-yet-completed Q4', () => {
    // now is July 2026 — Q4 2026 hasn't happened yet, so an order dated Q4 2026 (if any
    // existed) must never be counted. This test just confirms mostRecentCompletedQ4
    // resolves to 2025, not 2026, by checking a 2026-dated order isn't picked up as Q4.
    const s = store([order('o1', 'c1', '2026-11-01T00:00:00Z')])
    const result = computeQ4GiftBuyerStats(s, NOW)
    expect(result.q4OneTimeBuyerCount).toBe(0)
  })
})
