import type { Rule } from '../../types'
import type { ReviewProofSnapshot } from '../types'

/**
 * Words offering something of value contingent on the review's *outcome*, not just for
 * leaving a review at all. The FTC rule (16 CFR Part 465, verified via Goodwin Law's
 * Sept 2024 summary this session — eCFR.gov/FTC.gov both blocked automated fetches, so
 * confirm the exact subsection against the primary text before citing it in a real
 * client report) prohibits "providing compensation or other incentives contingent upon
 * a consumer writing a positive review or a review expressing a particular sentiment" —
 * incentivizing reviews IN GENERAL (any sentiment) is not itself prohibited.
 */
const INCENTIVE_TERMS =
  /\b(discount|coupon|% ?off|off your next|free gift|free product|store credit|gift card|reward|refund)\b/i
const POSITIVE_CONTINGENCY_TERMS =
  /\b(5[\s-]?star|five[\s-]?star|positive review|great review|good review|glowing review|happy review|leave (us )?a (great|good|positive|5-star|five-star))\b/i

function flagsEmail(email: { subject: string; body: string }): boolean {
  const text = `${email.subject}\n${email.body}`
  return INCENTIVE_TERMS.test(text) && POSITIVE_CONTINGENCY_TERMS.test(text)
}

/**
 * v0's one real signal: does a review-request email tie an incentive to a *positive*
 * outcome specifically, rather than to leaving any review. Flagged as an indicator for
 * manual review, never an accusation — per the plan's own required framing.
 */
export const incentivizedReviewDisclosureRule: Rule<ReviewProofSnapshot> = {
  id: 'review_proof.incentivized_review_disclosure',
  title: 'Incentivized reviews without disclosed material connection',
  severity: 'high',
  citation: {
    label:
      'FTC Rule on Consumer Reviews and Testimonials, 16 CFR Part 465 (effective Oct 21, 2024)',
  },
  remediationTemplate:
    'Remove language that ties any incentive to a positive/5-star outcome specifically — incentivizing reviews of any sentiment is fine; conditioning the incentive on sentiment is not.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — the one M3 signal buildable without S1's crawler (a client forwards these emails directly); verified against the FTC's actual final rule this session, not the earlier proposed draft.",
  detect(snapshot) {
    if (snapshot.emails.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No review-request emails were provided to scan.',
      }
    }
    const flagged = snapshot.emails.filter(flagsEmail)
    if (flagged.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary: `Scanned ${snapshot.emails.length} review-request email(s); none tie an incentive to a positive-sentiment outcome specifically.`,
          metrics: { scannedCount: snapshot.emails.length, flaggedCount: 0 },
        },
        action: 'No gap here — risk surfacing, not legal advice; judgment calls go to counsel.',
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary: `${flagged.length} of ${snapshot.emails.length} review-request email(s) contain language offering an incentive contingent on a positive/5-star review specifically — an indicator worth review, not a legal conclusion.`,
        metrics: {
          scannedCount: snapshot.emails.length,
          flaggedCount: flagged.length,
          flaggedIds: flagged.map((e) => e.id).join(', '),
        },
      },
      action:
        'Have counsel review the flagged email(s) against 16 CFR Part 465 before the next send — risk surfacing, not legal advice; judgment calls go to counsel.',
    }
  },
}
