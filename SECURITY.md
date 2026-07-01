# Security posture

SOC 2-aware posture for Simple Sense. This seeds the compliance roadmap; it documents what
we store, how it's protected, and how data is deleted.

## Data flow

Merchant connects Shopify (OAuth) → we store an **encrypted** access token → background
backfill ingests orders/customers/products/locations into tenant-scoped tables → pure
analyzers compute metrics → the LLM (Anthropic) receives **only computed signals/metrics**
(never raw PII) and returns ranked prescriptions → grounding validation → persisted as
recommendations → rendered in the app / curated into the public Audit.

## What we store

- **Org/User** (email), **Store** (shop domain, encrypted token, sync status).
- **Ingested analytics**: customers (email/city/region/zip/coords), products, orders
  (totals, ship-to), line items — only the fields the analyzers need (PII minimization).
- **Analysis outputs**: metrics, recommendations, outcomes (aggregate numbers + copy).

## Controls

- **Secrets at rest**: Shopify OAuth tokens encrypted with AES-256-GCM (`APP_ENCRYPTION_KEY`,
  random IV per value). Provider keys live only in env / host secrets, never in git
  (`.env*` is gitignored; verified each commit).
- **Tenant isolation**: every domain row resolves to an `organizationId`; reads go through
  tenant-scoped helpers that prove org ownership before returning data. Automated test
  (`@ss/db` tenancy) asserts org A cannot read org B's rows; the status-write server action
  re-checks ownership.
- **Webhook integrity**: inbound Shopify webhooks are HMAC-SHA256 verified over the RAW
  body before processing; OAuth callbacks verify the query HMAC + an anti-CSRF state cookie.
- **No PII/secrets in logs**: `redactSecrets`/`redactDeep` mask emails, Anthropic/Shopify
  tokens, and bearer tokens; webhook logs carry topic + shop domain only.
- **Rate limiting**: sensitive routes (OAuth start per-IP, webhook per-shop) use a
  fixed-window limiter (per-instance; move to Upstash/Redis for multi-instance).
- **Grounding (trust)**: every number shown traces to a computed metric; the validator
  rejects fabricated figures (Prime Directive #1).
- **Fail fast**: `assertServerEnv` throws in production if `APP_ENCRYPTION_KEY`/`DATABASE_URL`
  are missing.
- **Transport**: HTTPS enforced (Fly `force_https`); Postgres over TLS (Supabase).

## Data deletion & retention

- **Disconnect purges data**: `disconnectStore` deletes the store's customers, products,
  orders, line items, locations, analysis runs, metrics, recommendations, outcomes, and
  audits, and clears the encrypted token — tenant-scoped, tested.
- Retention: ingested data persists while the store is connected; removed on disconnect.

## Cross-tenant learning

The outcome flywheel may sharpen priors across the install base, but only from **aggregated**
outcomes (counts/means across many orgs) — never by joining one org's rows to another's
(ADR-007).

## Known gaps / roadmap

- Auth is **Clerk-backed** (cookie sessions → org, gated on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`;
  `assertServerEnv` refuses to boot on a half-configured Clerk env). The unauthenticated fallback
  resolves to a shared **read-only** demo org; mutating server actions refuse writes to the demo store.
- Error monitoring (Sentry) and audit logging for sensitive actions are planned (Slice 12+).
- Rate limiter is per-instance (in-memory); needs a shared store for horizontal scale.
- Ingest is not transactional per-store; a mid-sync failure leaves partial data (surfaced via the
  SYNCING/ERROR status), recovered by an idempotent re-sync.

## Reporting

Email security concerns to the maintainer; do not open public issues for vulnerabilities.
