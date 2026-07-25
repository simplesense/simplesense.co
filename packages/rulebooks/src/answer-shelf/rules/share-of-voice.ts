import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

/** Founding rule #1: what share of high-intent answers actually mention this brand. */
export const shareOfVoiceRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.share_of_voice',
  title: 'Share of voice',
  severity: 'critical',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'Strengthen the pages models actually cite (see the cited-sources finding) and expand structured/authoritative content in the category.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — the plan\'s central question: can a merchant answer "do the machines recommend us?"',
  detect(snapshot) {
    if (snapshot.shareOfVoicePct === null) {
      return {
        status: 'insufficient',
        insufficientReason: `Fewer than 20 sampled responses this window (got ${snapshot.totalResponses}) — too small a sample for a reliable share-of-voice figure.`,
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary: `${snapshot.brand} appears in ${snapshot.shareOfVoicePct}% of high-intent answers this window (${snapshot.mentionCount} of ${snapshot.totalResponses} sampled responses).`,
        metrics: {
          shareOfVoicePct: snapshot.shareOfVoicePct,
          mentionCount: snapshot.mentionCount,
          totalResponses: snapshot.totalResponses,
        },
      },
      action: `Track this figure weekly; investigate the ${100 - snapshot.shareOfVoicePct}% of answers where ${snapshot.brand} doesn't appear.`,
    }
  },
}
