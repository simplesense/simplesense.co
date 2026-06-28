import { llmConfig } from '@ss/config'
import type { LlmClient } from './types'
import { MockLlmClient } from './mock-llm'
import { AnthropicLlmClient } from './anthropic-llm'

export * from './types'
export { runEngine } from './engine'
export type { EngineDeps } from './engine'
export { MockLlmClient } from './mock-llm'
export { AnthropicLlmClient } from './anthropic-llm'
export { SYSTEM_PROMPT, RECOMMENDATION_TOOL_SCHEMA, buildUserPayload } from './prompt'

/**
 * Pick the LLM client from env: the real Anthropic client when a key is present,
 * otherwise the deterministic mock so the pipeline always runs (Prime Directive #6:
 * cost-aware — no live call unless configured).
 */
export function createLlmClient(env: NodeJS.ProcessEnv = process.env): LlmClient {
  const cfg = llmConfig(env)
  if (cfg.hasApiKey) {
    return new AnthropicLlmClient({
      apiKey: env.ANTHROPIC_API_KEY as string,
      model: cfg.model,
      maxTokens: cfg.maxTokens,
    })
  }
  return new MockLlmClient()
}
