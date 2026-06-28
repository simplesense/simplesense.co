import { describe, it, expect } from 'vitest'
import {
  discountAnalyzer,
  returnsAnalyzer,
  aovFreeshipAnalyzer,
} from '../../src/analyzers/economics'
import { ctxOf, order, num, findMetric } from '../factory'

describe('discountAnalyzer', () => {
  it('computes discount order/revenue shares and average discount rate', () => {
    const orders = [
      order({ id: 'o1', totalPrice: 80, discountTotal: 20 }),
      order({ id: 'o2', totalPrice: 100, discountTotal: 0 }),
      order({ id: 'o3', totalPrice: 90, discountTotal: 10 }),
      order({ id: 'o4', totalPrice: 100, discountTotal: 0 }),
    ]
    const m = discountAnalyzer(ctxOf({ orders }))
    expect(num(m, 'discount.order_share_discounted')).toBe(0.5) // 2 of 4
    expect(num(m, 'discount.revenue_share_discounted')).toBe(0.4595) // 170 / 370
    expect(num(m, 'discount.avg_discount_rate')).toBe(0.075) // 30 / 400
  })
})

describe('returnsAnalyzer', () => {
  it('computes value-based return rate', () => {
    const orders = [
      order({ id: 'o1', totalPrice: 100, refundedAmount: 20 }),
      order({ id: 'o2', totalPrice: 100, refundedAmount: 0 }),
    ]
    expect(num(returnsAnalyzer(ctxOf({ orders })), 'returns.rate_overall')).toBe(0.1)
  })

  it('reports a real 0 with a note when no refunds are recorded', () => {
    const orders = [order({ id: 'o1', totalPrice: 100 })]
    const m = findMetric(returnsAnalyzer(ctxOf({ orders })), 'returns.rate_overall')
    expect(m.valueNumeric).toBe(0)
    expect(m.note).toMatch(/no refunds/)
  })
})

describe('aovFreeshipAnalyzer', () => {
  it('computes AOV and a below-AOV free-ship gap', () => {
    const orders = [100, 100, 100, 200].map((p, i) => order({ id: `o${i}`, totalPrice: p }))
    const m = aovFreeshipAnalyzer(ctxOf({ orders, freeShippingThreshold: 100 }))
    expect(num(m, 'aov.value')).toBe(125) // 500 / 4
    expect(num(m, 'aov.freeship_gap')).toBe(-25) // 100 - 125
    expect((findMetric(m, 'aov.freeship_gap').valueJson as { position: string }).position).toBe(
      'below',
    )
  })

  it('emits insufficient gap when no threshold configured', () => {
    const orders = [order({ totalPrice: 100 })]
    const m = aovFreeshipAnalyzer(ctxOf({ orders }))
    expect(num(m, 'aov.value')).toBe(100)
    expect(findMetric(m, 'aov.freeship_gap').insufficientData).toBe(true)
  })
})
