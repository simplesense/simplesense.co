#!/usr/bin/env node
/**
 * `pnpm preflight` — one command that answers "is my local config actually wired up?"
 * (Named `preflight`, not `doctor`: `pnpm doctor` is a pnpm builtin and silently
 * shadows a same-named script.)
 *
 * Exists because diagnosing a broken Stripe setup by hand cost ~15 round-trips of
 * one-off greps and guesses (see LEARNINGS.md, 2026-07-31). Every check here maps to a
 * real failure that has actually happened in this repo, and each prints the specific
 * next action rather than just a red X.
 *
 * Safety: this reads .env files but NEVER prints a secret value. Only presence,
 * derived shape (mode prefix, byte length), and authoritative facts returned by an
 * API are printed. Stripe `acct_`/`price_` ids ARE printed — they are identifiers
 * that appear in dashboard URLs, not credentials, and printing them is the entire
 * point of the account-mismatch check.
 *
 * No new dependencies: hand-rolled .env parsing and plain fetch, matching the
 * convention set by @ss/csv-ingest and agent-ready/html-utils.ts.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEB_ENV = resolve(ROOT, 'apps/web/.env.local')
const WEB_ENV_FALLBACK = resolve(ROOT, 'apps/web/.env')
const ROOT_ENV = resolve(ROOT, '.env')

const OFFLINE = process.argv.includes('--offline')

const C = process.stdout.isTTY
  ? { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { g: '', r: '', y: '', d: '', b: '', x: '' }

const results = []
const pass = (name, detail = '') => results.push({ kind: 'pass', name, detail })
const fail = (name, detail, fix) => results.push({ kind: 'fail', name, detail, fix })
const warn = (name, detail, fix = '') => results.push({ kind: 'warn', name, detail, fix })
const skip = (name, detail) => results.push({ kind: 'skip', name, detail })

/** Minimal .env parser — `KEY=value`, optional `export `, optional surrounding quotes. */
function parseEnvFile(path) {
  if (!existsSync(path)) return null
  const out = {}
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/, '')
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

// ── Env file discovery ────────────────────────────────────────────────────────
// Next.js only loads env files inside the app dir. A root-level .env is invisible
// to it — a real trap that cost a debugging session once already.
const webEnv = parseEnvFile(WEB_ENV)
const webEnvFallback = parseEnvFile(WEB_ENV_FALLBACK)
const rootEnv = parseEnvFile(ROOT_ENV)

if (webEnv) {
  pass('env file', `apps/web/.env.local (${Object.keys(webEnv).length} vars)`)
} else if (webEnvFallback) {
  warn(
    'env file',
    'apps/web/.env.local missing; using apps/web/.env',
    'Prefer .env.local for local secrets — it is gitignored.',
  )
} else {
  fail(
    'env file',
    'no apps/web/.env.local or apps/web/.env found',
    'Create apps/web/.env.local. Everything below will report as missing until you do.',
  )
}

const env = { ...(webEnvFallback ?? {}), ...(webEnv ?? {}), ...process.env }
const get = (k) => {
  const v = env[k]
  return v && v.length > 0 ? v : null
}

if (rootEnv) {
  const stranded = Object.keys(rootEnv).filter(
    (k) =>
      !k.startsWith('#') && !(webEnv && k in webEnv) && !(webEnvFallback && k in webEnvFallback),
  )
  if (stranded.length > 0) {
    warn(
      'stranded root .env vars',
      `${stranded.length} var(s) set ONLY in the repo-root .env: ${stranded.join(', ')}`,
      'Next.js does NOT read the repo-root .env — only apps/web/.env.local. Move these there if the app needs them.',
    )
  }
}

// ── Core required-in-production vars ──────────────────────────────────────────
// Mirrors assertServerEnv() in packages/config/src/env.ts.
const encKey = get('APP_ENCRYPTION_KEY')
if (!encKey) {
  fail(
    'APP_ENCRYPTION_KEY',
    'not set',
    'Generate once with `openssl rand -base64 32`. Required in production; without it, connecting a Shopify store throws.',
  )
} else {
  let bytes = 0
  try {
    bytes = Buffer.from(encKey, 'base64').length
  } catch {
    bytes = -1
  }
  if (bytes === 32) {
    pass('APP_ENCRYPTION_KEY', 'valid base64, 32 bytes')
  } else {
    fail(
      'APP_ENCRYPTION_KEY',
      `decodes to ${bytes < 0 ? 'invalid base64' : `${bytes} bytes, expected 32`}`,
      'Regenerate with `openssl rand -base64 32`. NOTE: changing this makes every already-stored Shopify token undecryptable.',
    )
  }
}

get('DATABASE_URL')
  ? pass('DATABASE_URL', 'set')
  : warn(
      'DATABASE_URL',
      'not set',
      'Local dev falls back to embedded PGlite (ADR-002). Required in production.',
    )

// ── Clerk: must be all-or-nothing ─────────────────────────────────────────────
const clerkPub = get('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
const clerkSecret = get('CLERK_SECRET_KEY')
if (!clerkPub && !clerkSecret) {
  warn(
    'Clerk',
    'not configured',
    'Auth is disabled; every session collapses onto the shared read-only demo org. Fine locally, fatal in production.',
  )
} else if (!!clerkPub !== !!clerkSecret) {
  fail(
    'Clerk',
    `half-configured — ${clerkPub ? 'publishable key set, CLERK_SECRET_KEY missing' : 'secret key set, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing'}`,
    'Set both or neither. A split config silently collapses tenant isolation; assertServerEnv refuses to boot on this in production.',
  )
} else {
  const mode = clerkPub.startsWith('pk_live_') ? 'live' : 'test/dev'
  pass('Clerk', `both keys set (${mode})`)
}

// ── Cron ──────────────────────────────────────────────────────────────────────
get('CRON_SECRET')
  ? pass('CRON_SECRET', 'set')
  : warn(
      'CRON_SECRET',
      'not set',
      'POST /api/cron/tick will reject. Also needs to be a Fly secret + a GitHub Actions repo secret for the scheduled tick to run.',
    )

// ── LLM ───────────────────────────────────────────────────────────────────────
get('ANTHROPIC_API_KEY')
  ? pass('LLM', `real client (model: ${get('LLM_MODEL') ?? 'default'})`)
  : warn(
      'LLM',
      'no ANTHROPIC_API_KEY — engine uses the deterministic mock',
      'Intentional and fully supported: the mock satisfies the same grounding contract. Set a key only when you want real synthesis.',
    )

// ── Shopify ───────────────────────────────────────────────────────────────────
const shopKey = get('SHOPIFY_API_KEY')
const shopSecret = get('SHOPIFY_API_SECRET')
if (shopKey && shopSecret) {
  const scopes = get('SHOPIFY_SCOPES') ?? ''
  pass('Shopify', 'credentials set')
  if (!scopes.includes('read_all_orders')) {
    warn(
      'Shopify read_all_orders',
      'not in SHOPIFY_SCOPES',
      'Order history is hard-capped to ~60 days by Shopify without it. Requires Shopify approval — a real product gap, not a config typo.',
    )
  }
} else {
  warn(
    'Shopify',
    'not configured — client runs as a mock',
    'Fine for local dev against the seeded demo store.',
  )
}

// ── Stripe ────────────────────────────────────────────────────────────────────
const stripeKey = get('STRIPE_SECRET_KEY')
const priceIds = { BASIC: get('STRIPE_PRICE_BASIC'), PRO: get('STRIPE_PRICE_PRO') }

let stripeMode = null
if (!stripeKey) {
  warn('Stripe', 'STRIPE_SECRET_KEY not set — billing disabled, client runs as a mock', '')
} else if (stripeKey.startsWith('sk_test_')) {
  stripeMode = 'test'
  pass('Stripe key', 'test mode')
} else if (stripeKey.startsWith('sk_live_')) {
  stripeMode = 'live'
  pass('Stripe key', `${C.y}LIVE mode — real money${C.x}`)
} else {
  fail(
    'Stripe key',
    'does not start with sk_test_ or sk_live_',
    'Check you copied the SECRET key (sk_...), not the publishable key (pk_...) or a restricted key.',
  )
}

for (const [tier, id] of Object.entries(priceIds)) {
  if (!id) {
    fail(
      `STRIPE_PRICE_${tier}`,
      'not set',
      `Stripe Dashboard → Products → your ${tier} product → copy the Price ID.`,
    )
  } else if (id.startsWith('prod_')) {
    fail(
      `STRIPE_PRICE_${tier}`,
      'this is a PRODUCT id, not a PRICE id',
      'Open the product and copy the price_... id from its pricing section. Checkout needs the Price, not the Product.',
    )
  } else if (!id.startsWith('price_')) {
    fail(
      `STRIPE_PRICE_${tier}`,
      `unexpected format (${id.slice(0, 6)}…)`,
      'Expected a price_... id.',
    )
  }
}

get('STRIPE_WEBHOOK_SECRET')
  ? pass('STRIPE_WEBHOOK_SECRET', 'set')
  : warn(
      'STRIPE_WEBHOOK_SECRET',
      'not set',
      'Subscription lifecycle webhooks will fail signature verification. Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.',
    )

// ── Stripe live validation (the check that would have saved a whole session) ───
async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  })
  const body = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, body }
}

if (OFFLINE) {
  skip('Stripe live validation', '--offline')
} else if (!stripeKey || !stripeMode) {
  skip('Stripe live validation', 'no usable secret key')
} else {
  let acctId = null
  try {
    const acct = await stripeGet('account')
    if (!acct.ok) {
      fail(
        'Stripe auth',
        `GET /v1/account returned ${acct.status}${acct.body?.error?.message ? ` — ${acct.body.error.message}` : ''}`,
        'The secret key is invalid, revoked, or for a different environment.',
      )
    } else {
      acctId = acct.body?.id ?? null
      pass('Stripe auth', `authenticated as ${acctId} (${stripeMode} mode)`)
    }
  } catch (err) {
    warn(
      'Stripe auth',
      `could not reach api.stripe.com — ${err.message}`,
      'Network issue; re-run when online or use --offline.',
    )
  }

  if (acctId) {
    for (const [tier, id] of Object.entries(priceIds)) {
      if (!id || !id.startsWith('price_')) continue
      try {
        const r = await stripeGet(`prices/${encodeURIComponent(id)}`)
        if (r.status === 404) {
          // THE bug from 2026-07-31: keys from one Stripe account, products from another.
          fail(
            `STRIPE_PRICE_${tier} exists`,
            `Stripe (account ${acctId}, ${stripeMode} mode) has no price ${id}`,
            `Either the price lives in a DIFFERENT Stripe account, or in the other mode (test vs live). One email can own several accounts — open the price in the Dashboard and confirm its URL contains ${acctId}.`,
          )
        } else if (!r.ok) {
          fail(
            `STRIPE_PRICE_${tier} exists`,
            `lookup returned ${r.status}${r.body?.error?.message ? ` — ${r.body.error.message}` : ''}`,
            'See the Stripe error above.',
          )
        } else {
          const p = r.body
          const problems = []
          if (!p.recurring) {
            problems.push('is ONE-TIME, but checkout runs in subscription mode')
          }
          if (p.active === false) {
            problems.push('is archived/inactive')
          }
          if (problems.length > 0) {
            fail(
              `STRIPE_PRICE_${tier} usable`,
              `${id} ${problems.join(' and ')}`,
              'Create a new recurring, active price on this product and update the env var.',
            )
          } else {
            const amt =
              p.unit_amount != null
                ? `${(p.unit_amount / 100).toFixed(2)} ${String(p.currency).toUpperCase()}`
                : 'metered'
            pass(`STRIPE_PRICE_${tier}`, `${amt} / ${p.recurring.interval} — active, recurring`)
          }
        }
      } catch (err) {
        warn(`STRIPE_PRICE_${tier}`, `lookup failed — ${err.message}`, '')
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const ICON = {
  pass: `${C.g}✓${C.x}`,
  fail: `${C.r}✗${C.x}`,
  warn: `${C.y}!${C.x}`,
  skip: `${C.d}–${C.x}`,
}
const width = Math.max(...results.map((r) => r.name.length))

console.log(`\n${C.b}SimpleSense — config doctor${C.x}${OFFLINE ? `${C.d} (offline)${C.x}` : ''}\n`)
for (const r of results) {
  console.log(
    `  ${ICON[r.kind]} ${r.name.padEnd(width)}  ${r.kind === 'pass' ? C.d : ''}${r.detail}${C.x}`,
  )
  if (r.fix && r.kind !== 'pass') console.log(`    ${C.d}↳ ${r.fix}${C.x}`)
}

const failures = results.filter((r) => r.kind === 'fail').length
const warnings = results.filter((r) => r.kind === 'warn').length
console.log('')
if (failures > 0) {
  console.log(
    `${C.r}${C.b}${failures} blocking problem(s)${C.x}${warnings ? `, ${warnings} warning(s)` : ''}\n`,
  )
  process.exit(1)
}
console.log(
  `${C.g}${C.b}No blocking problems${C.x}${warnings ? `, ${warnings} warning(s) — see above` : ''}\n`,
)
