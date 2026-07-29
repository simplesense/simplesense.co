import { describe, it, expect } from 'vitest'
import { buildReviewWidgetSnapshot } from '../../src/review-proof/build-review-widget-snapshot'
import type { Capture } from '@ss/crawler'

function fakeCapture(html: string): Capture {
  return {
    requestedUrl: 'https://example.com/products/candle',
    finalUrl: 'https://example.com/products/candle',
    fetchedAt: '2026-07-15T00:00:00.000Z',
    status: 200,
    html,
    screenshotBase64: 'x',
    sha256: 'x',
  }
}

describe('buildReviewWidgetSnapshot', () => {
  it('extracts aggregateReviewCount and aggregateRatingValue from AggregateRating JSON-LD', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","name":"Candle","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.6","reviewCount":"312"}}
    </script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.aggregateReviewCount).toBe(312)
    expect(snapshot.aggregateRatingValue).toBe(4.6)
    expect(snapshot.capturedAt).toBe('2026-07-15T00:00:00.000Z')
  })

  it('falls back to ratingCount when reviewCount is absent', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","aggregateRating":{"@type":"AggregateRating","ratingValue":4,"ratingCount":50}}
    </script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.aggregateReviewCount).toBe(50)
  })

  it('returns null (not zero) when no AggregateRating is found', () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"Candle"}</script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.aggregateReviewCount).toBeNull()
    expect(snapshot.aggregateRatingValue).toBeNull()
  })

  it('extracts individual dated Review nodes when present', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","review":[
        {"@type":"Review","datePublished":"2026-06-01","reviewRating":{"@type":"Rating","ratingValue":"5"}},
        {"@type":"Review","datePublished":"2026-06-02","reviewRating":{"@type":"Rating","ratingValue":"3"}}
      ]}
    </script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.reviews).toEqual([
      { datePublished: '2026-06-01', ratingValue: 5 },
      { datePublished: '2026-06-02', ratingValue: 3 },
    ])
  })

  it('returns an empty reviews array when the widget only emits an aggregate (no individual Review nodes)', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","aggregateRating":{"@type":"AggregateRating","ratingValue":4.5,"reviewCount":100}}
    </script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.reviews).toEqual([])
    expect(snapshot.aggregateReviewCount).toBe(100)
  })

  it('handles a Review with no rating gracefully (null, not a crash)', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","review":[{"@type":"Review","datePublished":"2026-06-01"}]}
    </script>`
    const snapshot = buildReviewWidgetSnapshot(fakeCapture(html))
    expect(snapshot.reviews).toEqual([{ datePublished: '2026-06-01', ratingValue: null }])
  })

  it('returns everything null/empty for a page with no structured data at all', () => {
    const snapshot = buildReviewWidgetSnapshot(
      fakeCapture('<html><body>no schema here</body></html>'),
    )
    expect(snapshot.aggregateReviewCount).toBeNull()
    expect(snapshot.aggregateRatingValue).toBeNull()
    expect(snapshot.reviews).toEqual([])
  })
})
