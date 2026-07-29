import type { Rule } from '../../types'
import type { ReviewProofSnapshot, ReviewWidgetSnapshot } from '../types'

const MIN_SNAPSHOTS = 2

function withCount(
  history: ReviewWidgetSnapshot[],
): (ReviewWidgetSnapshot & { aggregateReviewCount: number })[] {
  return history
    .filter(
      (s): s is ReviewWidgetSnapshot & { aggregateReviewCount: number } =>
        s.aggregateReviewCount !== null,
    )
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
}

function shortDate(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Uses S1 (`@ss/crawler`) + S6 (`@ss/capture-archive`) to compare a store's published
 * review count across two or more crawls over time. Real reviews don't disappear on
 * their own — a drop is either legitimate platform moderation (spam, policy
 * violations) or a suppression pattern worth a closer look; this rule surfaces the
 * fact, not a verdict.
 */
export const reviewCountRegressionRule: Rule<ReviewProofSnapshot> = {
  id: 'review_proof.review_count_regression',
  title: 'Review count decreased over time',
  severity: 'high',
  citation: {
    label: 'SimpleSense ReviewProof benchmark v0 — review-count-over-time integrity check',
  },
  remediationTemplate:
    "Check your review platform's moderation/deletion log for the missing reviews — confirm removals were policy-driven, not selective suppression of negative feedback.",
  version: '0.1.0',
  addedBecause:
    "S1's crawler + S6's capture archive unlock the first of M3's crawler-dependent signals — comparing the SAME store's own review-widget data across time, not a cross-store benchmark.",
  detect(snapshot) {
    const withData = withCount(snapshot.reviewWidgetHistory)
    if (withData.length < MIN_SNAPSHOTS) {
      return {
        status: 'insufficient',
        insufficientReason: `Needs at least ${MIN_SNAPSHOTS} crawled snapshots of this store's review widget, taken at different times, to detect a change — currently have ${withData.length}.`,
      }
    }
    const oldest = withData[0]!
    const newest = withData[withData.length - 1]!
    const oldestCount = oldest.aggregateReviewCount
    const newestCount = newest.aggregateReviewCount

    if (newestCount < oldestCount) {
      const lost = oldestCount - newestCount
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `Review count dropped from ${oldestCount} (as of ${shortDate(oldest.capturedAt)}) to ${newestCount} (as of ${shortDate(newest.capturedAt)}) — a net loss of ${lost} review(s).`,
          metrics: {
            oldestCount,
            newestCount,
            lost,
            oldestCapturedAt: oldest.capturedAt,
            newestCapturedAt: newest.capturedAt,
            snapshotCount: withData.length,
          },
        },
        action:
          "Check your review platform's moderation/deletion log for the missing review(s). A legitimate removal (spam, policy violation) is normal; a pattern of removing specifically negative reviews is worth a closer look — risk surfacing, not legal advice.",
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: `Review count held steady or grew, from ${oldestCount} (as of ${shortDate(oldest.capturedAt)}) to ${newestCount} (as of ${shortDate(newest.capturedAt)}) across ${withData.length} snapshots.`,
        metrics: { oldestCount, newestCount, snapshotCount: withData.length },
      },
      action: 'No gap here — review count has not regressed.',
    }
  },
}
