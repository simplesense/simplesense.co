import { describe, it, expect } from 'vitest'
import { reviewCountRegressionRule } from '../../src/review-proof/rules/review-count-regression'
import type { ReviewWidgetSnapshot } from '../../src/review-proof/types'

function widgetSnapshot(over: Partial<ReviewWidgetSnapshot> = {}): ReviewWidgetSnapshot {
  return {
    capturedAt: '2026-07-01T00:00:00.000Z',
    aggregateReviewCount: 100,
    aggregateRatingValue: 4.5,
    reviews: [],
    ...over,
  }
}

describe('reviewCountRegressionRule', () => {
  it('is insufficient with zero snapshots', () => {
    const f = reviewCountRegressionRule.detect({ emails: [], reviewWidgetHistory: [] })
    expect(f.status).toBe('insufficient')
  })

  it('is insufficient with only one snapshot', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [widgetSnapshot()],
    })
    expect(f.status).toBe('insufficient')
  })

  it('is insufficient when snapshots exist but never captured an aggregate count', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ aggregateReviewCount: null }),
        widgetSnapshot({ aggregateReviewCount: null, capturedAt: '2026-07-08T00:00:00.000Z' }),
      ],
    })
    expect(f.status).toBe('insufficient')
  })

  it('triggers with passed=false when the review count dropped', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ capturedAt: '2026-07-01T00:00:00.000Z', aggregateReviewCount: 120 }),
        widgetSnapshot({ capturedAt: '2026-07-15T00:00:00.000Z', aggregateReviewCount: 95 }),
      ],
    })
    expect(f.status).toBe('triggered')
    expect(f.passed).toBe(false)
    expect(f.evidence?.metrics.lost).toBe(25)
    expect(f.evidence?.summary).toContain('120')
    expect(f.evidence?.summary).toContain('95')
  })

  it('triggers with passed=true when the review count grew', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ capturedAt: '2026-07-01T00:00:00.000Z', aggregateReviewCount: 100 }),
        widgetSnapshot({ capturedAt: '2026-07-15T00:00:00.000Z', aggregateReviewCount: 110 }),
      ],
    })
    expect(f.status).toBe('triggered')
    expect(f.passed).toBe(true)
  })

  it('triggers with passed=true when the review count held steady', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ capturedAt: '2026-07-01T00:00:00.000Z', aggregateReviewCount: 100 }),
        widgetSnapshot({ capturedAt: '2026-07-15T00:00:00.000Z', aggregateReviewCount: 100 }),
      ],
    })
    expect(f.passed).toBe(true)
  })

  it('compares oldest vs newest even when snapshots are given out of order', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ capturedAt: '2026-07-15T00:00:00.000Z', aggregateReviewCount: 95 }),
        widgetSnapshot({ capturedAt: '2026-07-01T00:00:00.000Z', aggregateReviewCount: 120 }),
      ],
    })
    expect(f.passed).toBe(false)
    expect(f.evidence?.metrics.oldestCount).toBe(120)
    expect(f.evidence?.metrics.newestCount).toBe(95)
  })

  it('ignores snapshots with a null count when picking oldest/newest', () => {
    const f = reviewCountRegressionRule.detect({
      emails: [],
      reviewWidgetHistory: [
        widgetSnapshot({ capturedAt: '2026-07-01T00:00:00.000Z', aggregateReviewCount: 120 }),
        widgetSnapshot({ capturedAt: '2026-07-08T00:00:00.000Z', aggregateReviewCount: null }),
        widgetSnapshot({ capturedAt: '2026-07-15T00:00:00.000Z', aggregateReviewCount: 95 }),
      ],
    })
    expect(f.evidence?.metrics.snapshotCount).toBe(2)
  })
})
