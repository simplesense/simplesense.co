import { parseCsv } from './parse-csv'
import { sniffHeader, cell, parseAmount, parseQuantity } from './sniff'
import type { NormalizedReturn, ParseResult, QuarantinedRow } from './types'

type Field =
  | 'orderName'
  | 'email'
  | 'sku'
  | 'quantity'
  | 'reason'
  | 'status'
  | 'refundAmount'
  | 'createdAt'
  | 'processedAt'

/** Bump on any alias added/changed — see `ParseResult.parserVersion`. */
export const RETURNS_PARSER_VERSION = '0.1.0'

/**
 * Alias list covers the real Shopify Return/ReturnLineItem GraphQL field names
 * (shopify.dev, verified this session) plus common export-tool label variants, since
 * there is no single standardized "export returns to CSV" format the way orders have
 * one. Unrecognized headers fall through to quarantine rather than a guessed mapping.
 */
const ALIASES: Record<Field, string[]> = {
  orderName: ['Order Name', 'Order', 'Order Id', 'Name'],
  email: ['Email', 'Customer Email'],
  sku: ['Sku', 'Lineitem sku', 'Item Sku'],
  quantity: ['Quantity', 'Return Quantity', 'Lineitem quantity'],
  reason: ['Reason', 'Return Reason', 'Return Reason Note'],
  status: ['Status', 'Return Status'],
  refundAmount: ['Refund Amount', 'Refunded Amount', 'Amount'],
  createdAt: ['Created At', 'Return Requested At', 'Requested At'],
  processedAt: ['Processed At', 'Closed At', 'Return Closed At'],
}

/**
 * Parses a returns-export CSV (native Shopify Returns view, a Returns analytics
 * report, or a third-party returns app's export) into one `NormalizedReturn` per
 * return line item. See TASK.md for why this is alias-sniffed rather than one
 * hardcoded schema.
 */
export function parseReturnsCsv(text: string): ParseResult<NormalizedReturn> {
  const grid = parseCsv(text)
  if (grid.length === 0) {
    return { rows: [], quarantined: [], sourceRowCount: 0, parserVersion: RETURNS_PARSER_VERSION }
  }

  // Safe: the length check above guarantees at least one row.
  const header = grid[0]!
  const dataRows = grid.slice(1)
  const idx = sniffHeader(header, ALIASES)
  const quarantined: QuarantinedRow[] = []

  if (idx.orderName === undefined || idx.createdAt === undefined) {
    for (let i = 0; i < dataRows.length; i++) {
      quarantined.push({
        rowNumber: i + 2,
        raw: Object.fromEntries(header.map((h, c) => [h, dataRows[i]![c] ?? ''])),
        reason: 'header did not include a recognized order or created-at column',
      })
    }
    return {
      rows: [],
      quarantined,
      sourceRowCount: dataRows.length,
      parserVersion: RETURNS_PARSER_VERSION,
    }
  }

  const rows: NormalizedReturn[] = []
  dataRows.forEach((row, i) => {
    const rowNumber = i + 2
    const raw = Object.fromEntries(header.map((h, c) => [h, row[c] ?? '']))
    const orderName = cell(row, idx.orderName)
    if (!orderName) {
      quarantined.push({ rowNumber, raw, reason: 'missing order reference' })
      return
    }
    const createdAt = cell(row, idx.createdAt)
    if (!createdAt || Number.isNaN(Date.parse(createdAt))) {
      quarantined.push({ rowNumber, raw, reason: 'missing or unparseable created-at date' })
      return
    }
    const quantityRaw = cell(row, idx.quantity)
    const quantity = quantityRaw === '' ? 1 : parseQuantity(quantityRaw)
    if (quantity === null) {
      quarantined.push({ rowNumber, raw, reason: 'non-numeric quantity' })
      return
    }
    const refundRaw = cell(row, idx.refundAmount)
    const refundAmount = refundRaw === '' ? 0 : parseAmount(refundRaw)
    if (refundAmount === null) {
      quarantined.push({ rowNumber, raw, reason: 'non-numeric refund amount' })
      return
    }
    const processedAt = cell(row, idx.processedAt)
    if (processedAt && Number.isNaN(Date.parse(processedAt))) {
      quarantined.push({ rowNumber, raw, reason: 'unparseable processed-at date' })
      return
    }
    rows.push({
      orderName,
      email: cell(row, idx.email) || null,
      sku: cell(row, idx.sku) || null,
      quantity,
      reason: cell(row, idx.reason) || null,
      status: cell(row, idx.status) || null,
      refundAmount,
      createdAt,
      processedAt: processedAt || null,
    })
  })

  return {
    rows,
    quarantined,
    sourceRowCount: dataRows.length,
    parserVersion: RETURNS_PARSER_VERSION,
  }
}
