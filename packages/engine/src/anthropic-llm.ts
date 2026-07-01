import type { RawRecommendation } from '@ss/core'
import type { EngineInput, LlmClient, LlmResult } from './types'
import { SYSTEM_PROMPT, RECOMMENDATION_TOOL_SCHEMA, buildUserPayload } from './prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const REQUEST_TIMEOUT_MS = 90_000
const MAX_ATTEMPTS = 3

export interface AnthropicConfig {
  apiKey: string
  model: string
  maxTokens: number
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Shape-check one raw recommendation; malformed items are quarantined, not crash the run. */
function isValidRawRecommendation(r: unknown): r is RawRecommendation {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  return (
    typeof o.category === 'string' &&
    typeof o.title === 'string' &&
    typeof o.rationale === 'string' &&
    Array.isArray(o.evidence_metric_ids) &&
    o.evidence_metric_ids.every((id) => typeof id === 'string') &&
    typeof o.impact_low === 'number' &&
    Number.isFinite(o.impact_low) &&
    typeof o.impact_high === 'number' &&
    Number.isFinite(o.impact_high) &&
    typeof o.impact_unit === 'string' &&
    (o.effort === 'LOW' || o.effort === 'MED' || o.effort === 'HIGH') &&
    typeof o.confidence === 'number' &&
    Number.isFinite(o.confidence) &&
    !!o.suggested_execution &&
    typeof o.suggested_execution === 'object'
  )
}

/**
 * Real Stage-3 client. Forces structured output via tool-use so the model can only
 * return the recommendation schema. Used when ANTHROPIC_API_KEY is set; everything
 * downstream (grounding, ranking) treats its output exactly like the mock's.
 * The model id is supplied by config (never hardcoded — §16).
 *
 * Hardened: 90s timeout per attempt; retries 429/5xx/timeouts with backoff (a transient
 * API blip must not fail a whole analysis run); a max_tokens-truncated response throws
 * (a truncated tool call would otherwise persist a DONE run with zero recommendations);
 * malformed recommendation objects are filtered out instead of crashing the pipeline.
 */
export class AnthropicLlmClient implements LlmClient {
  constructor(private readonly config: AnthropicConfig) {}

  async synthesize(input: EngineInput): Promise<LlmResult> {
    const body = JSON.stringify({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: SYSTEM_PROMPT,
      tools: [RECOMMENDATION_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: RECOMMENDATION_TOOL_SCHEMA.name },
      messages: [{ role: 'user', content: buildUserPayload(input) }],
    })

    let lastError: Error | null = null
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let res: Response
      try {
        res = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
          },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      } catch (err) {
        // Network error / timeout — retryable.
        lastError = err as Error
        if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 1000)
        continue
      }

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Anthropic API error ${res.status}: ${await res.text()}`)
        if (attempt < MAX_ATTEMPTS) {
          const retryAfter = Number.parseFloat(res.headers.get('retry-after') ?? '')
          await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 1000)
        }
        continue
      }
      if (!res.ok) {
        throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`)
      }

      const data = (await res.json()) as {
        stop_reason?: string
        content?: { type: string; name?: string; input?: { recommendations?: unknown[] } }[]
        usage?: { input_tokens?: number; output_tokens?: number }
      }
      // A truncated tool call is NOT a valid empty result — surface it so the run fails and
      // can be retried, instead of persisting DONE with zero recommendations.
      if (data.stop_reason === 'max_tokens') {
        throw new Error(
          `Anthropic response truncated at max_tokens=${this.config.maxTokens} — raise LLM_MAX_TOKENS`,
        )
      }
      const toolUse = data.content?.find(
        (c) => c.type === 'tool_use' && c.name === RECOMMENDATION_TOOL_SCHEMA.name,
      )
      const raw = toolUse?.input?.recommendations ?? []
      const recommendations = raw.filter(isValidRawRecommendation)
      if (recommendations.length < raw.length) {
        console.warn(
          `[engine] quarantined ${raw.length - recommendations.length} malformed recommendation(s)`,
        )
      }
      const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
      return { recommendations, tokensUsed, model: this.config.model }
    }
    throw lastError ?? new Error('Anthropic API: retries exhausted')
  }
}
