/**
 * ReviewProof (COMPOUND_ENGINEERING_PLAN.md M3). v0 scanned only review-request emails
 * (no crawler existed). Now that S1 (`@ss/crawler`) and S6 (`@ss/capture-archive`)
 * exist, this snapshot also carries a review-widget capture history, unlocking 2 more
 * real signals: review-count regression and review-timing bursts (see
 * `rules/review-count-regression.ts` and `rules/review-timing-burst.ts`).
 *
 * Still explicitly out of scope, staying `insufficient` forever rather than being
 * faked with an ungrounded heuristic (see PARKING_LOT.md): "insider reviews" (not
 * detectable from public crawl data without a second, non-public data source) and
 * "review hijacking" (dropped from the FTC's *final* rule, per PARKING_LOT.md).
 */

export interface ReviewRequestEmail {
  id: string
  subject: string
  body: string
  /** ISO date, if known — optional, not used by v0's one rule. */
  sentAt?: string
}

export interface ReviewWidgetSnapshot {
  /** ISO timestamp — when this capture was taken (`Capture.fetchedAt`, not when it was archived). */
  capturedAt: string
  /** From the page's schema.org `AggregateRating`, if present. Null when the widget
   *  doesn't expose one (or none was found) — never assumed to be zero. */
  aggregateReviewCount: number | null
  aggregateRatingValue: number | null
  /** From individual schema.org `Review` nodes, if the widget emits them (not every
   *  widget does — many only emit the aggregate). Empty when none were found. */
  reviews: { datePublished: string | null; ratingValue: number | null }[]
}

export interface ReviewProofSnapshot {
  emails: ReviewRequestEmail[]
  /** Oldest first. Empty when no crawl has ever run for this store — rules consuming
   *  this must return `insufficient`, never treat an empty history as "no change." */
  reviewWidgetHistory: ReviewWidgetSnapshot[]
}
