import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildReviewWidgetSnapshot } from '../../src/review-proof/build-review-widget-snapshot'
import { runRulebook, reviewProof } from '@ss/rulebooks'
import type { Capture } from '@ss/crawler'

const { reviewProofRulebook } = reviewProof

const earlyHtml = readFileSync(
  new URL('../../../../fixtures/review-proof/case-01/review-widget-early.html', import.meta.url),
  'utf8',
)
const lateHtml = readFileSync(
  new URL('../../../../fixtures/review-proof/case-01/review-widget-late.html', import.meta.url),
  'utf8',
)

function fixtureCapture(html: string, fetchedAt: string): Capture {
  return {
    requestedUrl: 'https://cedarwood.example.com/products/cedarwood-candle',
    finalUrl: 'https://cedarwood.example.com/products/cedarwood-candle',
    fetchedAt,
    status: 200,
    html,
    screenshotBase64: 'x',
    sha256: 'x',
  }
}

/**
 * "Cedarwood Candle" fixture (fixtures/review-proof/case-01): two review-widget
 * captures over time with two deliberate, planted gaps — a review-count regression and
 * a review-timing burst. Proves the full chassis (Capture -> buildReviewWidgetSnapshot
 * -> rulebook) end to end against real (fixture) HTML.
 */
describe('M3 ReviewProof — end-to-end chassis (fixture case-01)', () => {
  it('flags both crawler-dependent signals, leaves the email signal insufficient', () => {
    const early = buildReviewWidgetSnapshot(fixtureCapture(earlyHtml, '2026-01-01T00:00:00.000Z'))
    const late = buildReviewWidgetSnapshot(fixtureCapture(lateHtml, '2026-03-01T00:00:00.000Z'))

    const findings = runRulebook(reviewProofRulebook, {
      emails: [],
      reviewWidgetHistory: [early, late],
    })
    expect(findings).toHaveLength(3)
    const byId = Object.fromEntries(findings.map((f) => [f.ruleId, f]))

    expect(byId['review_proof.incentivized_review_disclosure']!.status).toBe('insufficient')

    const regression = byId['review_proof.review_count_regression']!
    expect(regression.status).toBe('triggered')
    expect(regression.passed).toBe(false)
    expect(regression.evidence?.metrics.oldestCount).toBe(120)
    expect(regression.evidence?.metrics.newestCount).toBe(95)
    expect(regression.evidence?.metrics.lost).toBe(25)

    const burst = byId['review_proof.review_timing_burst']!
    expect(burst.status).toBe('triggered')
    expect(burst.passed).toBe(false)
    expect(burst.evidence?.metrics.burstCount).toBe(6)
    expect(burst.evidence?.metrics.totalDatedReviews).toBe(16)
    expect(burst.evidence?.metrics.highRatingShare).toBe(1) // all 6 clustered reviews are 5-star
  })
})
