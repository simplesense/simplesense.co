/**
 * Regression tests for defects found by the adversarial analyzer audit
 * (ss-analyzer-audit, 2026-06-27). Each guards a specific Prime-Directive-#1 grounding
 * or determinism fix. See LEARNINGS.md.
 */
import { describe, it, expect } from 'vitest'
import { windowBounds } from '../../src/window'
import { geographyAnalyzer } from '../../src/analyzers/geography'
import { cohortAnalyzer } from '../../src/analyzers/customers'
import { discountAnalyzer } from '../../src/analyzers/economics'
import { newVsReturningAnalyzer } from '../../src/analyzers/mix'
import { paretoAnalyzer } from '../../src/analyzers/pareto'
import { ctxOf, order, customer, location, addr, num, findMetric, day } from '../factory'

describe('windowBounds — month-end overflow (HIGH/edge)', () => {
  it('clamps to the target month last day instead of overflowing', () => {
    const ctx = ctxOf({}, { now: day('2024-07-31'), windowMonths: 1 })
    expect(windowBounds(ctx).start.toISOString().slice(0, 10)).toBe('2024-06-30')
  })
  it('handles the normal 24-month window deterministically (UTC)', () => {
    const ctx = ctxOf({}, { now: day('2026-06-01'), windowMonths: 24 })
    expect(windowBounds(ctx).start.toISOString().slice(0, 10)).toBe('2024-06-01')
  })
})

describe('geographyAnalyzer — geocoded denominator is qualified (HIGH/grounding)', () => {
  it('emits geocoded_revenue_fraction so within_5mi share is honest', () => {
    const loc = location({ id: 'l1', lat: 0, lng: 0 })
    const near = addr({ region: 'CA', lat: 0, lng: 0.05 })
    const noCoords = addr({ region: 'CA' }) // located by region, but not geocoded
    const orders = [
      order({ id: 'g1', customerId: 'c1', totalPrice: 100, shippingAddress: near }),
      order({ id: 'g2', customerId: 'c2', totalPrice: 100, shippingAddress: near }),
      order({ id: 'g3', customerId: 'c3', totalPrice: 100, shippingAddress: noCoords }),
      order({ id: 'g4', customerId: 'c4', totalPrice: 100, shippingAddress: noCoords }),
    ]
    const m = geographyAnalyzer(ctxOf({ hasPhysicalLocations: true, locations: [loc], orders }))
    expect(num(m, 'geo.within_5mi_revenue_share')).toBe(1) // 200/200 geocoded
    expect(num(m, 'geo.geocoded_revenue_fraction')).toBe(0.5) // only 200/400 was geocoded
  })
})

describe('geographyAnalyzer — unknown region not pooled (MED/grounding)', () => {
  it('reports unlocatable fraction and concentrates over located revenue only', () => {
    const ca = addr({ region: 'CA' })
    const orders = [
      order({ id: 'o1', customerId: 'c1', totalPrice: 100, shippingAddress: ca }),
      order({ id: 'o2', customerId: 'c2', totalPrice: 100, shippingAddress: ca }),
      order({ id: 'o3', customerId: 'c3', totalPrice: 100, shippingAddress: null }),
      order({ id: 'o4', customerId: 'c4', totalPrice: 100, shippingAddress: null }),
    ]
    const m = geographyAnalyzer(ctxOf({ hasPhysicalLocations: false, orders }))
    expect(num(m, 'geo.unlocatable_revenue_fraction')).toBe(0.5)
    expect(num(m, 'geo.single_region_share')).toBe(1) // CA = 200/200 located, not 200/400
  })
})

describe('cohortAnalyzer — no fabricated zero (HIGH/grounding)', () => {
  it('emits insufficient for 2nd→3rd when nobody has reordered', () => {
    const orders = [
      order({ id: 'a', customerId: 'c1', createdAt: day('2025-01-01') }),
      order({ id: 'b', customerId: 'c2', createdAt: day('2025-02-01') }),
    ]
    const m = cohortAnalyzer(ctxOf({ orders }))
    expect(findMetric(m, 'cohort.second_to_third_conversion').insufficientData).toBe(true)
    expect(num(m, 'cohort.repeat_purchase_rate')).toBe(0) // a real 0: 0 of 2 reordered
  })
})

describe('discountAnalyzer — zero net revenue (MED/grounding)', () => {
  it('emits insufficient revenue share when everything is refunded', () => {
    const orders = [
      order({ id: 'o1', totalPrice: 100, discountTotal: 20, refundedAmount: 100 }),
      order({ id: 'o2', totalPrice: 100, discountTotal: 0, refundedAmount: 100 }),
    ]
    const m = discountAnalyzer(ctxOf({ orders }))
    expect(findMetric(m, 'discount.revenue_share_discounted').insufficientData).toBe(true)
    expect(num(m, 'discount.order_share_discounted')).toBe(0.5) // still computable
  })
})

describe('newVsReturningAnalyzer — guests excluded (MED/grounding)', () => {
  it('does not count guest orders as returning', () => {
    const orders = [
      order({ id: 'c1o', customerId: 'c1', totalPrice: 100, createdAt: day('2025-01-01') }),
      order({ id: 'guest', customerId: null, totalPrice: 100, createdAt: day('2025-02-01') }),
    ]
    const m = newVsReturningAnalyzer(ctxOf({ orders }))
    expect(num(m, 'mix.new_revenue_share')).toBe(1) // identified revenue is 100% new
    expect(num(m, 'mix.returning_revenue_share')).toBe(0)
    expect(num(m, 'mix.guest_revenue_share')).toBe(0.5) // 100 of 200 total
  })
})

describe('paretoAnalyzer — effective percentile recorded (MED/grounding)', () => {
  it('qualifies each tier with its true customer count for small stores', () => {
    const customers = Array.from({ length: 10 }, (_, i) => customer({ id: `c${i + 1}` }))
    const orders = customers.map((c, i) =>
      order({ id: `o${i}`, customerId: c.id, totalPrice: 100 - i }),
    )
    const m = paretoAnalyzer(ctxOf({ customers, orders }))
    const top1 = findMetric(m, 'pareto.top1_revenue_share').valueJson as {
      effective_customer_count: number
      effective_pct: number
    }
    expect(top1.effective_customer_count).toBe(1) // ceil(10*0.01)=1
    expect(top1.effective_pct).toBe(0.1) // truly the top 10%, not 1%
  })
})
