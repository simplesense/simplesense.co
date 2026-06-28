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

export interface ShopifyConfig {
  apiKey: string | null
  apiSecret: string | null
  scopes: string
  appUrl: string
  /** False → the Shopify client runs as a mock (no live OAuth) until creds are supplied. */
  hasCredentials: boolean
}

export function shopifyConfig(src: EnvSource = process.env): ShopifyConfig {
  const apiKey = str(src, 'SHOPIFY_API_KEY')
  const apiSecret = str(src, 'SHOPIFY_API_SECRET')
  return {
    apiKey,
    apiSecret,
    scopes: str(
      src,
      'SHOPIFY_SCOPES',
      'read_orders,read_customers,read_products,read_locations',
    ) as string,
    appUrl: str(
      src,
      'SHOPIFY_APP_URL',
      str(src, 'APP_URL', 'http://localhost:3000') as string,
    ) as string,
    hasCredentials: apiKey != null && apiSecret != null,
  }
}

export interface StripeConfig {
  secretKey: string | null
  webhookSecret: string | null
  priceBasic: string | null
  pricePro: string | null
  hasCredentials: boolean
}

export function stripeConfig(src: EnvSource = process.env): StripeConfig {
  const secretKey = str(src, 'STRIPE_SECRET_KEY')
  return {
    secretKey,
    webhookSecret: str(src, 'STRIPE_WEBHOOK_SECRET'),
    priceBasic: str(src, 'STRIPE_PRICE_BASIC'),
    pricePro: str(src, 'STRIPE_PRICE_PRO'),
    hasCredentials: secretKey != null,
  }
}

/**
 * Fail fast in production if a required secret is missing (§12). Call at server startup.
 * Mockable integrations (Shopify/Stripe/Clerk/Resend) are intentionally NOT required —
 * they degrade to mocks until supplied.
 */
export function assertServerEnv(src: EnvSource = process.env): void {
  if ((str(src, 'NODE_ENV') ?? 'development') !== 'production') return
  const missing: string[] = []
  if (!str(src, 'APP_ENCRYPTION_KEY')) missing.push('APP_ENCRYPTION_KEY')
  if (!str(src, 'DATABASE_URL')) missing.push('DATABASE_URL')
  if (missing.length) throw new Error(`Missing required env in production: ${missing.join(', ')}`)
}

/** Attribution window for the outcome flywheel (§8.6, OPEN_QUESTIONS §10). */
export const ATTRIBUTION_WINDOW_DAYS = 30

/** Default trailing analysis window in months. */
export const ANALYSIS_WINDOW_MONTHS = 24
