import { describe, it, expect } from 'vitest'
import { rfmAnalyzer, cohortAnalyzer, replenishmentAnalyzer } from '../../src/analyzers/customers'
import { ctxOf, order, day, num } from '../factory'

describe('rfmAnalyzer', () => {
  it('buckets customers by frequency, recency and value (hand-verified)', () => {
    const orders = [
      // c1: 5 orders, last recent (active), spend 1000 → loyal champion (highest spender)
      ...['2025-12-01', '2026-01-01', '2026-02-01', '2026-03-01', '2026-05-01'].map((d, i) =>
        order({ id: `c1o${i}`, customerId: 'c1', totalPrice: 200, createdAt: day(d) }),
      ),
      // c2: 1 order, active → one-time
      order({ id: 'c2o', customerId: 'c2', totalPrice: 150, createdAt: day('2026-05-01') }),
      // c3: 2 orders, dormant → repeat, at-risk
      order({ id: 'c3o1', customerId: 'c3', totalPrice: 100, createdAt: day('2025-08-01') }),
      order({ id: 'c3o2', customerId: 'c3', totalPrice: 100, createdAt: day('2025-09-01') }),
      // c4: 1 order, lapsing → one-time
      order({ id: 'c4o', customerId: 'c4', totalPrice: 50, createdAt: day('2026-01-01') }),
      // c5: 4 orders, dormant → loyal, at-risk
      ...['2025-06-01', '2025-07-01', '2025-08-01', '2025-09-01'].map((d, i) =>
        order({ id: `c5o${i}`, customerId: 'c5', totalPrice: 100, createdAt: day(d) }),
      ),
    ]
    const m = rfmAnalyzer(ctxOf({ orders }))
    expect(num(m, 'rfm.customer_count')).toBe(5)
    expect(num(m, 'rfm.one_time_count')).toBe(2) // c2, c4
    expect(num(m, 'rfm.repeat_count')).toBe(1) // c3
    expect(num(m, 'rfm.loyal_count')).toBe(2) // c1, c5
    expect(num(m, 'rfm.active_count')).toBe(2) // c1, c2
    expect(num(m, 'rfm.lapsing_count')).toBe(1) // c4
    expect(num(m, 'rfm.dormant_count')).toBe(2) // c3, c5
    expect(num(m, 'rfm.champions_count')).toBe(1) // c1
    expect(num(m, 'rfm.at_risk_count')).toBe(2) // c3, c5
  })
})

describe('cohortAnalyzer', () => {
  it('computes repeat rate, 2nd→3rd conversion and median time-to-second', () => {
    const orders = [
      order({ id: 'c1o1', customerId: 'c1', createdAt: day('2025-01-01') }),
      order({ id: 'c1o2', customerId: 'c1', createdAt: day('2025-01-11') }), // +10d
      order({ id: 'c1o3', customerId: 'c1', createdAt: day('2025-02-10') }),
      order({ id: 'c2o1', customerId: 'c2', createdAt: day('2025-03-01') }),
      order({ id: 'c2o2', customerId: 'c2', createdAt: day('2025-03-31') }), // +30d
      order({ id: 'c3o1', customerId: 'c3', createdAt: day('2025-04-01') }),
    ]
    const m = cohortAnalyzer(ctxOf({ orders }))
    expect(num(m, 'cohort.new_customers_count')).toBe(3)
    expect(num(m, 'cohort.repeat_purchase_rate')).toBe(0.6667) // 2 of 3
    expect(num(m, 'cohort.second_to_third_conversion')).toBe(0.5) // 1 of 2
    expect(num(m, 'cohort.time_to_second_order_median_days')).toBe(20) // median(10,30)
  })
})

describe('replenishmentAnalyzer', () => {
  it('computes median reorder interval across same-customer same-SKU repurchases', () => {
    const px = { productId: 'pX', quantity: 1, price: 10 }
    const py = { productId: 'pY', quantity: 1, price: 10 }
    const orders = [
      order({ id: 'c1o1', customerId: 'c1', createdAt: day('2025-01-01'), lineItems: [px] }),
      order({ id: 'c1o2', customerId: 'c1', createdAt: day('2025-01-31'), lineItems: [px] }), // +30
      order({ id: 'c1o3', customerId: 'c1', createdAt: day('2025-02-20'), lineItems: [px] }), // +20
      order({ id: 'c2o1', customerId: 'c2', createdAt: day('2025-03-01'), lineItems: [py] }),
      order({ id: 'c2o2', customerId: 'c2', createdAt: day('2025-03-11'), lineItems: [py] }), // +10
    ]
    const m = replenishmentAnalyzer(ctxOf({ orders }))
    expect(num(m, 'replenishment.median_reorder_interval_days')).toBe(20) // median(30,20,10)
    expect(num(m, 'replenishment.reordered_pair_count')).toBe(3)
  })
})
