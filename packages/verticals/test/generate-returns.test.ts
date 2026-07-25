import { describe, it, expect } from 'vitest'
import { generateReturnsData } from '../src/generator/generate-returns'
import { returnLens } from '@ss/rulebooks'
import type { DemoStoreParams } from '../src/types'

const { analyzeReturns } = returnLens
const NOW = new Date('2026-07-25T00:00:00Z')

const PARAMS: DemoStoreParams = {
  storeName: 'Meridian Standard Apparel',
  annualRevenue: 6_500_000,
  ordersPerYear: 68_000,
  historyYears: 3,
  locations: [{ city: 'Test', region: 'CA', lat: 1, lng: 2, shareOfRevenue: 1 }],
  hasPhysicalLocations: true,
  subscriptionRevenueShare: 0,
  repeatPurchaseRate: 0.24,
  returnRate: 0.26,
  discountedRevenueShare: 0.15,
  avgDiscountRate: 0.2,
  q4RevenueShare: 0.28,
  vipFlowCoveragePct: 0.5,
  skuTree: [
    { name: 'Classic Denim', category: 'denim', unitPrice: 95 },
    { name: 'Trail Jacket - Small', category: 'outerwear', unitPrice: 120 },
    { name: 'Trail Jacket - Medium', category: 'outerwear', unitPrice: 120 },
    { name: 'Trail Jacket - Large', category: 'outerwear', unitPrice: 120 },
  ],
  abusePatternSeed: {
    abuseCustomerSharePct: 0.015,
    bracketingStyleSkuNames: [
      'Trail Jacket - Small',
      'Trail Jacket - Medium',
      'Trail Jacket - Large',
    ],
  },
}

describe('generateReturnsData', () => {
  it('is deterministic', () => {
    const a = generateReturnsData(PARAMS, NOW)
    const b = generateReturnsData(PARAMS, NOW)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('throws without an abusePatternSeed', () => {
    expect(() => generateReturnsData({ ...PARAMS, abusePatternSeed: undefined }, NOW)).toThrow()
  })

  it('produces orders and returns with every date on or before now', () => {
    const { orders, returns } = generateReturnsData(PARAMS, NOW)
    expect(orders.every((o) => Date.parse(o.createdAt) <= NOW.getTime())).toBe(true)
    expect(returns.every((r) => Date.parse(r.createdAt) <= NOW.getTime())).toBe(true)
  })

  it('feeds a real analyzeReturns() run that surfaces the planted abuse cohort', () => {
    const { orders, returns } = generateReturnsData(PARAMS, NOW)
    const snapshot = analyzeReturns(orders, returns, 730)
    expect(snapshot.orderCount).toBeGreaterThan(0)
    expect(snapshot.returnCount).toBeGreaterThan(0)
    // The abuse cohort has 3-5 orders each and ~75% return rate — well above the
    // cohort average — so at least one high-return-rate, high-order-count entity
    // should exist in the real computed entity list.
    const highRiskEntities = snapshot.entities.filter(
      (e) => e.orderCount >= 3 && e.returnRate >= 0.5,
    )
    expect(highRiskEntities.length).toBeGreaterThan(0)
  })

  it('feeds a real analyzeReturns() run that surfaces the planted bracketing pattern', () => {
    const { orders, returns } = generateReturnsData(PARAMS, NOW)
    const snapshot = analyzeReturns(orders, returns, 730)
    expect(snapshot.bracketingCandidates.length).toBeGreaterThan(0)
    expect(snapshot.bracketingCandidates.every((c) => c.baseStyle === 'trail jacket')).toBe(true)
  })

  it('feeds a real analyzeReturns() run that surfaces the high-return SKU', () => {
    const { orders, returns } = generateReturnsData(PARAMS, NOW)
    const snapshot = analyzeReturns(orders, returns, 730)
    expect(snapshot.skuStats.length).toBeGreaterThan(0)
  })
})
