/**
 * Canonical normalized domain types for the analysis core.
 *
 * These are framework-free and decoupled from Shopify's wire format: the ingestion
 * layer (packages/jobs / integrations) maps Shopify GraphQL into these shapes, and
 * every analyzer consumes ONLY these. Money is expressed in the store's currency
 * major units (e.g. dollars) as a plain number, consistently, so analyzer math is
 * trivially auditable. Document the unit on every Metric you emit.
 */

export interface Address {
  city?: string | null
  region?: string | null // state / province
  country?: string | null
  zip?: string | null
  lat?: number | null
  lng?: number | null
}

export interface Customer {
  id: string
  email?: string | null
  defaultAddress?: Address | null
  firstOrderAt?: Date | null
}

export interface Product {
  id: string
  title: string
  type?: string | null
  /** Per-unit cost of goods, store currency. Null when unknown (margin → insufficient). */
  unitCost?: number | null
}

export interface LineItem {
  productId?: string | null
  quantity: number
  /** Per-unit price actually charged, store currency major units. */
  price: number
  /** Per-line discount allocated, store currency. Defaults to 0. */
  discount?: number
}

export interface Order {
  id: string
  customerId?: string | null
  createdAt: Date
  /** Gross order total, store currency major units. */
  totalPrice: number
  /** Total discount applied to the order, store currency. */
  discountTotal: number
  currency: string
  shippingAddress?: Address | null
  lineItems: LineItem[]
  /** Shopify source/channel name where present (e.g. "web", "pos", "google"). */
  sourceName?: string | null
  /** Total refunded across the order's lifetime, store currency. Defaults to 0. */
  refundedAmount?: number
}

export interface StoreLocation {
  id: string
  name: string
  lat?: number | null
  lng?: number | null
  address?: Address | null
}

export interface NormalizedStore {
  storeId: string
  currency: string
  /** True when the store operates physical locations (POS / local pickup). */
  hasPhysicalLocations: boolean
  locations: StoreLocation[]
  customers: Customer[]
  products: Product[]
  orders: Order[]
  /** Configured free-shipping threshold, store currency, or null if none. */
  freeShippingThreshold?: number | null
}

/**
 * A computed fact — the grounding source of truth. Every number rendered to a user
 * traces to one of these. `key` is the stable, dotted, namespaced id the LLM cites
 * in `evidence_metric_ids`. `valueNumeric: null` + `insufficientData: true` means
 * "not enough data to compute" — never fabricate a number to fill the gap.
 */
export interface Metric {
  key: string
  valueNumeric: number | null
  valueJson?: unknown
  /** 'ratio' | 'USD' | 'days' | 'count' | 'USD/order' | ... */
  unit?: string
  /** e.g. 'trailing_24m', 'all_time'. */
  window?: string
  insufficientData?: boolean
  /** Human-readable context (no PII) — e.g. "only 3 customers; need >= 5". */
  note?: string
}

export interface AnalyzerContext {
  store: NormalizedStore
  /** Injected "now" — analyzers must never read the system clock (determinism). */
  now: Date
  /** Trailing analysis window in months (e.g. 24). */
  windowMonths: number
}

export type Analyzer = (ctx: AnalyzerContext) => Metric[]
