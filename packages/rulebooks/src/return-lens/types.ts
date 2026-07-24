/**
 * The normalized/analyzed input to the ReturnLens rulebook (COMPOUND_ENGINEERING_PLAN.md
 * M5). `@ss/csv-ingest` (S2) turns raw order/return CSV exports into `NormalizedOrder[]`/
 * `NormalizedReturn[]`; `analyzeReturns()` (this package's `return-lens/derive.ts`) turns
 * those into this pre-aggregated snapshot — mirroring M8's chassis, where rules never
 * re-derive raw data themselves, they read fields a separate "analyze" step computed once.
 */

export interface EntitySummary {
  /** Internal cluster id — not customer-facing. */
  key: string
  /** Every distinct email resolved into this entity (>1 means cross-email resolution fired). */
  emails: string[]
  /** True when this entity's orders span more than one email at the same shipping address. */
  spansMultipleEmails: boolean
  orderCount: number
  /** Orders with at least one associated return. */
  returnedOrderCount: number
  returnRate: number
  refundTotal: number
}

export interface SkuReturnSummary {
  sku: string
  orderedQuantity: number
  returnedQuantity: number
  returnRate: number
  /** Most common non-null return reason recorded against this SKU, if any. */
  dominantReason: string | null
}

export interface BracketingCandidate {
  orderName: string
  /** The line-item name/SKU with size/variant tokens stripped (v0 heuristic — see derive.ts). */
  baseStyle: string
  variantsOrdered: number
  variantsReturned: number
}

export interface WardrobingStats {
  totalReturns: number
  /** Returns filed within the "wear window" (see derive.ts for the exact day range). */
  wearWindowReturns: number
  /** null when totalReturns === 0 — nothing to compute a share of. */
  wearWindowSharePct: number | null
}

export interface ReturnsSnapshot {
  windowDays: number
  orderCount: number
  returnCount: number
  entities: EntitySummary[]
  /** Mean return rate across entities with >=2 orders. Null when too few to baseline. */
  cohortAvgReturnRate: number | null
  skuStats: SkuReturnSummary[]
  bracketingCandidates: BracketingCandidate[]
  wardrobing: WardrobingStats
}
