import { describe, it, expect } from 'vitest'
import { parseReturnsCsv } from '../src/returns'

const HEADER = 'Order Name,Email,Sku,Quantity,Reason,Status,Refund Amount,Created At,Processed At'

describe('parseReturnsCsv', () => {
  it('parses a well-formed return row', () => {
    const csv = `${HEADER}\n#1001,a@x.com,SKU-1,1,SIZE_TOO_LARGE,CLOSED,50.00,2026-01-10T00:00:00Z,2026-01-14T00:00:00Z\n`
    const result = parseReturnsCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows).toEqual([
      {
        orderName: '#1001',
        email: 'a@x.com',
        sku: 'SKU-1',
        quantity: 1,
        reason: 'SIZE_TOO_LARGE',
        status: 'CLOSED',
        refundAmount: 50,
        createdAt: '2026-01-10T00:00:00Z',
        processedAt: '2026-01-14T00:00:00Z',
      },
    ])
  })

  it('defaults quantity to 1 when the column is blank', () => {
    const csv = `${HEADER}\n#1002,a@x.com,SKU-1,,WRONG_ITEM,OPEN,0,2026-01-10T00:00:00Z,\n`
    const result = parseReturnsCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows[0]!.quantity).toBe(1)
    expect(result.rows[0]!.processedAt).toBeNull()
  })

  it('quarantines a row missing the order reference', () => {
    const csv = `${HEADER}\n,a@x.com,SKU-1,1,OTHER,OPEN,10,2026-01-10T00:00:00Z,\n`
    const result = parseReturnsCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined[0]!.reason).toBe('missing order reference')
  })

  it('quarantines a row with a non-numeric refund amount', () => {
    const csv = `${HEADER}\n#1003,a@x.com,SKU-1,1,OTHER,OPEN,N/A,2026-01-10T00:00:00Z,\n`
    const result = parseReturnsCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined[0]!.reason).toBe('non-numeric refund amount')
  })

  it('quarantines a row with an unparseable processed-at date', () => {
    const csv = `${HEADER}\n#1004,a@x.com,SKU-1,1,OTHER,CLOSED,10,2026-01-10T00:00:00Z,whenever\n`
    const result = parseReturnsCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined[0]!.reason).toBe('unparseable processed-at date')
  })

  it('sniffs an alternate column-name set from a third-party returns app', () => {
    const altHeader =
      'Order,Customer Email,Item Sku,Return Quantity,Return Reason,Return Status,Amount,Return Requested At,Return Closed At'
    const csv = `${altHeader}\n#1005,d@x.com,SKU-2,2,DEFECTIVE,CLOSED,80,2026-01-05T00:00:00Z,2026-01-09T00:00:00Z\n`
    const result = parseReturnsCsv(csv)
    expect(result.quarantined).toEqual([])
    expect(result.rows[0]!.orderName).toBe('#1005')
    expect(result.rows[0]!.reason).toBe('DEFECTIVE')
  })

  it('quarantines every row when no recognizable order/created-at columns exist', () => {
    const csv = 'Foo,Bar\n1,2\n'
    const result = parseReturnsCsv(csv)
    expect(result.rows).toEqual([])
    expect(result.quarantined).toHaveLength(1)
  })

  it('returns empty results for an empty file', () => {
    expect(parseReturnsCsv('')).toEqual({
      rows: [],
      quarantined: [],
      sourceRowCount: 0,
      parserVersion: expect.any(String),
    })
  })
})
