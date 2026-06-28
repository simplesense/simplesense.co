import type { Metric, Signal, RawRecommendation, Recommendation } from '@ss/core'

/** What the engine feeds the LLM: detected signals + the metrics behind them. */
export interface EngineInput {
  signals: Signal[]
  metrics: Metric[]
}

export interface LlmResult {
  recommendations: RawRecommendation[]
  tokensUsed?: number
  model?: string
}

/** The single LLM boundary (Stage 3). Implementations: mock + Anthropic. */
export interface LlmClient {
  synthesize(input: EngineInput): Promise<LlmResult>
}

export interface EngineResult {
  recommendations: Recommendation[]
  /** Quarantined recommendations that failed grounding (Prime Directive #1). */
  rejected: { raw: RawRecommendation; reasons: string[] }[]
  tokensUsed: number
  model?: string
}
