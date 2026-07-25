import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

/** Founding rule #2: when the brand IS mentioned, is it the first brand named or an also-ran. */
export const firstMentionRateRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.first_mention_rate',
  title: 'First-mention rate',
  severity: 'high',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'Being mentioned isn’t enough — the first brand named is the one a buyer actually clicks. Strengthen positioning/authority signals for the prompts where the brand mentions but doesn’t lead.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — a brand can show up in every answer and still lose every sale if it’s always the third name mentioned, not the first.',
  detect(snapshot) {
    if (snapshot.firstMentionRatePct === null) {
      return {
        status: 'insufficient',
        insufficientReason: `Fewer than 5 mentioning responses this window (got ${snapshot.mentionCount}) — too small a sample for a reliable first-mention rate.`,
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary: `Of ${snapshot.mentionCount} answers mentioning ${snapshot.brand}, ${snapshot.firstMentionRatePct}% (${snapshot.firstMentionCount}) named it first.`,
        metrics: {
          firstMentionRatePct: snapshot.firstMentionRatePct,
          firstMentionCount: snapshot.firstMentionCount,
          mentionCount: snapshot.mentionCount,
        },
      },
      action:
        snapshot.firstMentionRatePct >= 50
          ? 'No gap here — the brand leads the mention more often than not.'
          : `Investigate the ${snapshot.mentionCount - snapshot.firstMentionCount} answers where ${snapshot.brand} mentions but isn’t named first — which competitor usually leads there?`,
    }
  },
}
