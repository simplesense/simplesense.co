import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

/** Founding rule #6: is share of voice moving, and which direction — the moat is the trendline, not one number. */
export const weekOverWeekTrendRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.week_over_week_trend',
  title: 'Week-over-week trend',
  severity: 'medium',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'A declining trend is worth investigating even when the absolute share-of-voice number still looks fine — check what changed on the cited pages between the two windows.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — the plan’s own moat argument: a longitudinal share-of-voice history is what a new entrant can’t backfill, so trend (not a single snapshot) is the durable asset.',
  detect(snapshot) {
    if (snapshot.shareOfVoicePct === null || snapshot.baselineShareOfVoicePct === null) {
      return {
        status: 'insufficient',
        insufficientReason:
          snapshot.baselineShareOfVoicePct === null
            ? 'No prior-period baseline available yet — this is the first battery run for this brand.'
            : 'Not enough sampled responses this window to compute a current share-of-voice figure.',
      }
    }
    const delta =
      Math.round((snapshot.shareOfVoicePct - snapshot.baselineShareOfVoicePct) * 10) / 10
    return {
      status: 'triggered',
      evidence: {
        summary: `Share of voice moved from ${snapshot.baselineShareOfVoicePct}% to ${snapshot.shareOfVoicePct}% (${delta >= 0 ? '+' : ''}${delta} points) vs. the prior window.`,
        metrics: {
          currentSharePct: snapshot.shareOfVoicePct,
          baselineSharePct: snapshot.baselineShareOfVoicePct,
          deltaPct: delta,
        },
      },
      action:
        delta < 0
          ? `Investigate the decline — check whether the cited-source pages changed or a competitor shipped new content in this window.`
          : 'No gap here — share of voice is flat or improving vs. the prior window.',
    }
  },
}
