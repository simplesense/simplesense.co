import { describe, it, expect } from 'vitest'
import { reviewTimingBurstRule } from '../../src/review-proof/rules/review-timing-burst'
import type { ReviewWidgetSnapshot } from '../../src/review-proof/types'

const DAY_MS = 24 * 60 * 60 * 1000
const BASE = new Date('2026-01-01T00:00:00.000Z').getTime()

function iso(offsetDays: number): string {
  return new Date(BASE + offsetDays * DAY_MS).toISOString()
}

function evenlySpread(count: number, spacingDays: number, ratingValue = 3) {
  return Array.from({ length: count }, (_, i) => ({
    datePublished: iso(i * spacingDays),
    ratingValue,
  }))
}

function snapshotWith(
  reviews: { datePublished: string | null; ratingValue: number | null }[],
): ReviewWidgetSnapshot {
  return {
    capturedAt: iso(9999),
    aggregateReviewCount: reviews.length,
    aggregateRatingValue: 4.2,
    reviews,
  }
}

describe('reviewTimingBurstRule', () => {
  it('is insufficient with no capture history', () => {
    const f = reviewTimingBurstRule.detect({ emails: [], reviewWidgetHistory: [] })
    expect(f.status).toBe('insufficient')
  })

  it('is insufficient when the widget has no per-review dates at all', () => {
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [
        snapshotWith(Array.from({ length: 20 }, () => ({ datePublished: null, ratingValue: 5 }))),
      ],
    })
    expect(f.status).toBe('insufficient')
  })

  it('is insufficient with fewer than 10 dated reviews', () => {
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [snapshotWith(evenlySpread(5, 10))],
    })
    expect(f.status).toBe('insufficient')
  })

  it('passes (organic) for reviews evenly spread well below the burst threshold', () => {
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [snapshotWith(evenlySpread(20, 10))],
    })
    expect(f.status).toBe('triggered')
    expect(f.passed).toBe(true)
  })

  it('flags a dense cluster of high-rated reviews landing within one window', () => {
    const baseline = evenlySpread(20, 10) // ~0.1/day baseline, spread over 190 days
    const burst = Array.from({ length: 6 }, (_, i) => ({
      datePublished: iso(50 + i), // 6 reviews within a 6-day span
      ratingValue: 5,
    }))
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [snapshotWith([...baseline, ...burst])],
    })
    expect(f.status).toBe('triggered')
    expect(f.passed).toBe(false)
    expect(f.evidence?.metrics.burstCount).toBeGreaterThanOrEqual(6)
    expect(f.evidence?.metrics.highRatingShare).toBeGreaterThan(0.5)
  })

  it('uses only the most recent capture, not stale history', () => {
    const stale = snapshotWith(
      Array.from({ length: 6 }, (_, i) => ({ datePublished: iso(50 + i), ratingValue: 5 })),
    )
    const fresh = { ...snapshotWith(evenlySpread(20, 10)), capturedAt: iso(20000) }
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [stale, fresh],
    })
    expect(f.passed).toBe(true) // the burst only exists in the stale snapshot
  })

  it('ignores reviews with no date when computing the dated-review count', () => {
    const withNulls = [
      ...evenlySpread(20, 10),
      ...Array.from({ length: 5 }, () => ({ datePublished: null, ratingValue: 5 })),
    ]
    const f = reviewTimingBurstRule.detect({
      emails: [],
      reviewWidgetHistory: [snapshotWith(withNulls)],
    })
    expect(f.evidence?.metrics.totalDatedReviews).toBe(20)
  })
})
