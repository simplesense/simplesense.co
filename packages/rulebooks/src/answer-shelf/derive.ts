import type {
  AnswerShelfSnapshot,
  CitedDomainCount,
  CompetitorShare,
  PromptResponse,
} from './types'

/** Below this many total responses, a share-of-voice percentage is noise, not a signal. */
const MIN_SAMPLES_FOR_SHARE_OF_VOICE = 20
/** Below this many *mentioning* responses, rate/sentiment breakdowns are unreliable. */
const MIN_MENTIONS_FOR_DETAIL = 5

function shareOfVoice(responses: PromptResponse[]): number | null {
  if (responses.length < MIN_SAMPLES_FOR_SHARE_OF_VOICE) return null
  const mentions = responses.filter((r) => r.mentionsBrand).length
  return Math.round((mentions / responses.length) * 1000) / 10
}

/** Turns a set of raw prompt responses into the pre-aggregated snapshot every rule reads. */
export function analyzeAnswerShelf(
  brand: string,
  competitors: string[],
  windowDays: number,
  responses: PromptResponse[],
  baselineResponses: PromptResponse[] | null,
): AnswerShelfSnapshot {
  const mentioning = responses.filter((r) => r.mentionsBrand)
  const mentionCount = mentioning.length
  const shareOfVoicePct =
    responses.length >= MIN_SAMPLES_FOR_SHARE_OF_VOICE
      ? Math.round((mentionCount / responses.length) * 1000) / 10
      : null

  const firstMentionCount = mentioning.filter((r) => r.brandMentionRank === 1).length
  const firstMentionRatePct =
    mentionCount >= MIN_MENTIONS_FOR_DETAIL
      ? Math.round((firstMentionCount / mentionCount) * 1000) / 10
      : null

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  for (const r of mentioning) {
    if (r.sentiment) sentimentCounts[r.sentiment] += 1
  }

  const domainCounts = new Map<string, number>()
  for (const r of mentioning) {
    for (const domain of r.citedDomains) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1)
    }
  }
  const topCitedDomains: CitedDomainCount[] = [...domainCounts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)

  const competitorShares: CompetitorShare[] = competitors.map((name) => {
    const mentionCountForCompetitor = responses.filter(
      (r) => r.competitorMentions[name] !== undefined && r.competitorMentions[name] !== null,
    ).length
    return {
      brand: name,
      mentionCount: mentionCountForCompetitor,
      shareOfVoicePct:
        responses.length > 0
          ? Math.round((mentionCountForCompetitor / responses.length) * 1000) / 10
          : 0,
    }
  })

  return {
    brand,
    windowDays,
    totalResponses: responses.length,
    mentionCount,
    shareOfVoicePct,
    firstMentionCount,
    firstMentionRatePct,
    sentimentCounts,
    topCitedDomains,
    competitorShares,
    baselineShareOfVoicePct: baselineResponses ? shareOfVoice(baselineResponses) : null,
  }
}
