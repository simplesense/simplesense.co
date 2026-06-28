import { describe, it, expect } from 'vitest'
import { buildVipSegment, buildSkuEconomics, toCsv } from '../src/export'
import type { NormalizedStore, Order } from '../src/types'

function order(partial: Partial<Order> & { id: string }): Order {
  return {
    customerId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    totalPrice: 0,
    discountTotal: 0,
    currency: 'USD',
    lineItems: [],
    ...partial,
  }
}

function store(partial: Partial<NormalizedStore>): NormalizedStore {
  return {
    storeId: 's1',
    currency: 'USD',
    hasPhysicalLocations: false,
    locations: [],
    customers: [],
    products: [],
    orders: [],
    ...partial,
  }
}

describe('buildVipSegment', () => {
  const base = store({
    customers: [
      {
        id: 'c1',
        email: 'whale@x.com',
        defaultAddress: { city: 'Austin', region: 'TX', country: 'US' },
        firstOrderAt: new Date('2025-03-02T00:00:00Z'),
      },
      {
        id: 'c2',
        email: 'mid@x.com',
        defaultAddress: { city: 'Reno', region: 'NV', country: 'US' },
        firstOrderAt: null,
      },
      { id: 'c3', email: 'low@x.com', defaultAddress: null, firstOrderAt: null },
    ],
    orders: [
      order({ id: 'o1', customerId: 'c1', totalPrice: 800 }),
      order({ id: 'o2', customerId: 'c1', totalPrice: 200 }),
      order({ id: 'o3', customerId: 'c2', totalPrice: 300 }),
      order({ id: 'o4', customerId: 'c3', totalPrice: 50 }),
      order({ id: 'o5', customerId: null, totalPrice: 999 }), // guest — excluded
    ],
  })

  it('ranks customers by net lifetime spend and excludes guests', () => {
    const seg = buildVipSegment(base, 0.4) // top 40% of 3 customers → ceil(1.2)=2
    expect(seg.map((r) => r.customerId)).toEqual(['c1', 'c2'])
    expect(seg[0]).toMatchObject({
      email: 'whale@x.com',
      orders: 2,
      totalSpent: 1000,
      region: 'TX',
    })
    expect(seg[0]!.firstOrderAt).toBe('2025-03-02')
  })

  it('subtracts refunds from spend', () => {
    const s = store({
      customers: [{ id: 'c1', email: 'a@x.com' }],
      orders: [order({ id: 'o1', customerId: 'c1', totalPrice: 500, refundedAmount: 150 })],
    })
    expect(buildVipSegment(s, 1)[0]!.totalSpent).toBe(350)
  })

  it('returns [] when there are no attributable orders', () => {
    expect(buildVipSegment(store({ orders: [order({ id: 'o1', totalPrice: 100 })] }))).toEqual([])
  })

  it('blanks missing email/address rather than fabricating', () => {
    const seg = buildVipSegment(base, 1)
    const c3 = seg.find((r) => r.customerId === 'c3')!
    expect(c3.city).toBe('')
    expect(c3.firstOrderAt).toBe('')
  })

  it('excludes non-paying customers so a zero-spend cutoff cannot admit the whole base', () => {
    // 1 whale + 9 fully-refunded customers. Old code: cutoff customer spend 0 → threshold 0
    // → every customer's spend >= 0 → all 10 returned. Fixed: only the paying whale.
    const customers = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, email: `c${i}@x.com` }))
    const orders = customers.map((c, i) =>
      i === 0
        ? order({ id: `o${i}`, customerId: c.id, totalPrice: 1000 })
        : order({ id: `o${i}`, customerId: c.id, totalPrice: 100, refundedAmount: 100 }),
    )
    const seg = buildVipSegment(store({ customers, orders }), 0.2)
    expect(seg.map((r) => r.customerId)).toEqual(['c0'])
  })

  it('excludes over-refunded (net-negative) customers entirely', () => {
    const s = store({
      customers: [{ id: 'c1', email: 'a@x.com' }],
      orders: [order({ id: 'o1', customerId: 'c1', totalPrice: 100, refundedAmount: 300 })],
    })
    expect(buildVipSegment(s, 1)).toEqual([])
  })
})

describe('buildSkuEconomics', () => {
  const s = store({
    products: [
      { id: 'p1', title: 'Serum', type: 'Skincare', unitCost: 12 },
      { id: 'p2', title: 'Mystery Bundle', type: 'Bundle', unitCost: null }, // unknown cost
    ],
    orders: [
      order({
        id: 'o1',
        customerId: 'c1',
        lineItems: [
          { productId: 'p1', quantity: 2, price: 40, discount: 10 },
          { productId: 'p2', quantity: 1, price: 100 },
        ],
      }),
    ],
  })

  it('computes revenue net of line discounts and margin when cost is known', () => {
    const rows = buildSkuEconomics(s)
    const p1 = rows.find((r) => r.productId === 'p1')!
    expect(p1.grossRevenue).toBe(70) // 2*40 - 10
    expect(p1.estimatedCost).toBe(24) // 12*2
    expect(p1.grossProfit).toBe(46)
    expect(p1.marginRate).toBeCloseTo(0.66, 2)
  })

  it('blanks margin fields when unit cost is unknown (no fabricated 0)', () => {
    const p2 = buildSkuEconomics(s).find((r) => r.productId === 'p2')!
    expect(p2.grossRevenue).toBe(100)
    expect(p2.unitCost).toBe('')
    expect(p2.grossProfit).toBe('')
    expect(p2.marginRate).toBe('')
  })

  it('blanks marginRate (never a fabricated 0) when known-cost revenue nets to 0', () => {
    // price 50, qty 1, discount 50 → revenue 0; unitCost 10 → grossProfit -10 (a real loss).
    const s0 = store({
      products: [{ id: 'p', title: 'Comped SKU', unitCost: 10 }],
      orders: [
        order({ id: 'o1', lineItems: [{ productId: 'p', quantity: 1, price: 50, discount: 50 }] }),
      ],
    })
    const row = buildSkuEconomics(s0)[0]!
    expect(row.grossRevenue).toBe(0)
    expect(row.grossProfit).toBe(-10)
    expect(row.marginRate).toBe('') // undefined margin → blank, not 0%
  })

  it('sorts money-losing SKUs first', () => {
    const loss = store({
      products: [
        { id: 'good', title: 'Good', unitCost: 1 },
        { id: 'bad', title: 'Loss Leader', unitCost: 100 },
      ],
      orders: [
        order({
          id: 'o1',
          lineItems: [
            { productId: 'good', quantity: 1, price: 50 },
            { productId: 'bad', quantity: 1, price: 50 },
          ],
        }),
      ],
    })
    expect(buildSkuEconomics(loss)[0]!.productId).toBe('bad') // -50 profit first
  })
})

describe('toCsv', () => {
  it('serializes with a header and quotes fields needing it', () => {
    const csv = toCsv(
      ['a', 'b'],
      [
        { a: 'x', b: 'has,comma' },
        { a: 'q"ote', b: '' },
      ],
    )
    expect(csv).toBe('a,b\r\nx,"has,comma"\r\n"q""ote",\r\n')
  })

  it('emits just the header for no rows', () => {
    expect(toCsv(['a', 'b'], [])).toBe('a,b\r\n')
  })

  it('defangs spreadsheet formula triggers (= + - @ tab/CR) with a leading apostrophe', () => {
    const csv = toCsv(
      ['email'],
      [
        { email: '=HYPERLINK("http://evil","x")' },
        { email: '+1-555' },
        { email: '-2+3' },
        { email: '@SUM(A1)' },
        { email: '\tTAB' },
        { email: 'safe@x.com' }, // @ not leading → untouched
      ],
    )
    const lines = csv.trim().split('\r\n')
    expect(lines[1]).toBe('"\'=HYPERLINK(""http://evil"",""x"")"')
    expect(lines[2]).toBe("'+1-555")
    expect(lines[3]).toBe("'-2+3")
    expect(lines[4]).toBe("'@SUM(A1)")
    expect(lines[5]).toBe("'\tTAB") // apostrophe-defanged; tab is not an RFC quote trigger
    expect(lines[6]).toBe('safe@x.com') // interior @ is fine
  })
})
