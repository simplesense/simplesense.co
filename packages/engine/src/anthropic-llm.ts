import type { RawRecommendation } from '@ss/core'
import type { EngineInput, LlmClient, LlmResult } from './types'
import { SYSTEM_PROMPT, RECOMMENDATION_TOOL_SCHEMA, buildUserPayload } from './prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export interface AnthropicConfig {
  apiKey: string
  model: string
  maxTokens: number
}

/**
 * Real Stage-3 client. Forces structured output via tool-use so the model can only
 * return the recommendation schema. Used when ANTHROPIC_API_KEY is set; everything
 * downstream (grounding, ranking) treats its output exactly like the mock's.
 * The model id is supplied by config (never hardcoded — §16).
 */
export class AnthropicLlmClient implements LlmClient {
  constructor(private readonly config: AnthropicConfig) {}

  async synthesize(input: EngineInput): Promise<LlmResult> {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: SYSTEM_PROMPT,
        tools: [RECOMMENDATION_TOOL_SCHEMA],
        tool_choice: { type: 'tool', name: RECOMMENDATION_TOOL_SCHEMA.name },
        messages: [{ role: 'user', content: buildUserPayload(input) }],
      }),
    })

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as {
      content?: { type: string; name?: string; input?: { recommendations?: RawRecommendation[] } }[]
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const toolUse = data.content?.find(
      (c) => c.type === 'tool_use' && c.name === RECOMMENDATION_TOOL_SCHEMA.name,
    )
    const recommendations = toolUse?.input?.recommendations ?? []
    const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
    return { recommendations, tokensUsed, model: this.config.model }
  }
}
