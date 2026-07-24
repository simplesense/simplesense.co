import { describe, it, expect } from 'vitest'
import { parseOrdersCsv } from '../src/orders'

const HEADER =
  'Name,Email,Financial Status,Total,Refunded Amount,Created at,Lineitem sku,Lineitem name,Lineitem quantity,Lineitem price,Shipping Address1,Shipping Zip'

describe('parseOrdersCsv', () => {
  it('parses a single-line-item order', () => {
    const csv = `${HEADER}\n#1001,a@x.com,paid,50.00,0,2026-01-01T00:00:00Z,SKU-1,Tee,1,50.00,12 Elm St,90210\n`
    const result = parseOrdersCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows).toEqual([
      {
        orderName: '#1001',
        email: 'a@x.com',
        createdAt: '2026-01-01T00:00:00Z',
        financialStatus: 'paid',
        total: 50,
        refundedAmount: 0,
        lineItems: [{ sku: 'SKU-1', name: 'Tee', quantity: 1, price: 50 }],
        shippingAddressKey: '12 elm st|90210',
      },
    ])
  })

  it('folds multiple line-item rows into one order, inheriting order-level fields from the first row', () => {
    const csv = [
      HEADER,
      '#1002,b@x.com,paid,90.00,0,2026-01-02T00:00:00Z,SKU-A,Hat S,1,45.00,9 Oak Ave,10001',
      '#1002,,,,,,SKU-B,Hat M,1,45.00,,',
    ].join('\n')
    const result = parseOrdersCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.lineItems).toEqual([
      { sku: 'SKU-A', name: 'Hat S', quantity: 1, price: 45 },
      { sku: 'SKU-B', name: 'Hat M', quantity: 1, price: 45 },
    ])
    expect(result.rows[0]!.total).toBe(90)
  })

  it('quarantines a row with a missing order name', () => {
    const csv = `${HEADER}\n,a@x.com,paid,50,0,2026-01-01T00:00:00Z,SKU-1,Tee,1,50,,\n`
    const result = parseOrdersCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined).toHaveLength(1)
    expect(result.quarantined[0]!.reason).toBe('missing order name')
  })

  it('quarantines a row with an unparseable created-at date', () => {
    const csv = `${HEADER}\n#1003,a@x.com,paid,50,0,not-a-date,SKU-1,Tee,1,50,,\n`
    const result = parseOrdersCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined[0]!.reason).toBe('missing or unparseable created-at date')
  })

  it('quarantines the line item on a non-numeric Lineitem quantity, keeping the order shell (order-level fields were fine)', () => {
    const csv = `${HEADER}\n#1004,a@x.com,paid,50,0,2026-01-01T00:00:00Z,SKU-1,Tee,many,50,,\n`
    const result = parseOrdersCsv(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.lineItems).toEqual([])
    expect(result.quarantined[0]!.reason).toBe('non-numeric Lineitem quantity')
  })

  it('quarantines every row when the header has no recognizable order-name column', () => {
    const csv = 'Foo,Bar\n1,2\n3,4\n'
    const result = parseOrdersCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined).toHaveLength(2)
    expect(result.sourceRowCount).toBe(2)
  })

  it('returns empty results for an empty file', () => {
    expect(parseOrdersCsv('')).toEqual({
      rows: [],
      quarantined: [],
      sourceRowCount: 0,
      parserVersion: expect.any(String),
    })
  })

  it('sniffs a header with different casing/spacing than the canonical Shopify export', () => {
    const csv =
      'name, email ,financial status,total,refunded amount,created at,lineitem sku,lineitem name,lineitem quantity,lineitem price,shipping address1,shipping zip\n#2001,c@x.com,paid,20,0,2026-02-01T00:00:00Z,SKU-C,Cap,1,20,,\n'
    const result = parseOrdersCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows[0]!.orderName).toBe('#2001')
  })

  it('leaves shippingAddressKey null when address or zip is missing', () => {
    const csv = `${HEADER}\n#1005,a@x.com,paid,20,0,2026-01-01T00:00:00Z,SKU-1,Tee,1,20,9 Oak Ave,\n`
    const result = parseOrdersCsv(csv)
    expect(result.rows[0]!.shippingAddressKey).toBeNull()
  })

  it('normalizes address key case/whitespace so the same address clusters regardless of formatting', () => {
    const csv = [
      HEADER,
      '#1006,a@x.com,paid,20,0,2026-01-01T00:00:00Z,SKU-1,Tee,1,20, 9 OAK AVE ,10001',
    ].join('\n')
    const result = parseOrdersCsv(csv)
    expect(result.rows[0]!.shippingAddressKey).toBe('9 oak ave|10001')
  })
})
