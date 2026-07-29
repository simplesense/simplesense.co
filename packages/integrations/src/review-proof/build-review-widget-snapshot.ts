import type { Capture } from '@ss/crawler'
import type { ReviewWidgetSnapshot } from '@ss/rulebooks'
import { extractJsonLd, flattenJsonLdTypes, hasType } from '../json-ld'

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

function toDateString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

/**
 * Builds one `ReviewWidgetSnapshot` from a single S1 crawler `Capture` — extracts
 * schema.org `AggregateRating` (reviewCount/ratingValue) and any individual `Review`
 * nodes (datePublished/reviewRating) the widget emits as JSON-LD. Most review-widget
 * apps (Yotpo, Judge.me, Loox, Okendo, Stamped, ...) emit `AggregateRating` for SEO;
 * fewer emit individual dated `Review` nodes, which is why `reviews` can legitimately
 * be empty even when `aggregateReviewCount` is populated — the two rules that consume
 * this handle that gap independently rather than assuming one implies the other.
 */
export function buildReviewWidgetSnapshot(capture: Capture): ReviewWidgetSnapshot {
  const nodes = flattenJsonLdTypes(extractJsonLd(capture.html))

  const aggregateNode = nodes.find((n) => hasType(n, 'AggregateRating'))
  const aggregateReviewCount = aggregateNode
    ? toNumber(aggregateNode.reviewCount ?? aggregateNode.ratingCount)
    : null
  const aggregateRatingValue = aggregateNode ? toNumber(aggregateNode.ratingValue) : null

  const reviews = nodes
    .filter((n) => hasType(n, 'Review'))
    .map((n) => {
      const ratingNode =
        n.reviewRating && typeof n.reviewRating === 'object'
          ? (n.reviewRating as Record<string, unknown>)
          : null
      return {
        datePublished: toDateString(n.datePublished),
        ratingValue: ratingNode ? toNumber(ratingNode.ratingValue) : null,
      }
    })

  return {
    capturedAt: capture.fetchedAt,
    aggregateReviewCount,
    aggregateRatingValue,
    reviews,
  }
}
