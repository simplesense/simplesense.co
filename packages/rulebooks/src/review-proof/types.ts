/**
 * ReviewProof (COMPOUND_ENGINEERING_PLAN.md M3). v0 scope is intentionally narrow —
 * see LEDGER.md's 2026-07-24 entry: 4 of the plan's 5 named signals (review
 * suppression, insider reviews, purchased-review timing, and what the plan calls
 * "review hijacking" — dropped from the FTC's *final* rule, see PARKING_LOT.md) need
 * crawled review-widget data only S1 can collect. This module's only real signal today
 * is text analysis of review-request emails a client forwards — no crawler needed.
 */

export interface ReviewRequestEmail {
  id: string
  subject: string
  body: string
  /** ISO date, if known — optional, not used by v0's one rule. */
  sentAt?: string
}

export interface ReviewProofSnapshot {
  emails: ReviewRequestEmail[]
}
