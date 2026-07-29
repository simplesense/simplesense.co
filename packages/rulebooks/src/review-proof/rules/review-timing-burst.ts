import type { Rule } from '../../types'
import type { ReviewProofSnapshot } from '../types'

const MIN_DATED_REVIEWS = 10
const BURST_WINDOW_DAYS = 7
const BURST_DENSITY_MULTIPLIER = 3
const BURST_MIN_ABSOLUTE_COUNT = 5
const DAY_MS = 24 * 60 * 60 * 1000
const HIGH_RATING_THRESHOLD = 4

interface DatedReview {
  date: Date
  ratingValue: number | null
}

function latestSnapshotWithReviews(snapshot: ReviewProofSnapshot) {
  const sorted = [...snapshot.reviewWidgetHistory].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  )
  return sorted.length > 0 ? sorted[sorted.length - 1]! : null
}

function toDatedReviews(reviews: { datePublished: string | null; ratingValue: number | null }[]) {
  const out: DatedReview[] = []
  for (const r of reviews) {
    if (r.datePublished === null) continue
    const date = new Date(r.datePublished)
    if (Number.isNaN(date.getTime())) continue
    out.push({ date, ratingValue: r.ratingValue })
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Widest count of reviews landing within any BURST_WINDOW_DAYS-wide window, using each
 *  review as a candidate window start (sufficient for finding the densest window in a
 *  sorted-by-date array — the true maximum always starts at some review's own date). */
function maxWindowCount(sorted: DatedReview[]): { count: number; windowStart: Date } {
  let best = { count: 0, windowStart: sorted[0]!.date }
  for (let i = 0; i < sorted.length; i++) {
    const windowEnd = new Date(sorted[i]!.date.getTime() + BURST_WINDOW_DAYS * DAY_MS)
    let count = 0
    for (let j = i; j < sorted.length && sorted[j]!.date <= windowEnd; j++) count++
    if (count > best.count) best = { count, windowStart: sorted[i]!.date }
  }
  return best
}

/**
 * Uses S1 (`@ss/crawler`) to detect an unusually dense cluster of reviews landing in a
 * short window, relative to this store's own average posting rate — the pattern the
 * plan calls "purchased-review timing." A methodology call, not an external citation:
 * no regulator publishes a bright line for "how many reviews in how many days is
 * suspicious," so the threshold is SimpleSense's own, stated plainly rather than
 * implied to be authoritative.
 */
export const reviewTimingBurstRule: Rule<ReviewProofSnapshot> = {
  id: 'review_proof.review_timing_burst',
  title: 'Unusually dense review-timing cluster',
  severity: 'medium',
  citation: {
    label: 'SimpleSense ReviewProof benchmark v0 — review-timing-burst methodology',
  },
  remediationTemplate:
    'Cross-check the flagged date range against your own marketing calendar (promotions, launches, review-request campaigns) before concluding anything — a burst has legitimate explanations too.',
  version: '0.1.0',
  addedBecause:
    "S1's crawler unlocks the second of M3's crawler-dependent signals — a store's own review-timing distribution, not a cross-store benchmark.",
  detect(snapshot) {
    const latest = latestSnapshotWithReviews(snapshot)
    if (!latest) {
      return {
        status: 'insufficient',
        insufficientReason: 'No review-widget capture exists yet for this store.',
      }
    }
    const dated = toDatedReviews(latest.reviews)
    if (dated.length < MIN_DATED_REVIEWS) {
      return {
        status: 'insufficient',
        insufficientReason: `Only ${dated.length} dated review(s) found in the widget's structured data — this widget may not publish individual review dates, or too few exist yet to compute a reliable baseline (need at least ${MIN_DATED_REVIEWS}).`,
      }
    }

    const spanMs = Math.max(
      dated[dated.length - 1]!.date.getTime() - dated[0]!.date.getTime(),
      DAY_MS,
    )
    const spanDays = spanMs / DAY_MS
    const avgPerDay = dated.length / spanDays
    const expectedPerWindow = avgPerDay * BURST_WINDOW_DAYS
    const threshold = Math.max(
      expectedPerWindow * BURST_DENSITY_MULTIPLIER,
      BURST_MIN_ABSOLUTE_COUNT,
    )

    const { count: burstCount, windowStart } = maxWindowCount(dated)
    const windowEnd = new Date(windowStart.getTime() + BURST_WINDOW_DAYS * DAY_MS)
    const windowReviews = dated.filter((r) => r.date >= windowStart && r.date <= windowEnd)
    const highRatingShare =
      windowReviews.length > 0
        ? windowReviews.filter(
            (r) => r.ratingValue !== null && r.ratingValue >= HIGH_RATING_THRESHOLD,
          ).length / windowReviews.length
        : 0

    if (burstCount >= threshold) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `${burstCount} reviews landed within a single ${BURST_WINDOW_DAYS}-day window starting ${windowStart.toISOString().slice(0, 10)} — ${(burstCount / expectedPerWindow).toFixed(1)}x this store's average posting rate (${avgPerDay.toFixed(2)}/day over ${Math.round(spanDays)} days). ${Math.round(highRatingShare * 100)}% of the clustered reviews rated ${HIGH_RATING_THRESHOLD}+ stars.`,
          metrics: {
            burstCount,
            windowStartDate: windowStart.toISOString().slice(0, 10),
            avgPerDay: Math.round(avgPerDay * 100) / 100,
            burstMultiple: Math.round((burstCount / expectedPerWindow) * 10) / 10,
            highRatingShare: Math.round(highRatingShare * 100) / 100,
            totalDatedReviews: dated.length,
          },
        },
        action:
          'A sudden cluster of reviews can be a real event (a promotion, a viral moment, a review-request campaign) or a purchased/incentivized batch — cross-check the flagged date range against your own marketing calendar before concluding anything. Risk surfacing, not legal advice.',
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: `Review timing looks organic — the densest ${BURST_WINDOW_DAYS}-day window (${burstCount} reviews) is within normal range of this store's average posting rate (${avgPerDay.toFixed(2)}/day).`,
        metrics: {
          burstCount,
          avgPerDay: Math.round(avgPerDay * 100) / 100,
          totalDatedReviews: dated.length,
        },
      },
      action: 'No gap here — review timing looks organic.',
    }
  },
}
