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
  /**
   * Whether `read_all_orders` is among the scopes this deployment REQUESTS (SHOPIFY_SCOPES).
   * Per-store granted truth lives in `Store.grantedScopes` — see `storeHasAllOrdersScope`.
   * Without the grant Shopify hard-caps order reads to the last ~60 days, so the analysis
   * window is truncated — the UI must say so rather than present a partial window as the
   * full trailing-24-months. Requires Shopify approval.
   */
  hasAllOrdersScope: boolean
}

export function shopifyConfig(src: EnvSource = process.env): ShopifyConfig {
  const apiKey = str(src, 'SHOPIFY_API_KEY')
  const apiSecret = str(src, 'SHOPIFY_API_SECRET')
  const scopes = str(
    src,
    'SHOPIFY_SCOPES',
    'read_orders,read_customers,read_products,read_locations,read_inventory',
  ) as string
  return {
    apiKey,
    apiSecret,
    scopes,
    appUrl: str(
      src,
      'SHOPIFY_APP_URL',
      str(src, 'APP_URL', 'http://localhost:3000') as string,
    ) as string,
    hasCredentials: apiKey != null && apiSecret != null,
    hasAllOrdersScope: scopes
      .split(',')
      .map((s) => s.trim())
      .includes('read_all_orders'),
  }
}

const splitScopes = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

/**
 * Per-store history check. When the store's OAuth-recorded grant is known, it is the truth;
 * legacy stores (null — connected before scope tracking) fall back to the env-requested
 * scopes, matching the pre-existing behavior.
 */
export function storeHasAllOrdersScope(
  grantedScopes: string | null | undefined,
  src: EnvSource = process.env,
): boolean {
  if (grantedScopes != null) return splitScopes(grantedScopes).includes('read_all_orders')
  return shopifyConfig(src).hasAllOrdersScope
}

/**
 * Scopes this deployment now requests that the store's recorded grant lacks — a re-consent
 * (OAuth re-connect) would pick them up. Empty for legacy stores (null): we can't tell what
 * they granted, so we don't nag.
 */
export function missingScopes(
  grantedScopes: string | null | undefined,
  src: EnvSource = process.env,
): string[] {
  if (grantedScopes == null) return []
  const granted = new Set(splitScopes(grantedScopes))
  return splitScopes(shopifyConfig(src).scopes).filter((s) => !granted.has(s))
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
 * Intelligence-audit modules (COMPOUND_ENGINEERING_PLAN.md, Decision 2): paid concierge
 * audits, sold via a founder-created Stripe Payment Link (dashboard, no API integration —
 * "no new entitlement/billing code in this phase"). Each module's env var is optional; a
 * page reads its own link and degrades to a contact-only CTA rather than fabricating a URL
 * when unset.
 */
export function auditPaymentLink(module: string, src: EnvSource = process.env): string | null {
  const key = `STRIPE_PAYMENT_LINK_${module.toUpperCase().replace(/-/g, '_')}`
  return str(src, key)
}

/**
 * Fail fast in production if a required secret is missing (§12). Call at server startup.
 * Mockable integrations (Shopify/Stripe/Clerk/Resend) are intentionally NOT required —
 * they degrade to mocks until supplied. The one exception is Clerk's two keys, which must be
 * all-or-nothing (see below) to avoid a split build-time/runtime auth config.
 */
export function assertServerEnv(src: EnvSource = process.env): void {
  if ((str(src, 'NODE_ENV') ?? 'development') !== 'production') return
  const missing: string[] = []
  if (!str(src, 'APP_ENCRYPTION_KEY')) missing.push('APP_ENCRYPTION_KEY')
  if (!str(src, 'DATABASE_URL')) missing.push('DATABASE_URL')
  if (missing.length) throw new Error(`Missing required env in production: ${missing.join(', ')}`)

  // Clerk must be all-or-nothing. The provider/UI activate on the build-inlined publishable
  // key while auth() needs the runtime secret; a split config silently collapses auth onto
  // the shared demo org. Refuse to boot rather than serve every tenant the same store.
  const clerkPub = str(src, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  const clerkSecret = str(src, 'CLERK_SECRET_KEY')
  if (!!clerkPub !== !!clerkSecret) {
    const have = clerkPub ? 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' : 'CLERK_SECRET_KEY'
    const need = clerkPub ? 'CLERK_SECRET_KEY' : 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
    throw new Error(
      `Clerk is half-configured: ${have} is set but ${need} is missing. Set both or neither — a split config collapses tenant isolation.`,
    )
  }
}

/** Attribution window for the outcome flywheel (§8.6, OPEN_QUESTIONS §10). */
export const ATTRIBUTION_WINDOW_DAYS = 30

/** Default trailing analysis window in months. */
export const ANALYSIS_WINDOW_MONTHS = 24
