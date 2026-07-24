import { describe, it, expect } from 'vitest'
import { analyzeReturns } from '../../src/return-lens/derive'
import type { NormalizedOrder, NormalizedReturn } from '@ss/csv-ingest'

function order(over: Partial<NormalizedOrder> = {}): NormalizedOrder {
  return {
    orderName: '#1',
    email: 'a@x.com',
    createdAt: '2026-01-01T00:00:00Z',
    financialStatus: 'paid',
    total: 100,
    refundedAmount: 0,
    lineItems: [],
    shippingAddressKey: null,
    ...over,
  }
}

function ret(over: Partial<NormalizedReturn> = {}): NormalizedReturn {
  return {
    orderName: '#1',
    email: 'a@x.com',
    sku: 'SKU-1',
    quantity: 1,
    reason: null,
    status: 'CLOSED',
    refundAmount: 0,
    createdAt: '2026-01-10T00:00:00Z',
    processedAt: null,
    ...over,
  }
}

describe('analyzeReturns — entity resolution', () => {
  it('keeps two customers with different emails and no shared address as separate entities', () => {
    const orders = [
      order({ orderName: '#1', email: 'a@x.com', shippingAddressKey: 'addr-a' }),
      order({ orderName: '#2', email: 'b@x.com', shippingAddressKey: 'addr-b' }),
    ]
    const snap = analyzeReturns(orders, [], 365)
    expect(snap.entities).toHaveLength(2)
    expect(snap.entities.every((e) => !e.spansMultipleEmails)).toBe(true)
  })

  it('resolves two different emails sharing one shipping address into a single entity', () => {
    const orders = [
      order({ orderName: '#1', email: 'a@x.com', shippingAddressKey: 'shared-addr' }),
      order({ orderName: '#2', email: 'b@x.com', shippingAddressKey: 'shared-addr' }),
    ]
    const snap = analyzeReturns(orders, [], 365)
    expect(snap.entities).toHaveLength(1)
    expect(snap.entities[0]!.spansMultipleEmails).toBe(true)
    expect(snap.entities[0]!.emails.sort()).toEqual(['a@x.com', 'b@x.com'])
    expect(snap.entities[0]!.orderCount).toBe(2)
  })

  it('computes returnRate as returned-orders / total-orders for one entity', () => {
    const orders = [
      order({ orderName: '#1', email: 'a@x.com' }),
      order({ orderName: '#2', email: 'a@x.com' }),
      order({ orderName: '#3', email: 'a@x.com' }),
      order({ orderName: '#4', email: 'a@x.com' }),
    ]
    const returns = [ret({ orderName: '#1' })]
    const snap = analyzeReturns(orders, returns, 365)
    expect(snap.entities[0]!.orderCount).toBe(4)
    expect(snap.entities[0]!.returnedOrderCount).toBe(1)
    expect(snap.entities[0]!.returnRate).toBe(0.25)
  })

  it('excludes orders with no email and no address from entity resolution', () => {
    const orders = [order({ orderName: '#1', email: null, shippingAddressKey: null })]
    const snap = analyzeReturns(orders, [], 365)
    expect(snap.entities).toHaveLength(0)
  })
})

describe('analyzeReturns — cohort baseline', () => {
  it('is null when no entity has 2+ orders', () => {
    const orders = [
      order({ orderName: '#1', email: 'a@x.com' }),
      order({ orderName: '#2', email: 'b@x.com' }),
    ]
    const snap = analyzeReturns(orders, [], 365)
    expect(snap.cohortAvgReturnRate).toBeNull()
  })

  it('averages return rate only across entities with 2+ orders', () => {
    // a@x.com: 2 orders, 1 returned -> 0.5. b@x.com: 1 order only -> excluded. c@x.com: 4 orders, 0 returned -> 0.
    const orders = [
      order({ orderName: '#1', email: 'a@x.com' }),
      order({ orderName: '#2', email: 'a@x.com' }),
      order({ orderName: '#3', email: 'b@x.com' }),
      order({ orderName: '#4', email: 'c@x.com' }),
      order({ orderName: '#5', email: 'c@x.com' }),
      order({ orderName: '#6', email: 'c@x.com' }),
      order({ orderName: '#7', email: 'c@x.com' }),
    ]
    const returns = [ret({ orderName: '#1' })]
    const snap = analyzeReturns(orders, returns, 365)
    // (0.5 + 0) / 2 = 0.25
    expect(snap.cohortAvgReturnRate).toBe(0.25)
  })
})

describe('analyzeReturns — SKU stats', () => {
  it('computes ordered/returned quantity and dominant reason per SKU', () => {
    const orders = [
      order({
        orderName: '#1',
        lineItems: [{ sku: 'SKU-X', name: 'Widget', quantity: 3, price: 10 }],
      }),
      order({
        orderName: '#2',
        lineItems: [{ sku: 'SKU-X', name: 'Widget', quantity: 2, price: 10 }],
      }),
    ]
    const returns = [
      ret({ orderName: '#1', sku: 'SKU-X', quantity: 2, reason: 'DEFECTIVE' }),
      ret({ orderName: '#2', sku: 'SKU-X', quantity: 1, reason: 'DEFECTIVE' }),
    ]
    const snap = analyzeReturns(orders, returns, 365)
    const sku = snap.skuStats.find((s) => s.sku === 'SKU-X')!
    expect(sku.orderedQuantity).toBe(5)
    expect(sku.returnedQuantity).toBe(3)
    expect(sku.returnRate).toBe(0.6)
    expect(sku.dominantReason).toBe('DEFECTIVE')
  })
})

describe('analyzeReturns — bracketing', () => {
  it('flags an order where 2+ size variants of the same style were both ordered and returned', () => {
    const orders = [
      order({
        orderName: '#1',
        lineItems: [
          { sku: 'COAT-S', name: 'Wool Coat - Small', quantity: 1, price: 100 },
          { sku: 'COAT-M', name: 'Wool Coat - Medium', quantity: 1, price: 100 },
          { sku: 'COAT-L', name: 'Wool Coat - Large', quantity: 1, price: 100 },
        ],
      }),
    ]
    const returns = [
      ret({ orderName: '#1', sku: 'COAT-S' }),
      ret({ orderName: '#1', sku: 'COAT-L' }),
    ]
    const snap = analyzeReturns(orders, returns, 365)
    expect(snap.bracketingCandidates).toEqual([
      { orderName: '#1', baseStyle: 'wool coat', variantsOrdered: 3, variantsReturned: 2 },
    ])
  })

  it('does not flag an order with only one variant returned', () => {
    const orders = [
      order({
        orderName: '#2',
        lineItems: [
          { sku: 'COAT-S', name: 'Wool Coat - Small', quantity: 1, price: 100 },
          { sku: 'COAT-M', name: 'Wool Coat - Medium', quantity: 1, price: 100 },
        ],
      }),
    ]
    const returns = [ret({ orderName: '#2', sku: 'COAT-S' })]
    const snap = analyzeReturns(orders, returns, 365)
    expect(snap.bracketingCandidates).toEqual([])
  })
})

describe('analyzeReturns — wardrobing', () => {
  it('counts a return inside the wear window and excludes one outside it', () => {
    const orders = [
      order({ orderName: '#1', createdAt: '2026-01-01T00:00:00Z' }),
      order({ orderName: '#2', createdAt: '2026-01-01T00:00:00Z' }),
    ]
    const returns = [
      ret({ orderName: '#1', createdAt: '2026-01-10T00:00:00Z' }), // 9 days — inside [5,21]
      ret({ orderName: '#2', createdAt: '2026-01-02T00:00:00Z' }), // 1 day — outside
    ]
    const snap = analyzeReturns(orders, returns, 365)
    expect(snap.wardrobing).toEqual({
      totalReturns: 2,
      wearWindowReturns: 1,
      wearWindowSharePct: 50,
    })
  })

  it('reports a null share when there are no returns', () => {
    const snap = analyzeReturns([order()], [], 365)
    expect(snap.wardrobing).toEqual({
      totalReturns: 0,
      wearWindowReturns: 0,
      wearWindowSharePct: null,
    })
  })
})
