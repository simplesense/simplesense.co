import { describe, it, expect } from 'vitest'
import { affinityAnalyzer, skuMarginAnalyzer } from '../../src/analyzers/products'
import { ctxOf, order, product, num, findMetric } from '../factory'

describe('affinityAnalyzer', () => {
  it('finds the top co-purchased pair and its support', () => {
    const li = (id: string) => ({ productId: id, quantity: 1, price: 10 })
    const orders = [
      order({ id: 'o1', lineItems: [li('pA'), li('pB')] }),
      order({ id: 'o2', lineItems: [li('pA'), li('pB')] }),
      order({ id: 'o3', lineItems: [li('pA'), li('pC')] }),
    ]
    const products = [product({ id: 'pA' }), product({ id: 'pB' }), product({ id: 'pC' })]
    const m = affinityAnalyzer(ctxOf({ orders, products }))
    expect(num(m, 'affinity.distinct_pairs')).toBe(2)
    expect(num(m, 'affinity.top_pair_support')).toBe(2)
    expect(
      (findMetric(m, 'affinity.top_pair_support').valueJson as { products: string[] }).products,
    ).toEqual(['pA', 'pB'])
  })
})

describe('skuMarginAnalyzer', () => {
  it('computes gross margin rate and flags money-losing SKUs', () => {
    const products = [
      product({ id: 'pA', unitCost: 4 }),
      product({ id: 'pB', unitCost: 10 }),
      product({ id: 'pC' }), // no cost → excluded
      product({ id: 'pD', unitCost: 50 }),
    ]
    const orders = [
      order({
        id: 'o1',
        lineItems: [
          { productId: 'pA', quantity: 5, price: 10 }, // rev 50, cost 20, margin 30
          { productId: 'pB', quantity: 2, price: 10 }, // rev 20, cost 20, margin 0
          { productId: 'pC', quantity: 1, price: 100 }, // excluded (no cost)
          { productId: 'pD', quantity: 1, price: 30 }, // rev 30, cost 50, margin -20
        ],
      }),
    ]
    const m = skuMarginAnalyzer(ctxOf({ orders, products }))
    // total costed rev 100, total margin 10 → 0.1
    expect(num(m, 'sku_margin.gross_margin_rate')).toBe(0.1)
    expect(num(m, 'sku_margin.negative_margin_sku_count')).toBe(1)
    expect(num(m, 'sku_margin.worst_sku_margin')).toBe(-20)
    expect(
      (findMetric(m, 'sku_margin.worst_sku_margin').valueJson as { productId: string }).productId,
    ).toBe('pD')
  })

  it('emits insufficient when no cost data exists', () => {
    const products = [product({ id: 'pA' })]
    const orders = [order({ lineItems: [{ productId: 'pA', quantity: 1, price: 10 }] })]
    const m = skuMarginAnalyzer(ctxOf({ orders, products }))
    expect(findMetric(m, 'sku_margin.gross_margin_rate').insufficientData).toBe(true)
  })
})
