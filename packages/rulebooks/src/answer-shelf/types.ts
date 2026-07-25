/**
 * AnswerShelf (COMPOUND_ENGINEERING_PLAN.md M1). `PromptResponse` is what a battery
 * client (S3, `@ss/integrations`) produces per LLM call. `analyzeAnswerShelf()`
 * (`derive.ts`) turns a set of those into the pre-aggregated `AnswerShelfSnapshot`
 * every rule reads — mirroring M5 ReturnLens's chassis, where rules never re-derive
 * raw data themselves. Grounding invariant applied to stochastic data (plan §4 M1):
 * every rule reports aggregates with sample counts, never a single-shot claim — small
 * samples render `insufficient` rather than a shaky percentage.
 */

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface PromptResponse {
  promptId: string
  model: string
  sampledAt: string
  /** True if the tracked brand was mentioned anywhere in this response. */
  mentionsBrand: boolean
  /** 1 = first brand mentioned in the response; null if not mentioned or unranked. */
  brandMentionRank: number | null
  /** Sentiment toward the brand specifically — null when the brand wasn't mentioned. */
  sentiment: Sentiment | null
  /** Source domains the model cited, if the provider surfaces them (e.g. Perplexity). */
  citedDomains: string[]
  /** Other tracked brands mentioned in this same response, by name -> mention rank. */
  competitorMentions: Record<string, number | null>
}

export interface CompetitorShare {
  brand: string
  mentionCount: number
  shareOfVoicePct: number
}

export interface CitedDomainCount {
  domain: string
  count: number
}

export interface AnswerShelfSnapshot {
  brand: string
  windowDays: number
  totalResponses: number
  mentionCount: number
  /** null when totalResponses is below the sampling floor — never a shaky percentage. */
  shareOfVoicePct: number | null
  firstMentionCount: number
  /** null when mentionCount is below the floor for a reliable rate. */
  firstMentionRatePct: number | null
  sentimentCounts: { positive: number; neutral: number; negative: number }
  /** Domains cited across brand-mentioning responses, most-cited first. */
  topCitedDomains: CitedDomainCount[]
  /** Every tracked competitor's own share of voice across the same response set. */
  competitorShares: CompetitorShare[]
  /** null when there's no prior-period baseline yet (first run). */
  baselineShareOfVoicePct: number | null
}
