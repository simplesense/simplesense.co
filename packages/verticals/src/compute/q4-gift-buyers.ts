import type { NormalizedStore } from '@ss/core'

export interface Q4GiftBuyerStats {
  q4OneTimeBuyerCount: number
  /** Share of Q4 buyers whose Q4 order was their only order, ever. */
  giftBuyerOneTimePct: number
}

/**
 * The most recently *completed* Oct 1 - Dec 31 window before `now` — if `now` falls
 * inside this year's Q4, use last year's (this year's isn't over yet, so "did they
 * order again after Q4" can't be answered for it).
 */
function mostRecentCompletedQ4(now: Date): { start: Date; end: Date } {
  const year = now.getUTCMonth() >= 9 ? now.getUTCFullYear() - 1 : now.getUTCFullYear() - 1
  return {
    start: new Date(Date.UTC(year, 9, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
  }
}

/**
 * Genuinely computed from the synthetic store's real order history (not editorial
 * arithmetic): among customers who ordered in the most recent completed Q4, what share
 * never ordered again — before OR after that Q4 (a true one-time buyer, not just
 * "quiet since Q4"). This is the plan's "gift recipient never became a repeat buyer"
 * signal for a gift-heavy category (candles).
 */
export function computeQ4GiftBuyerStats(store: NormalizedStore, now: Date): Q4GiftBuyerStats {
  const { start, end } = mostRecentCompletedQ4(now)
  const q4CustomerIds = new Set<string>()
  for (const o of store.orders) {
    if (o.customerId && o.createdAt >= start && o.createdAt <= end) q4CustomerIds.add(o.customerId)
  }
  const orderCountByCustomer = new Map<string, number>()
  for (const o of store.orders) {
    if (!o.customerId) continue
    orderCountByCustomer.set(o.customerId, (orderCountByCustomer.get(o.customerId) ?? 0) + 1)
  }
  let oneTime = 0
  for (const cid of q4CustomerIds) {
    if ((orderCountByCustomer.get(cid) ?? 0) === 1) oneTime++
  }
  return {
    q4OneTimeBuyerCount: oneTime,
    giftBuyerOneTimePct:
      q4CustomerIds.size > 0 ? Math.round((oneTime / q4CustomerIds.size) * 1000) / 10 : 0,
  }
}
