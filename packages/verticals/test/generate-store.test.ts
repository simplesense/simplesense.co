import { describe, it, expect } from 'vitest'
import { generateStore } from '../src/generator/generate-store'
import type { DemoStoreParams } from '../src/types'

const NOW = new Date('2026-07-25T00:00:00Z')

const BASE_PARAMS: DemoStoreParams = {
  storeName: 'Test Co',
  annualRevenue: 1_000_000,
  ordersPerYear: 10_000,
  historyYears: 3,
  locations: [{ city: 'Testville', region: 'CA', lat: 1, lng: 2, shareOfRevenue: 1 }],
  hasPhysicalLocations: true,
  subscriptionRevenueShare: 0.1,
  repeatPurchaseRate: 0.3,
  returnRate: 0.1,
  discountedRevenueShare: 0.2,
  avgDiscountRate: 0.15,
  q4RevenueShare: 0.3,
  vipFlowCoveragePct: 0.5,
  skuTree: [
    { name: 'Widget A', category: 'core', unitPrice: 100 },
    { name: 'Widget B', category: 'core', unitPrice: 100 },
  ],
}

describe('generateStore', () => {
  it('is deterministic — same params and now produce identical output', () => {
    const a = generateStore(BASE_PARAMS, NOW)
    const b = generateStore(BASE_PARAMS, NOW)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('produces roughly ordersPerYear * 2 orders within the trailing window', () => {
    const store = generateStore(BASE_PARAMS, NOW)
    const twoYearsAgo = new Date(NOW.getTime() - 2 * 365 * 86_400_000)
    const inWindow = store.orders.filter((o) => o.createdAt >= twoYearsAgo)
    // within 15% of target — this is editorial synthetic data, not required to be exact
    expect(inWindow.length).toBeGreaterThan(BASE_PARAMS.ordersPerYear * 2 * 0.85)
    expect(inWindow.length).toBeLessThan(BASE_PARAMS.ordersPerYear * 2 * 1.15)
  })

  it('every order date is on or before "now" (no future orders)', () => {
    const store = generateStore(BASE_PARAMS, NOW)
    expect(store.orders.every((o) => o.createdAt <= NOW)).toBe(true)
  })

  it('assigns customers to locations roughly matching shareOfRevenue', () => {
    const params: DemoStoreParams = {
      ...BASE_PARAMS,
      locations: [
        { city: 'Near', region: 'CA', lat: 1, lng: 2, shareOfRevenue: 0.7 },
        { city: 'Far', region: 'NY', lat: 3, lng: 4, shareOfRevenue: 0.3 },
      ],
    }
    const store = generateStore(params, NOW)
    const nearCount = store.orders.filter((o) => o.shippingAddress?.city === 'Near').length
    const farCount = store.orders.filter((o) => o.shippingAddress?.city === 'Far').length
    const total = nearCount + farCount
    expect(total).toBe(store.orders.length)
    const nearShare = nearCount / total
    expect(nearShare).toBeGreaterThan(0.55)
    expect(nearShare).toBeLessThan(0.85)
  })

  it('produces some discounted and some refunded orders when configured', () => {
    const store = generateStore(BASE_PARAMS, NOW)
    expect(store.orders.some((o) => o.discountTotal > 0)).toBe(true)
    expect(store.orders.some((o) => (o.refundedAmount ?? 0) > 0)).toBe(true)
  })

  it('produces zero discounted/refunded orders when both rates are 0', () => {
    const store = generateStore({ ...BASE_PARAMS, discountedRevenueShare: 0, returnRate: 0 }, NOW)
    expect(store.orders.every((o) => o.discountTotal === 0)).toBe(true)
    expect(store.orders.every((o) => (o.refundedAmount ?? 0) === 0)).toBe(true)
  })

  it('never assigns more orders to a location than exist in the config', () => {
    const store = generateStore(BASE_PARAMS, NOW)
    const knownCities = new Set(BASE_PARAMS.locations.map((l) => l.city))
    expect(store.orders.every((o) => knownCities.has(o.shippingAddress?.city ?? ''))).toBe(true)
  })

  it('sets hasPhysicalLocations from the config, not inferred', () => {
    const online = generateStore({ ...BASE_PARAMS, hasPhysicalLocations: false }, NOW)
    expect(online.hasPhysicalLocations).toBe(false)
  })
})
