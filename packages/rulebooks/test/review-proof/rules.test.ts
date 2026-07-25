import { describe, it, expect } from 'vitest'
import { runRulebook } from '../../src/engine'
import { reviewProofRulebook } from '../../src/review-proof/rulebook'
import type { ReviewProofSnapshot, ReviewRequestEmail } from '../../src/review-proof/types'

function email(over: Partial<ReviewRequestEmail> = {}): ReviewRequestEmail {
  return { id: 'e1', subject: 'How was your order?', body: 'We would love your feedback!', ...over }
}

function findFinding(snapshot: ReviewProofSnapshot) {
  const findings = runRulebook(reviewProofRulebook, snapshot)
  const f = findings.find((x) => x.ruleId === 'review_proof.incentivized_review_disclosure')
  if (!f) throw new Error('finding not found')
  return f
}

describe('incentivizedReviewDisclosureRule', () => {
  it('is insufficient with no emails provided', () => {
    const f = findFinding({ emails: [] })
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap for a plain feedback-request email', () => {
    const f = findFinding({ emails: [email()] })
    expect(f.status).toBe('triggered')
    expect(f.action).toMatch(/no gap/i)
  })

  it('does not flag an incentive offered for ANY review, positive or negative', () => {
    // Legal per the FTC rule: incentivizing a review in general is fine.
    const f = findFinding({
      emails: [
        email({ body: 'Leave a review and get 10% off your next order — any review helps us!' }),
      ],
    })
    expect(f.action).toMatch(/no gap/i)
  })

  it('does not flag positive-sentiment language alone with no incentive', () => {
    const f = findFinding({
      emails: [email({ body: 'We hope you had a great experience — leave us a 5-star review!' })],
    })
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags an incentive contingent on a positive review specifically', () => {
    const f = findFinding({
      emails: [
        email({
          id: 'bad-1',
          body: 'Leave us a 5-star review and get 20% off your next order!',
        }),
      ],
    })
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
    expect(f.evidence?.metrics.flaggedIds).toBe('bad-1')
    expect(f.action).toContain('16 CFR Part 465')
  })

  it('checks the subject line too, not just the body', () => {
    const f = findFinding({
      emails: [
        email({
          id: 'bad-2',
          subject: 'Get 15% off for a great review!',
          body: 'We appreciate your business.',
        }),
      ],
    })
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
  })

  it('scans multiple emails and reports only the flagged ones', () => {
    const f = findFinding({
      emails: [
        email({ id: 'clean-1' }),
        email({ id: 'bad-1', body: 'Leave us a 5-star review and get a free gift!' }),
        email({ id: 'clean-2', body: 'Leave any review and get 10% off — good or bad!' }),
      ],
    })
    expect(f.evidence?.metrics.scannedCount).toBe(3)
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
    expect(f.evidence?.metrics.flaggedIds).toBe('bad-1')
  })

  it('every finding carries the required "risk surfacing, not legal advice" framing', () => {
    const clean = findFinding({ emails: [email()] })
    const flagged = findFinding({
      emails: [email({ body: 'Leave us a 5-star review and get a free gift!' })],
    })
    expect(clean.action).toMatch(/risk surfacing, not legal advice/i)
    expect(flagged.action).toMatch(/counsel/i)
  })
})
