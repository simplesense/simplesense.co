import { parseCsv } from './parse-csv'
import { sniffHeader, cell, parseAmount, parseQuantity } from './sniff'
import type { NormalizedOrder, ParseResult, QuarantinedRow } from './types'

type Field =
  | 'orderName'
  | 'email'
  | 'createdAt'
  | 'financialStatus'
  | 'total'
  | 'refundedAmount'
  | 'lineitemSku'
  | 'lineitemName'
  | 'lineitemQuantity'
  | 'lineitemPrice'
  | 'shippingAddress1'
  | 'shippingZip'

/** Bump on any alias added/changed — see `ParseResult.parserVersion`. */
export const ORDERS_PARSER_VERSION = '0.1.0'

/** Aliases verified against help.shopify.com/en/manual/orders/export-orders (this session). */
const ALIASES: Record<Field, string[]> = {
  orderName: ['Name'],
  email: ['Email'],
  createdAt: ['Created at'],
  financialStatus: ['Financial Status'],
  total: ['Total'],
  refundedAmount: ['Refunded Amount'],
  lineitemSku: ['Lineitem sku'],
  lineitemName: ['Lineitem name'],
  lineitemQuantity: ['Lineitem quantity'],
  lineitemPrice: ['Lineitem price'],
  shippingAddress1: ['Shipping Address1'],
  shippingZip: ['Shipping Zip'],
}

function shippingAddressKey(address1: string, zip: string): string | null {
  if (!address1 || !zip) return null
  return `${address1.toLowerCase().trim()}|${zip.toLowerCase().trim()}`
}

/**
 * Parses a Shopify order-export CSV into one `NormalizedOrder` per order, folding
 * together the multiple line-item rows Shopify emits per multi-item order (order-level
 * columns are populated on that order's first row and blank on the rest — real,
 * documented Shopify export behavior, not a guess: see TASK.md's [ASSUMED] note).
 * Rows that can't be interpreted are quarantined, never thrown or silently zeroed.
 */
export function parseOrdersCsv(text: string): ParseResult<NormalizedOrder> {
  const grid = parseCsv(text)
  if (grid.length === 0) {
    return { rows: [], quarantined: [], sourceRowCount: 0, parserVersion: ORDERS_PARSER_VERSION }
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
        reason: 'header did not include a recognized order-name or created-at column',
      })
    }
    return {
      rows: [],
      quarantined,
      sourceRowCount: dataRows.length,
      parserVersion: ORDERS_PARSER_VERSION,
    }
  }

  const orders = new Map<string, NormalizedOrder>()

  dataRows.forEach((row, i) => {
    const rowNumber = i + 2
    const raw = Object.fromEntries(header.map((h, c) => [h, row[c] ?? '']))
    const orderName = cell(row, idx.orderName)
    if (!orderName) {
      quarantined.push({ rowNumber, raw, reason: 'missing order name' })
      return
    }

    let order = orders.get(orderName)
    if (!order) {
      const createdAt = cell(row, idx.createdAt)
      if (!createdAt || Number.isNaN(Date.parse(createdAt))) {
        quarantined.push({ rowNumber, raw, reason: 'missing or unparseable created-at date' })
        return
      }
      const totalRaw = cell(row, idx.total)
      const total = totalRaw === '' ? 0 : parseAmount(totalRaw)
      if (total === null) {
        quarantined.push({ rowNumber, raw, reason: 'non-numeric Total' })
        return
      }
      const refundedRaw = cell(row, idx.refundedAmount)
      const refundedAmount = refundedRaw === '' ? 0 : parseAmount(refundedRaw)
      if (refundedAmount === null) {
        quarantined.push({ rowNumber, raw, reason: 'non-numeric Refunded Amount' })
        return
      }
      order = {
        orderName,
        email: cell(row, idx.email) || null,
        createdAt,
        financialStatus: cell(row, idx.financialStatus) || null,
        total,
        refundedAmount,
        lineItems: [],
        shippingAddressKey: shippingAddressKey(
          cell(row, idx.shippingAddress1),
          cell(row, idx.shippingZip),
        ),
      }
      orders.set(orderName, order)
    }

    const lineitemName = cell(row, idx.lineitemName)
    const quantityRaw = cell(row, idx.lineitemQuantity)
    const priceRaw = cell(row, idx.lineitemPrice)
    if (!lineitemName && quantityRaw === '' && priceRaw === '') return // order-summary row, no line item

    const quantity = parseQuantity(quantityRaw)
    if (quantity === null) {
      quarantined.push({ rowNumber, raw, reason: 'non-numeric Lineitem quantity' })
      return
    }
    const price = parseAmount(priceRaw)
    if (price === null) {
      quarantined.push({ rowNumber, raw, reason: 'non-numeric Lineitem price' })
      return
    }
    order.lineItems.push({
      sku: cell(row, idx.lineitemSku) || null,
      name: lineitemName,
      quantity,
      price,
    })
  })

  return {
    rows: [...orders.values()],
    quarantined,
    sourceRowCount: dataRows.length,
    parserVersion: ORDERS_PARSER_VERSION,
  }
}
