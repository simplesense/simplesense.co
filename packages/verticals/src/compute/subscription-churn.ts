import type { DemoStoreParams } from '../types'

/**
 * A synthetic store has no real ESP/subscription-platform data (there is none — it's
 * synthetic), so this is deliberately editorial arithmetic derived from the config's
 * own `subscriptionRevenueShare`, not a hidden claim of measurement. Documented
 * assumptions: subscribers order ~quarterly at roughly the store's own AOV; 12%
 * quarterly churn is a stated, round, defensible planning assumption (not sourced —
 * no external benchmark for this specific figure was found; flagged in PARKING_LOT.md).
 */
const EDITORIAL_QUARTERLY_CHURN_RATE = 0.12
const EDITORIAL_ORDERS_PER_SUBSCRIBER_PER_YEAR = 4

export interface SubscriptionChurnMetrics {
  activeSubscriberCount: number
  churnedSubscriberCount: number
  lapsedSubscriberValueUsd: number
}

export function computeSubscriptionChurn(params: DemoStoreParams): SubscriptionChurnMetrics {
  const subscriptionRevenue = params.annualRevenue * params.subscriptionRevenueShare
  const aov = params.annualRevenue / params.ordersPerYear
  const avgSubscriberAnnualValue = aov * EDITORIAL_ORDERS_PER_SUBSCRIBER_PER_YEAR
  const activeSubscriberCount =
    avgSubscriberAnnualValue > 0 ? Math.round(subscriptionRevenue / avgSubscriberAnnualValue) : 0
  const churnedSubscriberCount = Math.round(activeSubscriberCount * EDITORIAL_QUARTERLY_CHURN_RATE)
  const lapsedSubscriberValueUsd = Math.round(churnedSubscriberCount * avgSubscriberAnnualValue)
  return { activeSubscriberCount, churnedSubscriberCount, lapsedSubscriberValueUsd }
}
