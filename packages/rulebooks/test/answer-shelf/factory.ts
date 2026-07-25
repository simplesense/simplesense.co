import type { AnswerShelfSnapshot } from '../../src/answer-shelf/types'
import type { Finding } from '../../src/types'

/** A "healthy, well-sampled" snapshot by default — tests override only what they're probing. */
export function snapshot(over: Partial<AnswerShelfSnapshot> = {}): AnswerShelfSnapshot {
  return {
    brand: 'Acme Co.',
    windowDays: 30,
    totalResponses: 250,
    mentionCount: 30,
    shareOfVoicePct: 12,
    firstMentionCount: 12,
    firstMentionRatePct: 40,
    sentimentCounts: { positive: 20, neutral: 8, negative: 2 },
    topCitedDomains: [
      { domain: 'acme.com', count: 10 },
      { domain: 'reviews.example.com', count: 4 },
    ],
    competitorShares: [{ brand: 'Rival Co.', mentionCount: 100, shareOfVoicePct: 40 }],
    baselineShareOfVoicePct: 11,
    ...over,
  }
}

export function findFinding(findings: Finding[], ruleId: string): Finding {
  const f = findings.find((x) => x.ruleId === ruleId)
  if (!f)
    throw new Error(
      `finding not found: ${ruleId}. present: ${findings.map((x) => x.ruleId).join(', ')}`,
    )
  return f
}
