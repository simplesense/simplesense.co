import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

/** Founding rule #5: how the brand's share of voice stacks up against its tracked competitors. */
export const competitorDeltaRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.competitor_delta',
  title: 'Competitor share-of-voice delta',
  severity: 'high',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'Read the leading competitor’s cited-source pages for the same prompt set — that’s the concrete gap to close, not a generic SEO checklist.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — 12% share of voice reads very differently next to a competitor at 8% versus a competitor at 41%; the plan’s own example output leads with this comparison.',
  detect(snapshot) {
    if (snapshot.shareOfVoicePct === null) {
      return {
        status: 'insufficient',
        insufficientReason:
          'Not enough sampled responses this window to compute a share-of-voice comparison.',
      }
    }
    if (snapshot.competitorShares.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No competitors are configured to compare against.',
      }
    }
    const top = [...snapshot.competitorShares].sort(
      (a, b) => b.shareOfVoicePct - a.shareOfVoicePct,
    )[0]!
    const gap = Math.round((top.shareOfVoicePct - snapshot.shareOfVoicePct) * 10) / 10
    return {
      status: 'triggered',
      evidence: {
        summary: `${snapshot.brand} at ${snapshot.shareOfVoicePct}% vs. ${top.brand} (the leading tracked competitor) at ${top.shareOfVoicePct}%.`,
        metrics: {
          brandSharePct: snapshot.shareOfVoicePct,
          topCompetitor: top.brand,
          topCompetitorSharePct: top.shareOfVoicePct,
          gapPct: gap,
        },
      },
      action:
        gap > 0
          ? `Close the ${gap}-point gap to ${top.brand} — start with the prompts where ${top.brand} leads and ${snapshot.brand} doesn't appear at all.`
          : `No gap here — ${snapshot.brand} leads its tracked competitors on this prompt set.`,
    }
  },
}
