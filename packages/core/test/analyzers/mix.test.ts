import { describe, it, expect } from 'vitest'
import { newVsReturningAnalyzer, acquisitionAnalyzer } from '../../src/analyzers/mix'
import { ctxOf, order, day, num, findMetric } from '../factory'

describe('newVsReturningAnalyzer', () => {
  it('classifies by all-time first order, not just the window', () => {
    const orders = [
      order({ id: 'c1o1', customerId: 'c1', totalPrice: 100, createdAt: day('2025-01-01') }), // new
      order({ id: 'c1o2', customerId: 'c1', totalPrice: 100, createdAt: day('2025-02-01') }), // returning
      order({ id: 'c2o1', customerId: 'c2', totalPrice: 100, createdAt: day('2024-07-01') }), // new
      order({ id: 'c3o0', customerId: 'c3', totalPrice: 999, createdAt: day('2023-01-01') }), // pre-window first order
      order({ id: 'c3o1', customerId: 'c3', totalPrice: 100, createdAt: day('2025-03-01') }), // returning
    ]
    const m = newVsReturningAnalyzer(ctxOf({ orders }))
    expect(num(m, 'mix.new_revenue_share')).toBe(0.5) // 200 of 400 in-window
    expect(num(m, 'mix.returning_revenue_share')).toBe(0.5)
    expect(num(m, 'mix.new_order_count')).toBe(2)
    expect(num(m, 'mix.returning_order_count')).toBe(2)
  })
})

describe('acquisitionAnalyzer', () => {
  it('attributes window revenue to each customer first-order source', () => {
    const orders = [
      order({
        id: 'c1o1',
        customerId: 'c1',
        totalPrice: 100,
        createdAt: day('2025-01-01'),
        sourceName: 'google',
      }),
      order({
        id: 'c1o2',
        customerId: 'c1',
        totalPrice: 100,
        createdAt: day('2025-02-01'),
        sourceName: 'email',
      }),
      order({
        id: 'c2o1',
        customerId: 'c2',
        totalPrice: 100,
        createdAt: day('2024-07-01'),
        sourceName: 'facebook',
      }),
      order({
        id: 'c3o0',
        customerId: 'c3',
        totalPrice: 50,
        createdAt: day('2023-01-01'),
        sourceName: 'google',
      }),
      order({
        id: 'c3o1',
        customerId: 'c3',
        totalPrice: 100,
        createdAt: day('2025-03-01'),
        sourceName: 'email',
      }),
    ]
    const m = acquisitionAnalyzer(ctxOf({ orders }))
    // google = c1(200) + c3(100 in-window) = 300; facebook = 100; total 400
    expect(num(m, 'acquisition.top_source_share')).toBe(0.75)
    expect(
      (findMetric(m, 'acquisition.top_source_share').valueJson as { source: string }).source,
    ).toBe('google')
    expect(num(m, 'acquisition.source_count')).toBe(2)
  })

  it('emits insufficient when Shopify carries no source data', () => {
    const orders = [order({ customerId: 'c1', totalPrice: 100 })]
    const m = acquisitionAnalyzer(ctxOf({ orders }))
    expect(findMetric(m, 'acquisition.top_source_share').insufficientData).toBe(true)
  })
})
