/**
 * Lightweight env access with safe defaults. The strict fail-fast validator is wired
 * in Slice 12 (hardening); for now this gives typed access and the LLM config.
 * Reading env keeps this module impure by design — pure domain logic stays in @ss/core.
 */

type EnvSource = Record<string, string | undefined>

function str(src: EnvSource, key: string, fallback: string | null = null): string | null {
  const v = src[key]
  return v && v.length > 0 ? v : fallback
}

export interface LlmConfig {
  /** Model id — never hardcoded; verify the current recommended model before launch. */
  model: string
  maxTokens: number
  /** When false, the engine uses its mock LLM (no key supplied). */
  hasApiKey: boolean
}

export function llmConfig(src: EnvSource = process.env): LlmConfig {
  const maxTokens = Number(str(src, 'LLM_MAX_TOKENS', '4096'))
  return {
    model: str(src, 'LLM_MODEL', 'claude-sonnet-4-6') as string,
    maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 4096,
    hasApiKey: str(src, 'ANTHROPIC_API_KEY') != null,
  }
}

export interface AppEnv {
  nodeEnv: string
  appUrl: string
  /** Null → local dev uses embedded PGlite (ADR-002). */
  databaseUrl: string | null
  llm: LlmConfig
}

export function appEnv(src: EnvSource = process.env): AppEnv {
  return {
    nodeEnv: str(src, 'NODE_ENV', 'development') as string,
    appUrl: str(src, 'APP_URL', 'http://localhost:3000') as string,
    databaseUrl: str(src, 'DATABASE_URL'),
    llm: llmConfig(src),
  }
}

/** Attribution window for the outcome flywheel (§8.6, OPEN_QUESTIONS §10). */
export const ATTRIBUTION_WINDOW_DAYS = 30

/** Default trailing analysis window in months. */
export const ANALYSIS_WINDOW_MONTHS = 24
