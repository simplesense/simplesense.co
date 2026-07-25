import type { PromptResponse } from '@ss/rulebooks'

export interface AnswerShelfBatteryResult {
  responses: PromptResponse[]
  /** null when no prior-period run exists yet for this brand. */
  baselineResponses: PromptResponse[] | null
}

/**
 * S3 LLM battery runner (COMPOUND_ENGINEERING_PLAN.md, plan §3): runs a buying-intent
 * prompt set across multiple LLM providers, n>=5 samples each, and normalizes the raw
 * responses into `PromptResponse[]` for the AnswerShelf rulebook.
 *
 * No `RealAnswerShelfBattery` yet — the real battery needs OpenAI/Gemini/Perplexity API
 * keys, none of which are configured (only `ANTHROPIC_API_KEY`, per `@ss/config`). A
 * real, single-provider-only battery (Claude alone) would prove the plumbing but not
 * the actual point of the module — comparing how a brand shows up ACROSS providers —
 * and every real LLM call has a real dollar cost this session shouldn't spend without
 * the founder's go-ahead. See PARKING_LOT.md.
 */
export interface AnswerShelfBatteryClient {
  runBattery(
    brand: string,
    competitors: string[],
    windowDays: number,
  ): Promise<AnswerShelfBatteryResult>
}

/** Deterministic mock — a fully-populated "typical mid-size DTC brand" battery result,
 *  used in tests and for building/reviewing golden reports before real provider keys are on hand. */
export class MockAnswerShelfBattery implements AnswerShelfBatteryClient {
  async runBattery(
    brand: string,
    competitors: string[],
    _windowDays: number,
  ): Promise<AnswerShelfBatteryResult> {
    const topCompetitor = competitors[0] ?? 'Competitor Co.'
    const models = ['claude-opus-5', 'gpt-5', 'gemini-3-pro', 'perplexity-sonar']
    const responses: PromptResponse[] = []
    for (let i = 0; i < 25; i++) {
      const model = models[i % models.length]!
      const mentionsBrand = i < 5
      responses.push({
        promptId: `p${i + 1}`,
        model,
        sampledAt: new Date(2026, 6, 20).toISOString(),
        mentionsBrand,
        brandMentionRank: mentionsBrand ? (i % 3) + 1 : null,
        sentiment: mentionsBrand ? (i === 4 ? 'negative' : i === 3 ? 'neutral' : 'positive') : null,
        citedDomains: mentionsBrand ? [`${brand.toLowerCase().replace(/\s+/g, '')}.com`] : [],
        competitorMentions: i < 10 ? { [topCompetitor]: (i % 3) + 1 } : {},
      })
    }
    return Promise.resolve({ responses, baselineResponses: null })
  }
}
