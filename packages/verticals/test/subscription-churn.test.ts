import { describe, it, expect } from 'vitest'
import { computeSubscriptionChurn } from '../src/compute/subscription-churn'
import type { DemoStoreParams } from '../src/types'

function baseParams(over: Partial<DemoStoreParams> = {}): DemoStoreParams {
  return {
    storeName: 'Test',
    annualRevenue: 4_200_000,
    ordersPerYear: 62_000,
    historyYears: 3,
    locations: [],
    hasPhysicalLocations: false,
    subscriptionRevenueShare: 0.28,
    repeatPurchaseRate: 0.32,
    returnRate: 0.04,
    discountedRevenueShare: 0.1,
    avgDiscountRate: 0.15,
    q4RevenueShare: 0.2,
    vipFlowCoveragePct: 0.4,
    skuTree: [],
    ...over,
  }
}

describe('computeSubscriptionChurn', () => {
  it('computes active/churned subscriber counts and lapsed value by hand', () => {
    // AOV = 4,200,000 / 62,000 = 67.7419...
    // avgSubscriberAnnualValue = AOV * 4 = 270.9677...
    // subscriptionRevenue = 4,200,000 * 0.28 = 1,176,000
    // activeSubscriberCount = round(1,176,000 / 270.9677) = round(4340.0...) = 4340
    const result = computeSubscriptionChurn(baseParams())
    const aov = 4_200_000 / 62_000
    const avgSubscriberAnnualValue = aov * 4
    const expectedActive = Math.round((4_200_000 * 0.28) / avgSubscriberAnnualValue)
    expect(result.activeSubscriberCount).toBe(expectedActive)
    expect(result.churnedSubscriberCount).toBe(Math.round(expectedActive * 0.12))
    expect(result.lapsedSubscriberValueUsd).toBe(
      Math.round(Math.round(expectedActive * 0.12) * avgSubscriberAnnualValue),
    )
  })

  it('is zero when subscriptionRevenueShare is 0', () => {
    const result = computeSubscriptionChurn(baseParams({ subscriptionRevenueShare: 0 }))
    expect(result.activeSubscriberCount).toBe(0)
    expect(result.churnedSubscriberCount).toBe(0)
    expect(result.lapsedSubscriberValueUsd).toBe(0)
  })

  it('scales linearly with subscriptionRevenueShare', () => {
    const half = computeSubscriptionChurn(baseParams({ subscriptionRevenueShare: 0.1 }))
    const full = computeSubscriptionChurn(baseParams({ subscriptionRevenueShare: 0.2 }))
    expect(full.activeSubscriberCount).toBeCloseTo(half.activeSubscriberCount * 2, -1)
  })
})
