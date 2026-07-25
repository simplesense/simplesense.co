import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

const MIN_MENTIONS_FOR_DETAIL = 5
/** Below this share of negative-or-worse mentions, sentiment isn't worth flagging as a gap. */
const CONCERNING_NEGATIVE_SHARE = 0.15

/** Founding rule #3: when models mention the brand, do they recommend it warmly or hedge. */
export const sentimentRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.sentiment',
  title: 'Recommendation sentiment',
  severity: 'medium',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'Review the negative-sentiment prompts for a recurring theme (price, sizing, quality complaints echoed from review sites the model may be drawing on).',
  version: '0.1.0',
  addedBecause:
    'Founding rule — a mention isn\'t automatically a recommendation; models sometimes name a brand while steering the buyer elsewhere ("X exists but Y is more reliable").',
  detect(snapshot) {
    if (snapshot.mentionCount < MIN_MENTIONS_FOR_DETAIL) {
      return {
        status: 'insufficient',
        insufficientReason: `Fewer than ${MIN_MENTIONS_FOR_DETAIL} mentioning responses this window (got ${snapshot.mentionCount}) — too small a sample for a reliable sentiment breakdown.`,
      }
    }
    const { positive, neutral, negative } = snapshot.sentimentCounts
    const total = positive + neutral + negative
    const negativeShare = total > 0 ? negative / total : 0
    const pct = (n: number) => Math.round((n / total) * 1000) / 10
    const summary = `Of ${total} mentioning answers: ${pct(positive)}% positive, ${pct(neutral)}% neutral, ${pct(negative)}% negative.`
    if (negativeShare >= CONCERNING_NEGATIVE_SHARE) {
      return {
        status: 'triggered',
        evidence: {
          summary,
          metrics: {
            positivePct: pct(positive),
            neutralPct: pct(neutral),
            negativePct: pct(negative),
          },
        },
        action: `${negative} of ${total} mentions skew negative — read those responses for a recurring complaint theme before the next battery run.`,
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary,
        metrics: {
          positivePct: pct(positive),
          neutralPct: pct(neutral),
          negativePct: pct(negative),
        },
      },
      action: 'No gap here — negative sentiment is within normal range.',
    }
  },
}
