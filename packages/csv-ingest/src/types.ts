/**
 * S2 CSV ingest kit (COMPOUND_ENGINEERING_PLAN.md §3) — schema sniffing + versioned
 * parsers for Shopify order/return exports, quarantine-on-drift rather than throwing
 * or silently coercing bad rows. Serves M5 ReturnLens first.
 */

export interface QuarantinedRow {
  /** 1-based, counting the header row as row 1 (matches what a spreadsheet shows). */
  rowNumber: number
  raw: Record<string, string>
  reason: string
}

export interface ParseResult<T> {
  rows: T[]
  quarantined: QuarantinedRow[]
  /** Data rows read from the file, before quarantine — rows.length + quarantined.length. */
  sourceRowCount: number
  /**
   * Semver of the column-alias map that produced this result — bump whenever aliases
   * are added/changed, so a report can cite exactly which schema version parsed it
   * (useful when Shopify or a returns app changes its export format later).
   */
  parserVersion: string
}

export interface OrderLineItem {
  sku: string | null
  name: string
  quantity: number
  price: number
}

/**
 * One Shopify order, reconstructed from its (possibly multiple) line-item rows.
 * Field names/shape verified against Shopify's documented order-export CSV columns
 * (help.shopify.com/en/manual/orders/export-orders) — see rulebooks TASK.md for the
 * verification note.
 */
export interface NormalizedOrder {
  orderName: string
  email: string | null
  createdAt: string
  financialStatus: string | null
  total: number
  refundedAmount: number
  lineItems: OrderLineItem[]
  /**
   * Normalized `"${address1}|${zip}"` (lowercased, trimmed), or null if either part was
   * missing — used only to cluster orders by physical address for entity resolution
   * (M5's "same address, multiple emails" signal), never displayed as-is.
   */
  shippingAddressKey: string | null
}

/**
 * One return-line-item event. Column names are sniffed via alias matching (see
 * sniff.ts) rather than a single hardcoded schema — Shopify does not document one
 * standardized "export returns to CSV" format the way it does for orders (verified:
 * only the native Return/ReturnLineItem GraphQL object is standardized; the export
 * mechanism varies — Shopify's Returns admin view, a Returns analytics report, or a
 * third-party returns app each produce different column names). `status`/`reason`
 * are modeled on the real `ReturnStatus`/`ReturnReason` enums (shopify.dev) but kept
 * as `string | null` here rather than a closed union, since a merchant's actual
 * export may use display labels ("Wrong size") rather than the enum code
 * ("SIZE_TOO_LARGE") — the rulebook works off the raw string, never assumes casing.
 */
export interface NormalizedReturn {
  orderName: string
  email: string | null
  sku: string | null
  quantity: number
  reason: string | null
  status: string | null
  refundAmount: number
  createdAt: string
  processedAt: string | null
}
