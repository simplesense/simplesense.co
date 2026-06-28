# SimpleSense — Shopify App Store Build Plan

## Executive Summary

SimpleSense is already a working standalone Shopify analytics SaaS: Clerk-cookie auth, an authorization-code OAuth install from `/connections`, AES-256-GCM token storage, a `RealShopifyReader` pulling orders/customers/products over Admin GraphQL, and an analyzer → grounded-LLM → moves pipeline. The complete Stripe Checkout billing loop also exists (`packages/integrations/src/stripe.ts`, `Subscription` model, `currentTier` gating). The goal of this plan is to make SimpleSense a **public Shopify App Store app** installable **both** embedded in the Shopify admin **and** standalone from simplesense.co — without rewriting the tenant-scoped data layer.

**What's DONE vs NEW:**

| Area | DONE | NEW |
|---|---|---|
| Standalone install | Auth-code OAuth (`/api/stores/connect/start` + `/callback`), HMAC + `ss_oauth_state` cookie, token encrypt/upsert | Adopt-existing-install reconciliation; DEMO-attach guard |
| Auth | Clerk cookie → `getSession()` → `{orgId, userId}` | Session-token JWT branch (embedded), middleware verify + header forwarding |
| Reader/analyzers | `RealShopifyReader`, geography/pareto, grounded moves | `read_all_orders` scope + data-access approvals; typed status errors for re-grant |
| Billing | Stripe Checkout + webhook + `Subscription` | Shopify Billing API leg (hybrid); `provider` field |
| Webhooks | Generic HMAC endpoint (no-op `TODO(Slice 3)`) | The three GDPR/compliance handlers + registration + `ComplianceEvent` |
| Embedded UI | — | App Bridge in `<head>`, `/app-embedded` shell, token exchange install |
| Listing/legal | Marketing pages, demo audit | `/privacy`, `/terms`, `/support`; listing assets; data-approval submissions |
| `shopify.app.toml` | — | New file: scopes, webhooks, app URL, redirect URLs |

**Two key decisions:**

1. **Auth model — converge, don't fork.** Embedded requests authenticate with **Shopify session tokens** (JWT from App Bridge) verified in middleware, which forwards a trusted `x-ss-shop-domain` header; standalone requests keep the **Clerk cookie**. Both collapse into the *unchanged* `getSession(): Promise<{orgId, userId}>` chokepoint (`apps/web/lib/auth.ts`), so every `orgId`-scoped query downstream works verbatim. A shop-keyed identity provisions a `SHOPIFY`-source `Organization`, never DEMO, with a claim/merge flow to attach a Clerk account later.

2. **Billing model — hybrid, not contested-exception.** Use the **Shopify Billing API** for merchants who install/bill from the admin (the App-Store-safe default), and **keep Stripe** for simplesense.co direct signups. The `Subscription` model already abstracts the processor (`currentTier` reads only `tier` + `status`), so a second processor is additive. We do **not** stake review approval on the contested Requirement 1.2.2 Stripe exception.

**Recommendation:** Build the session-token auth + shop-keyed identity bridge first (everything else depends on a non-Clerk tenant), then the embedded App Bridge shell + token-exchange install, then GDPR webhooks and the Shopify Billing leg in parallel, then scope/data approvals — all validated end-to-end on a **development store** (exempt from data review) before submitting. Realistic time from "embedded build done" to public listing is **5–9 weeks**, dominated by Shopify's data-access approvals and 1–3 review rounds, so submit the `read_all_orders` and protected-customer-data requests early against the dev store.

---

## Architecture

### The convergence point

Every page and route handler learns its tenant from exactly one function:

```
getSession(): Promise<{ orgId, userId }>   // apps/web/lib/auth.ts
```

Today it has two branches: Clerk `auth()` when `hasClerk`, else `DEMO`. We add a **third, highest-priority branch** for embedded Shopify requests. The three branches are mutually exclusive **per request** and resolve deterministically:

```
                        ┌─────────────────────────────────────────┐
   Embedded (iframe)    │  App Bridge attaches session-token JWT   │
   admin.shopify.com    │  Authorization: Bearer <jwt>             │
        │               │  (or ?id_token=<jwt> on first doc load)  │
        ▼               └─────────────────────────────────────────┘
   middleware.ts ──verify HS256 (SHOPIFY_API_SECRET, jose/WebCrypto, Edge)──┐
        │  strips inbound x-ss-* first; sets x-ss-shop-domain on success     │
        ▼                                                                    │
   getSession() ── shopDomain header? ──► orgIdForShop(shopDomain) ──────────┤
        │            (Node runtime, Prisma OK)                               │
        │                                                                    ▼
   Standalone (first-party simplesense.co)                          { orgId, userId }
        │  Clerk cookie session                                     orgId-scoped queries
        ▼                                                           (unchanged everywhere)
   clerkMiddleware → auth.protect() ── auth() ──► Clerk orgId ──────────────┘
        │
        └─ no Clerk configured ──► DEMO  (showcase only)
```

**Single shop→org identity.** Both paths key the tenant on the canonical `*.myshopify.com` domain:

- Embedded: middleware verifies the JWT → `shopDomain = new URL(payload.dest).host` → `getSession()` calls `resolveOrgForShop(shop, scopes)` (the identity-bridge provisioner), which upserts a `source: SHOPIFY` `Organization` + `ShopInstall` row and returns its `orgId`. **Never DEMO.**
- Standalone: Clerk `auth()` resolves/creates a `source: CLERK` org (now keyed by the new `clerkOrgId` column, not the PK).
- The two reconcile via the **claim/merge** flow (one physical `Store` per `shopDomain`; whichever org owns it wins, Clerk org surviving on merge).

### Reconciling cross-section inconsistencies (resolved here, authoritative)

The specialist sections proposed overlapping mechanisms; the following are the **binding** decisions:

1. **`getSession()` vs `resolveOrgForShop()` for the embedded org.** The dual-auth section sketched a lightweight `orgIdForShop(shopDomain)` upsert; the identity-bridge section specified the fuller `resolveOrgForShop(shop, scopes)` that also writes `ShopInstall`. **Decision:** `getSession()`'s embedded branch calls `resolveOrgForShop` from the identity bridge (`apps/web/lib/shop-org.ts`). The lightweight `orgIdForShop` is folded into it. Scopes are written at token-exchange time, not on every render — on a bare RSC render where scopes aren't known, the resolver resolves the **existing** install (it is only *created* during the token-exchange install path).

2. **`Store.shopDomain @unique` already exists** (`schema.prisma:90`); no new column needed. The identity bridge adds `ShopInstall.shopDomain @unique` as the *install* key; the dual-auth section's "add `Store.shopDomain @unique`" open item is therefore already satisfied — the **join key for auth is `ShopInstall`, not `Store`.**

3. **`Organization.id` is not rewritten.** Existing orgs keep their legacy Clerk/`personal_<userId>` string PKs; new orgs get cuids. Lookups move to the new nullable-unique `clerkOrgId`. This is the safe migration (see Risks).

4. **CSP/framing is set once, in middleware.** Both the dual-auth and embedded sections proposed framing headers; to avoid loosening CSP on standalone routes, **middleware** sets a per-shop `frame-ancestors` on embedded responses (it knows the verified `shopDomain`), and `next.config.ts` provides only the standalone `X-Frame-Options: DENY` / wildcard fallback.

5. **Embedded entry path = `/app-embedded`** (the `application_url` in `shopify.app.toml`). The dual-auth matcher, the `isPublic` list, and the CSP scope all key off this path.

6. **Webhook endpoints.** Compliance webhooks are declared in `shopify.app.toml` (managed install registers them) **and** all point at the single existing `/api/webhooks/shopify` route; billing webhooks land on a sibling `/api/webhooks/shopify/billing`.

7. **`userId` shape for embedded sessions** is `shopify_<sub>`. Nothing downstream assumes a Clerk id (queries are `orgId`-scoped). Billing never keys on `userId` — Stripe keys on `orgId` metadata, Shopify Billing keys on `orgId` too.

---

## Dual authentication architecture

This specifies how Shopify **session-token** auth (embedded admin) coexists with **Clerk cookie** auth (standalone), both collapsing into `getSession()` so **no downstream `orgId`-scoped code changes.**

### Design principle

`getSession()` is the single chokepoint. We add a third, higher-priority branch: **if the request carries a valid Shopify session token, resolve the org from it; otherwise fall through to the existing Clerk/DEMO logic.** Embedded and standalone never mix within a single request — context is detected per-request, deterministically.

### 1. Request-context detection (embedded vs standalone) — **S**

A request is "embedded" iff it presents a Shopify session token. Two transports, in priority order:

1. **`Authorization: Bearer <jwt>`** — App Bridge attaches this to all `fetch`/XHR from the embedded client.
2. **`?id_token=<jwt>` query param** — present on the first full-page document load Shopify performs into the iframe, before App Bridge JS boots.

New helper `getShopifySessionToken(req: NextRequest | Headers): string | null` (in `apps/web/lib/shopify/session-token.ts`) reads the header first, then the query param. We do **not** trust `embedded=1` or referer for auth decisions (spoofable); the token's signature is the only trust signal. `embedded=1` is used only for *UI* (whether to mount App Bridge).

Because Server Components cannot read the raw request, the verified identity is surfaced via request headers injected by middleware (§5/§6): middleware verifies the token and sets `x-ss-shop-domain` / `x-ss-shop-user`, which `getSession()` reads through `next/headers`.

### 2. Verifying the session-token JWT — **M**

HS256 JWT signed with `SHOPIFY_API_SECRET`. Verification (in `session-token.ts`) checks:

- **Signature**: HS256 over `header.payload` using `SHOPIFY_API_SECRET`. Use `jose.jwtVerify` (Edge/WebCrypto-compatible — required because middleware runs on the Edge runtime).
- **`aud` === `SHOPIFY_API_KEY`** — rejects tokens minted for another app.
- **`exp` not passed; `nbf`/`iat` valid** — tokens are ~1 min lived; allow ≤5s clock skew.
- **`iss`/`dest` host match and end in `.myshopify.com`** — `shopDomain = new URL(payload.dest).host`. Reject if `iss` origin ≠ `dest` origin.

Return `{ shopDomain, shopifyUserId: payload.sub }` on success; throw `SessionTokenError` on any failure. **Verification never downgrades to anonymous** — a present-but-invalid token is a 401 (App Bridge re-fetches and retries), never a silent DEMO fallthrough.

### 3. Mapping a verified token → `orgId` — **M**

`shopDomain` is the join key, resolved through the identity bridge's `resolveOrgForShop` (see Architecture reconciliation #1). Resolution order:

1. Look up `ShopInstall` by `shopDomain` → `install.orgId` is the tenant.
2. If found → `{ orgId: install.orgId, userId: 'shopify_' + payload.sub }`.
3. If not found (token valid but app not yet installed/synced) → the token-exchange install path owns creating the `ShopInstall`; until then `resolveActiveStore(orgId)` returns the demo store as a read-only showcase. (Identity-bridge open question: a provisioned-but-unsynced state may be preferable so embedded orgs never see DEMO data.)

### 4. Where verification lives — **S**

New Edge-safe module `apps/web/lib/shopify/session-token.ts` (WebCrypto/`jose` only, no Node `crypto`), exporting `getShopifySessionToken`, `verifySessionToken`, and re-exporting the identity bridge's resolver for the Node path. The DB-touching resolver is **not** called from middleware (Prisma is not Edge-safe) — middleware only verifies and forwards `x-ss-shop-domain`; the org upsert happens in `getSession()` on the Node runtime.

### 5. `getSession()` refactor — **M**

`apps/web/lib/auth.ts` gains a highest-priority Shopify branch:

```ts
export async function getSession(): Promise<Session> {
  const h = await headers()
  const shopDomain = h.get('x-ss-shop-domain')       // set by middleware after JWT verify
  if (shopDomain) {
    const { orgId } = await resolveOrgForShop(shopDomain)  // identity bridge; Prisma OK on Node
    return { orgId, userId: `shopify_${h.get('x-ss-shop-user') ?? 'embedded'}` }
  }
  if (!hasClerk) return { orgId: DEMO.orgId, userId: DEMO.userId }
  const { userId, orgId } = await auth()
  // …existing Clerk branch, now writing clerkOrgId/source per identity-bridge…
}
```

- The Shopify branch is gated on the **middleware-verified** header, never a raw token read inside `getSession()` — the signature check happens exactly once, on the Edge.
- `Session` interface is unchanged → every `orgId`-scoped query keeps working verbatim.
- `/api/*` route handlers that need the token outside RSC render can call `verifySessionToken` directly on the `Authorization` header.

### 6. Middleware changes — **L**

`apps/web/middleware.ts` must stop letting Clerk gate embedded requests and verify Shopify tokens itself:

1. **Strip inbound spoofed headers first**: delete any client-supplied `x-ss-shop-domain` / `x-ss-shop-user` before any logic. (Tenant-isolation-critical invariant.)
2. **Embedded detection**: if `getShopifySessionToken(req)` returns a token → `verifySessionToken` → on success clone headers, set `x-ss-shop-domain` + `x-ss-shop-user`, `NextResponse.next({ request: { headers } })`, and **do not invoke `auth.protect()`**. On verify failure → `401` (App Bridge retries), except the first `?id_token` document load → 302 to the App Bridge auth bounce.
3. **Standalone path** (no token): existing `clerkMiddleware` — `auth.protect()` unless `isPublic`.

Practical structure: keep `clerkMiddleware` as the outer wrapper but short-circuit inside its callback when a Shopify token is present (return the header-augmented `NextResponse.next()` before `auth.protect()`). Matcher unchanged.

**`isPublic` additions**: `/app-embedded(.*)`, `/api/shopify(.*)` (token-exchange install), the auth-bounce route, and the already-covered `/api/webhooks(.*)` / `/api/stores/connect(.*)`.

### 7. CSP / framing for embedded routes — **M**

Today no framing headers exist. Add path-scoped rules:

- **Embedded routes** (`/app-embedded/:path*`): `Content-Security-Policy: frame-ancestors https://admin.shopify.com https://<shop>.myshopify.com;` set **in middleware** (where the verified `shopDomain` is known, for least-privilege); **remove/omit `X-Frame-Options`** entirely (it cannot express a third-party origin). `next.config.ts` provides the `https://*.myshopify.com` wildcard fallback.
- **Standalone routes**: `X-Frame-Options: DENY` (or `frame-ancestors 'none'`) — never framed.

### Risks

- **Header spoofing.** Mandatory unconditional inbound strip of all `x-ss-*` at the top of middleware; never read these headers in any matcher-excluded route (`_next`, static).
- **Edge runtime constraints.** `SHOPIFY_API_SECRET` must be available on the Edge; verification must use `jose`/WebCrypto. `assertServerEnv()` (`instrumentation.ts`) runs only on Node — add the Shopify trio there *and* guard in middleware.
- **`fail-fast` regression.** Extend `assertServerEnv` (`packages/config`) to require `SHOPIFY_API_KEY`/`SECRET` + encryption key once embedded mode is enabled, or embedded auth silently 401s.
- **DEMO collapse.** A present-but-invalid token must 401, never fall through — enforced only if middleware 401s rather than passing unverified tokens through.
- **Clock skew.** ≤5s skew on ~1-min tokens; no more (replay window).
- **`clerkMiddleware` wrapping.** Confirm no `auth()` cookie side-effects fire in the cookieless iframe when `protect()` is skipped.

### Open questions

- First-load bounce vs 401 path: the token-exchange/install section owns the bounce route; wire the 302 target.
- Per-shop vs wildcard CSP — leaning per-shop (least privilege); confirm acceptable for review.

---

## Embedded app + App Bridge + install flow

This adds a **second, parallel entry path**: an embedded App-Bridge experience inside the Shopify admin iframe that authenticates with **session tokens + token exchange** (no cookies), while the existing authorization-code flow (`/api/stores/connect/start` + `/callback`, `RealShopifyClient.exchangeCodeForToken` in `packages/integrations/src/shopify/client.ts`) is preserved verbatim for the standalone install.

### 1. App Bridge in `<head>` (mandatory, first script) — **M**

`apps/web/app/layout.tsx` is the only root layout. Shopify requires `app-bridge.js` to be the **first** `<script>` in `<head>`, with the API key in a meta tag, on **every** embedded route:

- `<meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY} />`
- `<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />`

Rendered unconditionally so the admin can always boot App Bridge. `NEXT_PUBLIC_SHOPIFY_API_KEY` is a new public build-time var (the API key is non-secret) — distinct from the server-only `SHOPIFY_API_KEY` read by `shopifyConfig()` (`packages/config/src`). App Bridge is inert outside the admin iframe, so shipping it to the standalone site is safe; gate App-Bridge **usage** on `host`/`embedded`, not script presence. `layout.tsx` wraps `children` in `ClerkProvider` when `hasClerk`; the embedded shell must bypass the Clerk dependency (item 3).

### 2. Embedded entry point / App URL handler — **M**

Shopify opens the app at the configured **App URL** with `?shop=&host=&embedded=1&id_token=...`. New route group `apps/web/app/(embedded)/` (or `apps/web/app/app-embedded/page.tsx`) that reads `shop`/`host`, renders the embedded shell (not the Clerk-bound `AppShell`), and on mount acquires a session-token JWT from App Bridge and calls the token-exchange install endpoint (item 5). `application_url` in `shopify.app.toml` points here (`https://simplesense.co/app-embedded`).

### 3. Embedded shell / layout — **M**

New `apps/web/components/EmbeddedShell.tsx`: no Clerk `<UserButton>`, no left sidebar that duplicates the admin nav. Use App Bridge UI (`ui-nav-menu`, `ui-title-bar`). Factor the shared inner content of `AppShell.tsx` out from its Clerk/Sidebar chrome so the same page bodies (moves, audit, customers) render in both contexts.

### 4. Embedded client-side routing / navigation — **M**

Navigation that changes the admin URL must go through App Bridge to preserve `host`/session context (`ui-nav-menu`; keep `?host=` on internal `<Link>`s). All authenticated fetches attach `Authorization: Bearer <jwt>` via the App Bridge `fetch` wrapper so the session token rides along (the current pages rely on the Clerk cookie via `getSession()`).

### 5. Token-exchange install path (embedded) — **L**

New endpoint `apps/web/app/api/shopify/install/route.ts` (public in middleware, item 8):

1. Receives the session token (JWT) in `Authorization: Bearer`.
2. Verifies signature against `SHOPIFY_API_SECRET`, validates `dest`/`aud`/`exp` → trusted `shop`.
3. **Token exchange**: POST `https://{shop}/admin/oauth/access_token` with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token=<session JWT>`, `subject_token_type=urn:ietf:params:oauth:token-type:id_token`, `requested_token_type=urn:shopify:params:oauth:token-type:offline-access-token`, `client_id`, `client_secret`.
4. Calls `resolveOrgForShop(shop, scopes)` (identity bridge) for the `orgId`, then encrypts + upserts the token exactly like the callback does today (`encryptSecret`, `prisma.store.upsert` keyed on `shopDomain`, `syncStatus: 'PENDING'`), and registers business + compliance webhooks.

Extend `ShopifyClient` (`packages/integrations/src/shopify/client.ts`) with `exchangeSessionToken(shop, sessionToken)` alongside `exchangeCodeForToken`, plus a JWT-verify helper; `MockShopifyClient` gets a deterministic mock.

**Offline token** is the binding choice (Architecture/data needs): webhooks + Inngest backfill run outside any user session, so online tokens would break background sync.

### 6. Shopify-managed installation via `shopify.app.toml` — **S**

New `shopify.app.toml` at repo root declaring `client_id`, `application_url = "https://simplesense.co/app-embedded"`, `embedded = true`, `[access_scopes]` (the exact data-approvals string), `[auth] redirect_urls` (must include the existing `https://simplesense.co/api/stores/connect/callback` so the standalone flow stays valid), and `[webhooks]` compliance topics. With `embedded = true` + managed install, Shopify presents the scope-grant screen and installs without an app-driven OAuth round-trip; the app then immediately does token exchange.

### 7. `next.config.ts` headers / CSP — **M**

(Authoritative version in the dual-auth §7 / Architecture #4.) `apps/web/next.config.ts` sets no `headers()` today. The per-shop `frame-ancestors` is set dynamically in middleware from the verified `shopDomain`; **do NOT** send `X-Frame-Options: DENY/SAMEORIGIN` on embedded routes; confirm Next/Fly isn't injecting one. Standalone routes keep stricter framing.

### 8. Middleware exemption — **S**

Add `/app-embedded(.*)` and `/api/shopify(.*)` to `isPublic` (they authenticate via session tokens, not the Clerk cookie). `/api/stores/connect(.*)` and `/api/webhooks(.*)` are already exempt. Keep standalone authenticated routes gated.

### 9. Dockerfile build args — **S**

`Dockerfile` already passes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as `ARG`/`ENV` (NEXT_PUBLIC_* is inlined at build). Add `ARG NEXT_PUBLIC_SHOPIFY_API_KEY` + `ENV ... =$NEXT_PUBLIC_SHOPIFY_API_KEY` before `pnpm --filter @ss/web build`, and pass via `fly deploy --build-arg`. Server-side `SHOPIFY_API_KEY`/`SECRET` stay runtime env.

### State-cookie conflict — why token exchange is mandatory

The standalone flow's CSRF defense is the `ss_oauth_state` cookie (`start/route.ts` sets it; `callback/route.ts` requires `jar.get('ss_oauth_state')?.value === query.state`). This works only because that flow is **first-party**. A Shopify-initiated install opens inside the admin iframe as a **third party** — third-party cookies are blocked, so the state cookie can never be set/verified and `callback/route.ts` would 401. **Token exchange sidesteps the cookie entirely**: the App Bridge session token is itself a signed, short-lived JWT for this shop+app; verifying it against `SHOPIFY_API_SECRET` provides the same anti-forgery guarantee. The embedded install path carries **no** `ss_oauth_state` and **must not** reach `callback/route.ts`. The two flows stay cleanly separated.

### Risks

- **Clerk in the iframe.** The embedded shell must be fully Clerk-free; an accidentally-rendered `<UserButton>` attempts third-party-cookie auth and fails silently.
- **CSP `frame-ancestors` must be dynamic per shop** — a static CSP can't enumerate every shop; getting it wrong yields a blank admin iframe.
- **Online vs offline token** — offline is required for durable jobs (decided above).
- **API key naming clash** — `NEXT_PUBLIC_SHOPIFY_API_KEY` next to server `SHOPIFY_API_KEY` risks a build/runtime mismatch if they diverge.
- **Global App-Bridge script** ships to standalone visitors too (inert, low risk; minor head weight).

### Open questions

1. Dedicated `/app-embedded` vs making `/app` embed-aware (dedicated keeps `AppShell` untouched — recommended).
2. Session-token verification placement: package (`packages/integrations/src/shopify/`) for testability + `MockShopifyClient` parity vs inline (recommend package).
3. Does `registerWebhooks` (REST, API `2024-10` in `client.ts`) stay, or move business webhooks to `shopify.app.toml`? (Coordinate with compliance section.)

---

## Shop ↔ account identity bridge

### Problem statement

Today the only way a `Store` gets an `orgId` is `app/api/stores/connect/callback/route.ts:43` → `getSession()` reading the Clerk cookie. An embedded install has **no Clerk cookie and no Clerk user** on first load. Two failures result:

1. `getSession()` (`lib/auth.ts:24`) returns `{ orgId: DEMO.orgId }` when `userId` is falsy → an embedded install would upsert the shop's `Store` onto the **shared DEMO org**, collapsing tenant isolation.
2. No schema concept of "a shop that installed us but has no human account yet."

This specifies a **shop-keyed identity** that provisions an `Organization` from the shop alone, never touches DEMO, plus a **claim/merge** flow to attach a Clerk user later.

### Schema deltas (`packages/db/prisma/schema.prisma`) — all **M**

**1. `Organization`: provenance + canonical shop link.**

```prisma
enum OrgSource { CLERK SHOPIFY }

model Organization {
  id            String        @id @default(cuid())
  name          String
  source        OrgSource     @default(CLERK)
  clerkOrgId    String?       @unique   // nullable; SHOPIFY orgs have none until claimed
  createdAt     DateTime      @default(now())
  users         User[]
  stores        Store[]
  subscription  Subscription?
  installs      ShopInstall[]
}
```

Today `Organization.id` is overloaded to hold the Clerk org id / `personal_<userId>` string (`lib/auth.ts:27-31`). That conflation is the root cause — a SHOPIFY org has no external id for a PK. Move the Clerk external id into the new nullable-unique `clerkOrgId`; let `id` be a real cuid for new orgs (legacy rows keep their string PKs — see Risks).

**2. New `ShopInstall` model — the install/identity fact.**

```prisma
enum InstallStatus { ACTIVE UNINSTALLED }

model ShopInstall {
  id              String        @id @default(cuid())
  shopDomain      String        @unique          // canonical *.myshopify.com, normalizeShop()
  orgId           String
  status          InstallStatus @default(ACTIVE)
  scopes          String                         // granted scopes from token exchange, CSV
  installedAt     DateTime      @default(now())
  uninstalledAt   DateTime?
  claimToken      String?       @unique          // short-lived, surfaced to embedded session
  claimTokenExp   DateTime?
  claimedByUserId String?
  org             Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  @@index([orgId])
}
```

A separate model (vs columns on `Store`) because `Store` is the *analytics* entity and `ShopInstall` is the *install/identity* fact (1:1 with a myshopify domain) that must exist **before** any store data.

**3. `User`:** `User.email @unique` (`schema.prisma:79`) is already the natural merge key. Optionally add `clerkUserId String? @unique` (effort **S**) — email-match suffices for v1.

### Provisioning on first embedded load / token exchange

`apps/web/lib/shop-org.ts` (effort **M**), called only after the session-token JWT is verified and token exchange succeeded:

```ts
export async function resolveOrgForShop(shop: string, scopes?: string): Promise<{ orgId: string }> {
  const shopDomain = normalizeShop(shop)               // reuse @ss/integrations normalizeShop
  if (!isValidShopDomain(shopDomain)) throw new Error('bad shop')
  const install = await prisma.$transaction(async (tx) => {
    const existing = await tx.shopInstall.findUnique({ where: { shopDomain } })
    if (existing) {
      return scopes
        ? tx.shopInstall.update({ where: { shopDomain }, data: { status: 'ACTIVE', scopes, uninstalledAt: null } })
        : existing
    }
    const org = await tx.organization.create({ data: { name: shopDomain, source: 'SHOPIFY' } })
    return tx.shopInstall.create({ data: { shopDomain, orgId: org.id, scopes: scopes ?? '', status: 'ACTIVE' } })
  })
  return { orgId: install.orgId }
}
```

(`scopes` is optional so the bare RSC-render path from `getSession()` resolves without overwriting — see Architecture #1.) The token-exchange handler then upserts the `Store` with `orgId = install.orgId`. **Idempotency:** `Store.shopDomain @unique` + `ShopInstall.shopDomain @unique` converge repeated loads onto one org/one store.

### Fixing the DEMO-attach bug — **S**

In `callback/route.ts`, after `const { orgId } = await getSession()`:

```ts
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && orgId === DEMO.orgId) {
  return NextResponse.redirect(`${cfg.appUrl}/sign-in?next=/connections`)
}
```

This closes the window where an unauthenticated user completes OAuth and attaches to DEMO. Additionally, before upserting, look up `shopInstall.findUnique({ where: { shopDomain: shop } })` and, if found and unclaimed, run the claim/merge against the current `userId` so a standalone OAuth for a shop that installed embedded first **adopts** that install's org instead of creating a second.

### Merge / claim flow — `apps/web/lib/claim-shop.ts` (effort **L**)

Triggers:
- **Embedded → Clerk:** the embedded app shows a "Connect your SimpleSense account" CTA deep-linking to `simplesense.co/connections?claim=<claimToken>`; after Clerk sign-in the claim handler validates token + expiry and binds.
- **Clerk → Shopify:** the standalone-callback adoption above.

Binding (one `prisma.$transaction`):

1. Resolve the Clerk org (writes `clerkOrgId` + `source: CLERK`).
2. Load `shopInstall` by `shopDomain`.
3. If `shopInstall.orgId === clerkOrg.id` → no-op.
4. Else **re-parent**, surviving org = the Clerk org (carries billing/`Subscription` + human `User`s):
   - `UPDATE Store SET orgId = clerkOrg.id WHERE shopDomain = …`
   - `UPDATE ShopInstall SET orgId = clerkOrg.id, claimToken = null, claimedByUserId = <userId>`
   - Analysis artifacts (`AnalysisRun`, `Recommendation`, `Audit`) hang off `storeId`, so moving `Store.orgId` is sufficient — **no per-row re-parenting** (confirmed `schema.prisma:202-278`).
   - Delete the empty SHOPIFY org only if it has no other stores and no `Subscription`.
5. **Conflict guard:** if `shopInstall.orgId` already points at a *different CLERK org* → return **409**, require manual support (prevents shop-stealing).

### Touch list

| Item | File | Effort |
|---|---|---|
| `OrgSource`, `clerkOrgId`, `ShopInstall`, `InstallStatus` | `packages/db/prisma/schema.prisma` | M |
| Migration: add `clerkOrgId` + backfill, keep legacy PKs | `packages/db/prisma/migrations` | M |
| `getSession()` writes `clerkOrgId`/`source`, stops keying PK on Clerk id | `apps/web/lib/auth.ts:26-33` | M |
| `resolveOrgForShop()` | new `apps/web/lib/shop-org.ts` | M |
| DEMO-attach guard + install adoption | `app/api/stores/connect/callback/route.ts:43-53` | S |
| `claimShop()` | new `apps/web/lib/claim-shop.ts` | L |

### Risks

- **Migrating `Organization.id` is the riskiest change.** Recommend: add `clerkOrgId`, backfill `clerkOrgId = id` for existing rows, **leave legacy string ids as-is** (don't rewrite PKs — `Store.orgId`/`Subscription.orgId`/`User.orgId` all FK to it), switch lookups to `clerkOrgId`, mint cuids only for new orgs.
- **Double-org window:** install embedded + sign up standalone before claiming → two orgs transiently. Claim re-parents the `Store`; the pre-claim Clerk-org UI looks empty until claimed. Needs a clear "claim your shop" prompt.
- **`Store.shopDomain @unique` collision:** the `update` branch in `callback/route.ts:46` does **not** set `orgId` (preserves first-claimer's org) — correct; assert in a test that the embedded provisioner likewise never overwrites `orgId` on update.
- **Claim-token leakage:** single-use, TTL ≤15 min, bound to `shopDomain`; treat the URL as a bearer credential.
- **Org name = shopDomain** is a placeholder; replace with the shop's real name post-provision.

### Open questions

- Can a `SHOPIFY`-source org operate **fully headless** (run analyses, show moves embedded) with no Clerk user ever, or is a Clerk account a hard gate? (Billing likely forces an answer.)
- On reinstall after `UNINSTALLED`, reuse the original org/data or start fresh? Spec reuses it — confirm against GDPR-redact policy.
- Does `resolveActiveStore` need a "provisioned-but-not-yet-synced" state so embedded first renders don't fall through to DEMO? Likely yes.

---

## GDPR / Compliance Webhooks

Shopify's three mandatory privacy webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) are a hard review gate. Today `apps/web/app/api/webhooks/shopify/route.ts` HMAC-verifies then no-ops (`TODO(Slice 3)`); `packages/integrations/src/shopify/webhooks.ts` exposes only `verifyWebhookHmac`. This specs the handlers, registration, and audit trail, building on `packages/db/prisma/schema.prisma` and the purge logic in `packages/db/src/disconnect.ts`.

### Reuse: HMAC verification (no change) — **S**

`verifyWebhookHmac(raw, hmac, apiSecret)` already does constant-time base64 HMAC-SHA256 over the **raw** body. Reuse the existing path (read `req.text()` → verify against `x-shopify-hmac-sha256` **before** any parsing). Keep the `503` guard when `cfg.apiSecret` is unset (5xx is retryable). The three privacy topics arrive on the **app-level** subscription, signed with the app secret — identical to today.

### Routing the three topics — **M**

Replace the `TODO(Slice 3)` tail with a topic switch **after** HMAC verification (`JSON.parse(raw)` only post-verify):

- `customers/data_request` → `handleCustomerDataRequest(payload)`
- `customers/redact` → `handleCustomerRedact(payload)`
- `shop/redact` → `handleShopRedact(payload)`
- existing non-privacy topics → keep the enqueue path.

Handlers live in a new `packages/integrations/src/shopify/privacy.ts` (pure functions taking parsed payload + `PrismaClient`), exported through `packages/integrations/src/index.ts`. Resolve tenant via `db.store.findUnique({ where: { shopDomain: payload.shop_domain } })`; unknown store → `200` (nothing to do).

### `customers/redact` → delete customer PII — **M**

Map Shopify's `customer.id` to `Customer.shopifyId` (`BigInt`), scoped by `storeId`. PII lives on `Customer` (`email`, `city`, `region`, `country`, `zip`, `lat`, `lng`) **and** is duplicated onto each `Order` (`shipCity/shipRegion/shipCountry/shipZip/shipLat/shipLng`). Redact **both**:

1. Null out `Order` ship-to PII for the customer's orders (`updateMany`), keeping totals/dates (non-personal analytics).
2. Hard-delete the `Customer` row (`Order.customerId` is `onDelete: SetNull`, schema line 178, so orders detach cleanly). Hard-delete is simpler and more defensible than anonymize-in-place. The analyzer must tolerate null geo.

### `shop/redact` → purge store and all data — **S** (mostly reuse)

Fires **48h after uninstall**. Maps onto `disconnectStore` (`packages/db/src/disconnect.ts`) with two differences: it's org-scoped (webhook has only `shop_domain`), and it keeps the `Store` row. Add a sibling `purgeStoreByDomain(db, shopDomain)` that resolves by `shopDomain` (no org check — Shopify is authoritative) and runs the **same child-deletion sequence**, then **deletes the `Store` row**. Refactor the shared deletion ordering into one private helper used by both to avoid drift. Leave parent `Organization`/`User` unless this was their only store with no subscription (product decision — Open questions).

### `customers/data_request` → assemble + deliver — **L**

Shopify wants the **merchant** furnished the customer's data within **30 days**, out-of-band (the webhook is a notification, not a data-return channel). Resolve store + customer, assemble the footprint (`Customer` PII + `Order` rows + nested `OrderLineItem`s), and **deliver to the merchant** (store `OWNER` `User`), preference order: (a) email a JSON export via the transactional mail path; (b) persist to a `DataRequest`/audit row and surface in `/connections` for download. MVP for review: persist + email the owner. **This shares the transactional-email infra** that the magic-link/listing work needs — depend on it, don't duplicate; no mail sender is confirmed in the repo yet.

### Registration of the three topics — **M**

1. **Managed install (App Store):** declare in `shopify.app.toml` `[webhooks]` `compliance_topics = ["customers/data_request","customers/redact","shop/redact"]`, single `uri = "https://simplesense.co/api/webhooks/shopify"`. Shopify registers automatically — the canonical path.
2. **Standalone authorization-code install:** add `registerComplianceWebhooks(shopDomain, accessToken)` (POSTs the three subscriptions via Admin GraphQL `webhookSubscriptionCreate`) after the standalone callback, pointing at the same endpoint. (May be redundant once the app is managed-install — Open questions.)

Both target the one existing endpoint, so the route's topic switch handles all sources.

### Idempotency & response timing — **S**

- **Idempotency:** handlers must be idempotent — redact = delete-if-exists; shop-redact = `findUnique` by domain; data_request = dedupe (or accept re-email). Use `x-shopify-webhook-id` as the key if a dedupe table is added.
- **Response timing:** ack within Shopify's **5-second** timeout. Work that could exceed it must be **enqueued** (the same durable-job mechanism the Slice 3 TODO references) and return `200` immediately. The 48h/30-day clocks are processing deadlines, not HTTP deadlines.
- `401` on bad HMAC, `200` on success/no-op, `5xx` only on genuine transient failure.

### Audit logging — **S**

The existing `Audit` model (`schema.prisma:269`) is for **public audit shares** — do **not** overload it. Add a dedicated:

```prisma
model ComplianceEvent {
  id               String   @id @default(cuid())
  topic            String
  shopDomain       String
  shopifyWebhookId String?
  payloadHash      String   // sha256 of raw body — proof of receipt, NO PII
  status           String   // RECEIVED | PROCESSED | FAILED
  createdAt        DateTime @default(now())
  processedAt      DateTime?
  @@index([shopDomain])
  @@index([topic, shopDomain])
}
```

Store a **hash** of the payload, never raw PII. Write `RECEIVED` pre-processing, flip to `PROCESSED`/`FAILED` after — auditable proof the 48h/30-day SLAs were met. **No `storeId` FK on purpose** — it must survive `shop/redact` (which deletes the `Store`); never `onDelete: Cascade` it to `Store`.

### Risks

- **`shop/redact` deletes the `Store` row** but `disconnectStore` keeps it; any code assuming a `Store` always exists for a known `shopDomain` (e.g. embedded session-token resolution) must handle redacted-then-reinstalled — the reinstall must re-create the `Store` cleanly.
- **Enqueue vs inline:** if the durable-job mechanism isn't built yet, keep redact narrow (indexed `updateMany`/`deleteMany`) so inline stays under 5s until the queue exists.
- **PII leak via the data_request channel:** the export is itself a PII transfer — use the secured transactional path; no plaintext logging.
- **Orphan ship-to PII:** the `Order.ship*` columns are physically separate from `Customer` and easy to miss.

### Open questions

- Does `shop/redact` delete the parent `Organization`/`User` when it was the only store (GDPR argues yes), or retain for re-install + Stripe subscription?
- Is GraphQL `registerComplianceWebhooks` actually required for the standalone install once the app is managed-install, or do app-level `compliance_topics` cover both paths?
- Confirm a transactional email sender exists before committing to email-to-owner; else persisted-record + `/connections` download is the MVP.

---

## Billing model decision

### Context — what exists today

SimpleSense ships a complete Stripe-Checkout loop that is **provider-agnostic by accident of design**:

- **Tier catalog:** `packages/config/src/tiers.ts` (`TIERS`, `TierId = 'free'|'basic'|'pro'`, $0/$99/$299, the `TierEntitlements` matrix driving `tierAllows`).
- **Stripe client:** `packages/integrations/src/stripe.ts` (`RealStripeClient.createCheckoutSession`, `parseWebhook` with `statusMap → SubStatus`, `MockStripeClient` fallback).
- **Routes:** `apps/web/app/api/billing/checkout/route.ts` and `apps/web/app/api/webhooks/stripe/route.ts` (`prisma.subscription.upsert`).
- **Persistence:** `Subscription` (`schema.prisma:280`) — `orgId @unique`, `stripeCustomerId String?`, `tier`, `status`, `currentPeriodEnd`. Read path `apps/web/lib/billing.ts:currentTier` (`CANCELED ⇒ free`).
- **Config:** `stripeConfig()` (`packages/config/src/env.ts:85`).

**The `Subscription` model is the single source of truth for entitlements, and nothing downstream knows which processor wrote the row.** `currentTier`/`entitlementsForOrg` read only `tier` + `status`. That decoupling is the linchpin.

### Decision

```
Merchant installed from the Shopify admin (embedded session-token)?
├── YES → App must pass App Store review:
│         standalone SaaS that also sells off-Shopify (SimpleSense)
│         → Stripe MAY qualify under connector exception (Req 1.2.2),
│           BUT approval is discretionary → HIGH RISK
│         → SAFE DEFAULT for embedded: (A) Shopify Billing API
└── NO (installed from simplesense.co via Clerk) → (B) Stripe, unchanged
```

The rules attach to **how the merchant arrived**, not to the app globally → **hybrid**.

**Recommendation: adopt the hybrid — (A) Shopify Billing API for admin-installed merchants, (B) keep Stripe for simplesense.co signups.** Do **not** stake App Store approval on Req 1.2.2 for the embedded surface. Rationale: the `Subscription` model already abstracts the processor (additive, not a rewrite); removes the highest-variance review dependency; preserves off-Shopify revenue (no Shopify revenue share on direct signups); marginal cost is M-sized, dominated by one GraphQL client + one webhook mirroring the Stripe ones.

### Implementation delta (the embedded leg)

**1. Schema — `Subscription`** *(S)*: add `enum BillingProvider { STRIPE SHOPIFY }` (`provider`, default `STRIPE`), `shopifySubscriptionGid String?`; `stripeCustomerId` stays null for Shopify-billed orgs. Map Shopify statuses into the existing `SubStatus` (`ACTIVE→ACTIVE`, `PENDING→TRIALING`, `FROZEN→PAST_DUE`, `CANCELLED/EXPIRED/DECLINED→CANCELED`). `currentTier` unchanged.

**2. Config — `packages/config/src/env.ts`** *(S)*: add `shopifyBillingConfig()` (managed vs programmatic + per-tier plan handles). Cleanest mirror: add `shopifyPlanName` fields to `tiers.ts` alongside the existing Stripe price handles so `TIERS` carries both processors in one place.

**3. New client — `packages/integrations/src/shopifyBilling.ts`** *(M)*, parallel to `stripe.ts`:

```ts
interface ShopifyBillingClient {
  createAppSubscription(p: { shop; accessToken; tier: 'BASIC'|'PRO'; returnUrl }): Promise<{ confirmationUrl: string }>
  parseWebhook(rawBody, hmacHeader): { topic; orgId; tier; status } | null
}
```

`createAppSubscription` → Admin GraphQL `appSubscriptionCreate` ($99/$299) → `confirmationUrl`. `parseWebhook` reuses the **shared HMAC primitive** (Shopify base64 HMAC-SHA256 over raw body — keep it in one crypto util shared with the GDPR webhooks). Provide `MockShopifyBillingClient`.

**4. Create route — `apps/web/app/api/billing/shopify/route.ts`** *(M)*: mirror `checkout/route.ts`, but resolve org/shop from the **session token** (not `getSession()`'s Clerk cookie), call `createAppSubscription`, respond with an App Bridge `Redirect` to `confirmationUrl` (**top frame**, not iframe). Reuse the `rateLimit` guard + `tier` validation.

**5. Webhook — `apps/web/app/api/webhooks/shopify/billing/route.ts`** *(M)*: mirror `webhooks/stripe/route.ts` — verify HMAC → `parseWebhook` → `prisma.subscription.upsert({ where: { orgId }, … })` with `provider: 'SHOPIFY'`, `tier`, `status`, `currentPeriodEnd`, `shopifySubscriptionGid`.

**6. Plans UI — `apps/web/app/plans/page.tsx`** *(S)*: branch the form `action` by surface — embedded (Shopify session present) → `/api/billing/shopify`; else `/api/billing/checkout`. Replace the Stripe-only "not configured" banner with a surface-aware message.

**7. Gating — no change** *(—)*: `entitlementsForOrg`/`tierAllows` and every call site stay as-is.

### Dual-surface representation

| Field | Stripe-billed (simplesense.co) | Shopify-billed (embedded) |
|---|---|---|
| `provider` | `STRIPE` | `SHOPIFY` |
| `stripeCustomerId` | set | null |
| `shopifySubscriptionGid` | null | set |
| `tier` / `status` | Stripe webhook | `app_subscriptions/update` webhook |
| read by `currentTier` | identical | identical |

One org → one `Subscription` (`orgId @unique`). Processor is recorded for refund/cancel routing and the "manage billing" link, **never** consulted for entitlements. Cancellation from either side flips `status → CANCELED` → `currentTier` collapses to `free`.

### Resolving the billing ↔ Stripe ↔ auth cross-dependency

The Shopify create route (#4) **cannot** use `getSession()` if that resolves via Clerk cookie — embedded has none. It must derive `orgId` from the **session-token path**. Per the Architecture, by the time a merchant reaches the embedded plans page, middleware has already verified the token and `getSession()` returns the **shop-keyed `orgId`** — so `/api/billing/shopify` *can* call `getSession()` like everything else, provided it's a matched (non-`isPublic`) embedded route carrying the `Authorization` header so middleware injects `x-ss-shop-domain`. This is the convergence payoff: the billing route needs **no special-case org resolution** beyond confirming it runs under the embedded auth branch.

### Risks

- **Double-billing / conflicting rows:** same legal org installing both ways → `orgId @unique` row claimed by whichever webhook fires last. Guard: refuse to create a Shopify subscription when an `ACTIVE` Stripe row exists for that org (and vice-versa), surfaced in UI.
- **Req 1.2.2 discretion:** keep embedded → Shopify Billing as the default; defaulting embedded merchants to Stripe would likely be rejected.
- **Revenue share** differs by acquisition channel (Shopify takes a cut on (A), not (B)) — finance must accept asymmetric net revenue or raise the embedded price.
- **HMAC scheme divergence:** Shopify (base64, raw-body) ≠ Stripe (`t=…,v1=…`). Unit-test both verifiers against fixtures or webhooks silently fail.
- **Status parity:** the Shopify→`SubStatus` map must be exhaustive with a default-to-`CANCELED` (deny) fallback, or an unmapped status over-grants entitlements.

### Open questions

- Managed pricing (declarative, less code) vs programmatic `appSubscriptionCreate` (needed for trials/discounts) at launch?
- Keep a trial on the embedded surface via Shopify `trialDays` or the existing `TRIALING` default?
- Allow an org to *switch* Shopify→Stripe later (churned off Shopify)? Needs a `provider`-rewrite migration path.
- "Manage/cancel" for Shopify-billed orgs → Shopify admin billing page or in-app `appSubscriptionCancel`?
- Price parity ($99/$299) net of Shopify's revenue share, or list a higher embedded price?

---

## Scope & data-access approvals

### 1. Current state (ground truth)

The default scope string is in `packages/config/src/env.ts` (`shopifyConfig`, lines 63–67):

```
read_orders,read_customers,read_products,read_locations,read_inventory
```

The analysis window is fixed at **24 months** (`ANALYSIS_WINDOW_MONTHS = 24`, `env.ts:127`), consumed by `ordersInWindow` (`geography.ts`/`pareto.ts`). The default `read_orders` scope exposes only the **last 60 days** — so as-is every analyzer silently runs against a window 12× shorter than the product promises. This drives the `read_all_orders` request.

### 2. read_all_orders — scope change

| # | Item | File | Effort |
|---|------|------|--------|
| 2.1 | Add `read_all_orders` to default scope string | `packages/config/src/env.ts:66` | S |
| 2.2 | Mirror in `shopify.app.toml` `[access_scopes]` (managed install reads TOML) | `shopify.app.toml` | S |
| 2.3 | Keep `SHOPIFY_SCOPES` env override in sync so standalone OAuth requests the identical set | `packages/config/src/env.ts` | S |

Proposed string (env + TOML; `read_all_orders` is **additive**, keep both):

```
read_orders,read_all_orders,read_customers,read_products,read_locations,read_inventory
```

**Justification (paste into the Partner Dashboard request):**

> SimpleSense is a prescriptive analytics product. Our core insight is customer-revenue concentration (Pareto — "your top 20% of customers drive ~70% of revenue") and geographic concentration, both computed over a **trailing 24-month window** (`ANALYSIS_WINDOW_MONTHS = 24`). A 24-month window is required to (a) establish a stable repeat-customer cohort — most stores' repeat cadence exceeds 60 days, so a 60-day window cannot identify high-value repeat customers at all — and (b) compare year-over-year geographic and revenue trends. Shopify's default 60-day order access exposes only ~8% of the data our analyzers require, making the product's primary output impossible to compute correctly. We do not resell order data, do not fulfill, and do not contact a merchant's customers; orders are read once during backfill, reduced to aggregate metrics, and the raw order rows are discarded. We request `read_all_orders` solely to widen the historical read window from 60 days to 24 months for analytics.

### 3. Protected customer data — fields actually read

From `reader.ts` GraphQL selections + analyzer consumption (do not over-declare):

**Customer PII** (`reader.ts customers()`, 207–228): `customer.id`, `customer.email`, `defaultAddress.{city, provinceCode, countryCodeV2, zip, latitude, longitude}`.
**Order PII** (`reader.ts orders()`, 148–205): `order.customer.id` (linkage for `pareto.ts:16`), `order.shippingAddress.{city, provinceCode, countryCodeV2, zip, latitude, longitude}` (consumed by `geography.ts`).
**NOT read** (state explicitly — strengthens minimization): no name, phone, street address, billing address, payment data. `email` is read but **unused** by any analyzer — recommend dropping it (Open questions).

### 4. Protected-data questionnaire answers (ready to paste)

**Fields & why:** customer email (account linkage only); customer + order ship-to city, province/region code, country code, ZIP, latitude/longitude. Power two outputs: revenue concentration by customer (key by Shopify customer GID — `pareto.ts`) and geographic concentration by region/ZIP + trade-area distance (`geography.ts`). No name, phone, street, billing, or payment data.

**Minimization:** only the six address subfields + email/ID needed by analyzers. Orders read once during backfill, immediately reduced to aggregate metrics, raw PII not retained beyond that reduction.

**Retention:** raw protected fields transient — consumed during backfill, discarded after metric computation; persisted artifacts are non-identifiable aggregates (e.g. `geo.single_region_share`, `pareto.top20_revenue_share`). On `shop/redact` and `customers/redact` we honor the mandatory webhooks. *(Confirm the backfill→discard guarantee — Open question 7.2.)*

**Encryption:** in transit TLS (`reader.ts gql()` → `https://…/admin/api`); at rest the Shopify access token is **AES-256-GCM** encrypted, DB is Supabase Postgres encrypted at rest; persisted aggregates non-identifiable.

**Sub-processors / third parties:** Supabase (hosting), Fly (compute), Anthropic (LLM). The grounded-LLM stage receives **aggregate metrics, not raw PII**. *(Confirm no PII reaches the prompt — Open question 7.3.)*

**Privacy policy + contact:** published at simplesense.co/privacy. *(Verify the route exists — Open question 7.4; the listing section owns creating it.)*

### 5. Dev-store vs production

| Aspect | Development store | Production store |
|---|---|---|
| Protected customer data review | **Exempt** | **Requires approval** before reading customer/order PII |
| `read_all_orders` | Works once declared | Requires Partner-dashboard request approval |
| Implication | Build/test/demo the full 24-month pipeline today | Both approvals must land before any real merchant install reads beyond 60 days / PII |

**Sequencing:** implement and end-to-end test sections 2–4 on a dev store **before** submitting; submit the two requests only once the embedded flow + compliance webhooks demonstrably work (Shopify reviews the live app).

### 6. Scope-update rollout (re-grant)

Adding `read_all_orders` is a **scope expansion** → already-installed merchants enter **pending re-grant** until they re-approve.

| # | Item | Effort |
|---|------|--------|
| 6.1 | `shopify app deploy` to push the new scope version | S |
| 6.2 | On `403`/scope-mismatch from Admin GraphQL (`reader.ts gql()` throws on `!res.ok`, line 111), redirect to the managed re-grant rather than surfacing a raw error | M |
| 6.3 | Standalone: next OAuth round-trip requests the new `SHOPIFY_SCOPES`; add a scope-diff check on read to invalidate/re-consent stored tokens that are a subset of required | M |
| 6.4 | On re-grant of `read_all_orders`, enqueue a **full 24-month backfill** (the prior 60-day-limited backfill must be re-run) | M |

`reader.ts:111` throws a generic `Error` on any non-OK response — it can't distinguish "scope missing" (403) from rate-limit (429) / 5xx. Minimal change: **throw a typed error carrying `res.status`** so the caller can branch to re-consent.

### Risks

- **read_all_orders rejection/delay** guts the hero Pareto insight on production stores. Mitigation: analyzers already emit `insufficient(...)` (`pareto.ts:23-31`) so a 60-day fallback degrades honestly — but the value prop is gutted. Submit early with the justification ready.
- **Over-declaring** (`email` unused, `reader.ts:210`) weakens the minimization answer — drop it before submitting.
- **TOML/env scope drift:** two sources of truth can diverge → embedded and standalone request different data (review-failing). Add a test asserting they match.
- **Silent under-grant:** a pre-`read_all_orders` merchant truncates to 60 days with no error without the 6.3 scope-diff check.
- **PII into the LLM prompt** would falsify the minimization/encryption answers — verify before submission.

### Open questions

1. `email` — drop or justify? (Recommend drop; confirm no VIP analyzer/UI needs it.)
2. Retention: confirm the persistence layer doesn't store raw `shippingAddress`/`email` long-term.
3. Does any raw PII reach Anthropic?
4. Privacy-policy route exists? (Owned by listing section.)
5. `shopify.app.toml` `[access_scopes]` must carry exactly the section-2 string (owned by embedded section).
6. Protected-data Level 1 vs 2 — lat/lng + ZIP in `haversineMiles` (`geography.ts`) likely pushes to Level 2.
7. `read_inventory` necessity — it backs `unitCost`/COGS (`reader.ts:233-236`) but geography/pareto don't use cost; drop if the margin analyzer is out of MVP.

---

## Listing assets, review & timeline

> Scope: the App Store submission package + schedule + reviewer test plan. Auth/session-tokens/token-exchange/GDPR-webhooks/billing/`shopify.app.toml` are covered above and referenced here only as **review gates**.

### 1. Listing-assets checklist

Configured in the Partner Dashboard, but several assets must be consistent with real repo sources (`apps/web/app/(marketing)/page.tsx`, `README.md`).

| Asset | Requirement | Source / value | Effort |
|---|---|---|---|
| App name | ≤30 chars, no "Shopify" | `Simple Sense` (`README.md:1`) | S |
| App icon | 1200×1200 PNG, no text | New asset — none in `apps/web/public/img`; Signal-Blue `#0871e7` mark on paper `#fffdf9` per `docs/BUILD_SPEC.md` §1A | M |
| Tagline | ≤62 chars | "The co-pilot that tells your store where to turn next." (`README.md:3`) | S |
| Feature/banner | 1600×900 | Reuse the `.preview-frame` "This week's moves" mock (`page.tsx:30-89`) | M |
| Screenshots | 3–6, 1600×900, **embedded in admin** | From the real embedded build: ranked MoveCard digest; geo+Pareto wedge; single MoveCard (Pattern→Why→Move→Impact, `BUILD_SPEC.md` §3b); connect/onboarding — must show App Bridge chrome | M |
| Long description | features + audience | From `README.md:5-9` + `page.tsx` | S |
| Key benefits (3) | title+body | "A ranked list of moves, not another dashboard" / "Every number earned from your own data" / "Your first moves in minutes — one-click connect" (`page.tsx:13-27`) | S |
| Pricing | match plan picker + charge mechanism | $0/$99/$299 from `tiers.ts:47-91`; must match `(marketing)/pricing/page.tsx` + chosen billing rail | S |
| **Privacy policy URL** | required, public | **Does not exist** — create `/privacy`. Submission blocker | M |
| Support email + URL | required | `support@simplesense.co` + `/support` | S |
| Demo/test instructions | reviewer free-text | §4 | S |
| Categories / tags | pick | "Store management → Analytics"; analytics, insights, customers, retention | S |

**Repo-side prerequisites (must ship before the listing goes live):** new auth-free routes `apps/web/app/(marketing)/privacy/page.tsx`, `terms/page.tsx`, `support/page.tsx` (M); confirm the demo audit (`/audit/demo`, `page.tsx:22`) renders without a Clerk session or connected store (S).

### 2. Review criteria most likely to apply (analytics app)

**App Store review (must pass):**
- **Embedded + App Bridge** — loads embedded via latest App Bridge in `<head>`; reviewers test inside admin. Standalone Clerk-cookie flow must **not** be the embedded entry.
- **Install/auth UX** — no manual steps, **no second login** inside the iframe. A Clerk login rendering embedded = instant rejection.
- **Performance / Web Vitals** — first embedded paint must not block on the grounded-LLM pipeline; render shell immediately, stream moves.
- **Billing parity** — the plan the reviewer sees/charges through must match the listing and use the approved rail (the hybrid satisfies this for embedded; Stripe-only would invite pushback).
- **No prohibited behavior** — no misleading "expected dollar impact" without grounding (point reviewers at the grounding-validation guardrail, `README.md:8-9,61-64`); no off-platform redirects mid-install; no data beyond declared scopes.
- **GDPR webhooks present & HMAC-verified** — reviewers send test payloads to the three topics.
- **Uninstall handling** — `app/uninstalled` must revoke/scrub the encrypted token.

**Built for Shopify (stretch):** session-token auth everywhere, consistent App Bridge nav, performance thresholds, minimal scopes. Treat as **v1.1**, not a launch blocker.

### 3. End-to-end timeline

| Phase | What | Duration |
|---|---|---|
| 0. Asset + legal prep | Icon, banner, screenshots (needs embedded build), privacy/terms/support | 3–5 days |
| 1. Internal embedded QA | Install on a **dev store**, verify embedded auth + webhooks | 2–4 days |
| 2. Protected-customer-data approval | Questionnaire (cite AES-256-GCM) | **3–10 business days**, iterative |
| 3. `read_all_orders` approval | Separate justification | folds into Phase 2, allow +1 week |
| 4. Submission | Listing + demo instructions | review starts |
| 5. Review rounds | first response ~5–7 business days; **expect 1–3 rounds** | 2–5 weeks |
| 6. Launch | approved + listed | — |

**Realistic total: 5–9 weeks** from "embedded build done" to listing, dominated by data approvals + review. Phases 2/3 parallelize with 0/1 on a dev store. Don't promise a fixed external launch date.

### 4. Reviewer test-account & instructions plan

Core friction: standalone auth is Clerk cookies, which can't work embedded — reviewers test embedded and must **never** see a Clerk login.

1. **Embedded path needs zero credentials** — "Add app" → Shopify-managed install + token exchange → straight into the app with a session-token identity, org/user auto-provisioned server-side. No Clerk UI in the iframe. (Auth section's job; the make-or-break review item.)
2. **Seeded dev store** — a Partner development store pre-loaded with orders/customers/products so analyzers produce real moves (dev stores are review-exempt, so reviewers can install before approvals land). Give URL + staff login.
3. **Standalone path too** — one pre-made Clerk test account + exact steps: sign in at simplesense.co → `/connections` → connect the demo store. Label which path is which.
4. **Free demo audit** — `/audit/demo` (`page.tsx:22`) as a no-auth preview.
5. **Script the happy path** — install → "This week's moves" → open a MoveCard → (Pro) one-click execution; include the expected-dollar-impact disclaimer.

### 5. Submission sequence

1. Finalize embedded build + session-token auth + GDPR webhooks → verify on a dev store.
2. Ship `/privacy`, `/terms`, `/support`; stand up `support@simplesense.co`.
3. Produce icon, banner, embedded screenshots from the working build.
4. Configure `shopify.app.toml` scopes; submit protected-customer-data + `read_all_orders` (parallelizable on dev store).
5. Fill the listing; pricing matching `tiers.ts` + the chosen billing rail.
6. Write demo/test instructions (§4) with the seeded dev store + Clerk test account.
7. Submit → triage → resubmit (1–3 rounds).
8. On approval, publish; defer Built-for-Shopify to v1.1.

### Risks

- **Privacy/terms/support pages don't exist** (`apps/web/app/(marketing)/` has only `how-it-works` and `pricing`) — hard submission blocker.
- **Clerk login leaking into the embedded iframe** — single most likely rejection cause; if embedded auth slips, the listing can't pass regardless of asset quality.
- **Billing rail** — if reviewers reject Stripe, pricing + plan picker rework to Billing API adds a round (mitigated by the hybrid defaulting embedded → Shopify Billing).
- **Data-approval latency** is outside our control — submit early on a dev store.
- **Screenshots need the real embedded build** — serializes the schedule.
- **"Expected dollar impact"** could read as misleading — cite the grounding-validation guardrail in listing + reviewer notes.

### Open questions

- Final billing rail drives pricing copy (resolved to hybrid above; confirm cancel/manage UX).
- List as embedded-only or advertise both install paths? (Affects screenshots + demo instructions.)
- Default install tier — Free Audit $0 or Basic $99? (`tiers.ts:47-91`)
- Named emergency developer contact + monitored support inbox owner?
- Built for Shopify at launch or v1.1? (Recommend defer.)
- Is the seeded dev store already provisioned with representative data?

---

## Phased roadmap

Sequenced so each phase unblocks the next. **The identity bridge + session-token auth are the critical path** — embedded UI, billing, and webhooks all depend on a non-Clerk tenant resolving through `getSession()`.

### Phase 0 — Foundations & config (no behavior change yet)
*Unblocks everything; safe to land first.*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| `shopify.app.toml` (scopes, app URL, redirect URLs incl. existing callback, compliance webhooks) | repo root | S | — |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` build var + Dockerfile `ARG`/`ENV` | `Dockerfile` | S | — |
| Extend `assertServerEnv` to require Shopify trio when embedded enabled | `packages/config`, `instrumentation.ts` | S | — |
| Add `read_all_orders` to scope string + TOML; scope-match test | `packages/config/src/env.ts`, `shopify.app.toml` | S | toml |
| Typed status error from `reader.ts` (carry `res.status`) | `packages/integrations/.../reader.ts` | S | — |

### Phase 1 — Identity bridge + session-token auth (critical path)
*The convergence layer. Nothing embedded works until this lands.*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| Schema: `OrgSource`, `clerkOrgId`, `ShopInstall`, `InstallStatus`, `Subscription.provider`+`shopifySubscriptionGid`, `ComplianceEvent` (one migration) | `packages/db/prisma/schema.prisma` + migration | M | — |
| Migration: backfill `clerkOrgId`, keep legacy PKs | `packages/db/prisma/migrations` | M | schema |
| `getSession()` writes `clerkOrgId`/`source`, stops keying PK on Clerk id | `apps/web/lib/auth.ts` | M | schema |
| `session-token.ts` (verify JWT, Edge-safe `jose`) | new `apps/web/lib/shopify/session-token.ts` | M | Phase 0 env |
| `resolveOrgForShop()` provisioner | new `apps/web/lib/shop-org.ts` | M | schema |
| `getSession()` Shopify branch (reads `x-ss-shop-domain`) | `apps/web/lib/auth.ts` | M | session-token, shop-org |
| Middleware: strip `x-ss-*`, verify token, forward headers, per-shop CSP, `isPublic` additions | `apps/web/middleware.ts` | L | session-token |
| DEMO-attach guard + install adoption | `app/api/stores/connect/callback/route.ts` | S | shop-org |

### Phase 2 — Embedded install + App Bridge UI
*Depends on Phase 1 (token verify + shop-keyed org).*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| App Bridge `<head>` script + meta | `apps/web/app/layout.tsx` | M | Phase 0 build var |
| Token-exchange install endpoint (offline token) | new `apps/web/app/api/shopify/install/route.ts` | L | session-token, shop-org |
| `exchangeSessionToken` on `ShopifyClient` + Mock | `packages/integrations/src/shopify/client.ts` | M | — |
| `EmbeddedShell` (Clerk-free) + factor shared body out of `AppShell` | `apps/web/components/EmbeddedShell.tsx`, `AppShell.tsx` | M | App Bridge head |
| `/app-embedded` entry + nav (`ui-nav-menu`) | `apps/web/app/app-embedded/` | M | EmbeddedShell |
| `next.config.ts` standalone framing fallback | `apps/web/next.config.ts` | S | middleware CSP |
| `claimShop()` merge/claim flow | new `apps/web/lib/claim-shop.ts` | L | shop-org, install endpoint |

### Phase 3 — Compliance webhooks (review gate)
*Independent of Phase 2 internals; depends on Phase 1 schema (`ComplianceEvent`) + store-by-domain resolution. Can run parallel to Phase 2.*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| `privacy.ts` handlers (3 topics) | new `packages/integrations/src/shopify/privacy.ts` | M | schema |
| Topic switch in webhook route | `apps/web/app/api/webhooks/shopify/route.ts` | M | privacy.ts |
| `purgeStoreByDomain` + shared deletion helper | `packages/db/src/disconnect.ts` | S | — |
| `customers/redact` (Customer + Order ship-PII) | privacy.ts | M | — |
| `customers/data_request` assemble + deliver | privacy.ts + transactional email | L | email infra |
| `registerComplianceWebhooks` (standalone GraphQL) | `packages/integrations/src/shopify/webhooks.ts` | M | — |
| Transactional email infra (shared w/ data_request + listing) | new | M | — |

### Phase 4 — Billing (Shopify Billing leg of the hybrid)
*Depends on Phase 1 (embedded `getSession()` → org) + Phase 3 (shared HMAC crypto util).*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| `shopifyBilling.ts` client + Mock | new `packages/integrations/src/shopifyBilling.ts` | M | shared HMAC util |
| `shopifyBillingConfig()` + `shopifyPlanName` in `tiers.ts` | `packages/config/src/env.ts`, `tiers.ts` | S | — |
| Create route (App Bridge top-frame redirect) | new `apps/web/app/api/billing/shopify/route.ts` | M | embedded auth, client |
| Billing webhook | new `apps/web/app/api/webhooks/shopify/billing/route.ts` | M | client |
| Plans UI surface-branch | `apps/web/app/plans/page.tsx` | S | create route |
| Double-billing guard (refuse cross-processor active row) | create route / webhook | S | — |

### Phase 5 — Listing, legal pages & data approvals
*Legal pages can start anytime; screenshots + approvals need Phases 1–3 working on a dev store.*

| Item | File(s) | Effort | Depends on |
|---|---|---|---|
| `/privacy`, `/terms`, `/support` routes (auth-free) | `apps/web/app/(marketing)/…` | M | — |
| Confirm `/audit/demo` renders Clerk-less | `apps/web/app/...` | S | — |
| Icon, banner, embedded screenshots | assets | M | Phase 2 working |
| Submit protected-customer-data + `read_all_orders` requests | Partner Dashboard | S | Phases 1–3 on dev store |
| Scope re-grant flow + full-backfill trigger | `reader.ts` caller, backfill job | M | typed status error |
| Listing copy + pricing + demo instructions | Partner Dashboard | S | billing rail decided |

**Critical path:** Phase 0 → Phase 1 → Phase 2 → (assets/screenshots) → Phase 5 submission. Phases 3 and 4 run parallel to Phase 2 once Phase 1's schema lands. Data approvals (Phase 5) should be **submitted as early as Phase 1–3 are demonstrable on a dev store**, since their 3–10-day (and review's 2–5-week) latency dominates the calendar.

---

## Consolidated risks & open questions

### Cross-cutting risks (ranked by launch impact)

1. **Clerk login leaking into the embedded iframe** — the single most likely rejection cause. The embedded shell must be 100% Clerk-free; middleware must never `auth.protect()` an embedded request. (auth + embedded + listing)
2. **Tenant isolation via spoofed headers** — middleware must unconditionally strip inbound `x-ss-*` before any logic and never read them in matcher-excluded routes. A miss forges tenants. (auth)
3. **DEMO collapse** — an embedded install attaching to the shared DEMO org, or a present-but-invalid token silently downgrading to DEMO. Enforced by (a) middleware 401 on invalid tokens, (b) the `resolveOrgForShop` provisioner never returning DEMO, (c) the standalone DEMO-attach guard. (auth + identity)
4. **`Organization.id` migration** — riskiest schema change; mitigate by keeping legacy string PKs and moving lookups to `clerkOrgId` (never rewrite PKs that `Store`/`Subscription`/`User` FK to). (identity)
5. **read_all_orders rejection/delay** — guts the hero insight on production stores; analyzers degrade honestly via `insufficient(...)` but the value prop suffers. Submit early. (data-approvals)
6. **Double-org / double-billing** — same merchant installing both ways → split data or processor-conflicting `Subscription` rows. Mitigated by the claim/merge flow + the cross-processor active-row guard. (identity + billing)
7. **CSP `frame-ancestors` wrong** → blank admin iframe (silent). Set per-shop in middleware from the verified domain; omit `X-Frame-Options` on embedded routes. (auth + embedded)
8. **Edge runtime / fail-fast gap** — `SHOPIFY_API_SECRET` must be on the Edge and in `assertServerEnv`, or embedded auth silently 401s. (auth)
9. **HMAC scheme divergence** (Shopify base64 vs Stripe `t=,v1=`) — unit-test both against fixtures or webhooks silently fail. (billing + webhooks)
10. **Offline vs online token** — offline is required (webhooks + Inngest backfill run outside a session); online breaks durable jobs. (embedded)
11. **Scope/TOML drift & silent under-grant** — assert TOML ↔ `SHOPIFY_SCOPES` equality in a test; add the scope-diff re-grant check. (data-approvals)
12. **`shop/redact` deletes `Store`** — reinstall must re-create it cleanly; nothing may assume a `Store` always exists for a known `shopDomain`. (webhooks + auth)

### Consolidated open questions (with owners)

- **Headless SHOPIFY org** — may a Shopify-source org run fully headless with no Clerk user, or is a Clerk account a hard gate to view results? *(identity ↔ billing — decide first; it shapes the claim flow and billing surface.)*
- **PII to the LLM** — verify the grounded-LLM prompt is built only from aggregate `Metric` outputs, never raw `Order`/`Customer` rows. *(data-approvals — blocks the questionnaire.)*
- **Drop `email`** from the customer query (unused by analyzers) to tighten minimization. *(data-approvals.)*
- **Retention guarantee** — confirm the persistence layer doesn't store raw `shippingAddress`/`email` long-term. *(data-approvals.)*
- **Transactional email sender** — confirm/stand up the shared infra used by `customers/data_request` delivery, magic-link, and `/support`. *(webhooks + listing.)*
- **Managed vs programmatic Shopify pricing**, trial parity, and Shopify→Stripe switch path. *(billing.)*
- **Reinstall-after-uninstall** — reuse the original org/data or start fresh? Must match the GDPR-redact policy. *(identity ↔ webhooks.)*
- **First-load bounce vs 401** on `?id_token` verify failure — wire the App Bridge auth-bounce route target. *(auth ↔ embedded.)*
- **Protected-data Level 1 vs 2** (lat/lng + ZIP likely Level 2), and **`read_inventory` necessity** (drop if margin analyzer is out of MVP). *(data-approvals.)*
- **Embedded-only vs both install paths on the listing**, default install tier, support-inbox owner, Built-for-Shopify at launch vs v1.1. *(listing.)*

---

## Shopify submission checklist

### Pre-submission (must all be true)

- [ ] App loads **embedded** via App Bridge (`app-bridge.js` first in `<head>`, `shopify-api-key` meta) — no Clerk UI in the iframe.
- [ ] Shopify-managed install + **token exchange** drops the reviewer straight into the app with a session-token identity; org/user auto-provisioned server-side.
- [ ] Standalone authorization-code flow still works first-party (`/connections`), redirect URL `https://simplesense.co/api/stores/connect/callback` declared in `shopify.app.toml`.
- [ ] Three GDPR webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) HMAC-verified and handled; `app/uninstalled` scrubs the encrypted token.
- [ ] Billing: embedded merchants charged via **Shopify Billing API**; pricing ($0/$99/$299) matches the listing and `tiers.ts`.
- [ ] `/privacy`, `/terms`, `/support` live and auth-free; `support@simplesense.co` monitored.
- [ ] `shopify.app.toml` `[access_scopes]` == `SHOPIFY_SCOPES` (test-asserted), `read_all_orders` included.
- [ ] Seeded **development store** with representative orders/customers/products; reviewer instructions written (embedded + standalone paths labeled, Clerk test account provided).
- [ ] Listing assets: 1200×1200 icon, 1600×900 banner, 3–6 embedded screenshots, copy from `README.md`/`page.tsx`.

### Data-approval request copy

**`read_all_orders` (Partner Dashboard):**
> SimpleSense is a prescriptive analytics product whose core output is customer-revenue concentration (Pareto) and geographic concentration computed over a trailing **24-month** window. A 24-month window is required to establish a stable repeat-customer cohort (most stores' repeat cadence exceeds 60 days) and to compare year-over-year trends. Shopify's default 60-day order access exposes only ~8% of the data our analyzers require. We do not resell order data, do not fulfill, and do not contact merchants' customers; orders are read once during backfill, reduced to aggregate metrics, and raw rows discarded. We request `read_all_orders` solely to widen the historical read window from 60 days to 24 months.

**Protected customer data (questionnaire):** use the section-4 answers — fields (email for linkage; ship-to city/region/country/ZIP/lat-lng), minimization (only analyzer-needed fields, reduced to aggregates), retention (raw PII transient, discarded post-reduction), encryption (AES-256-GCM token at rest, TLS in transit, Supabase encrypted at rest), sub-processors (Supabase/Fly/Anthropic; aggregate metrics only to the LLM), and the published privacy policy.

### Realistic timeline

| Milestone | Calendar |
|---|---|
| Embedded build done + dev-store QA (Phases 0–3) | week 0 |
| Submit data-approval requests (on dev store) | as early as week 0–1 |
| Protected-data + `read_all_orders` approvals | +3–10 business days, iterative (+1 wk for orders) |
| Asset production (needs working embedded build) | 3–5 days, overlapping |
| App Store submission | ~week 2 |
| Review rounds (1–3) | 2–5 weeks |
| **Public listing** | **week 5–9** |

Submit data requests the moment the embedded flow + webhooks are demonstrable on a dev store — their latency, plus 1–3 review rounds, dominates the calendar. Do not promise a fixed external launch date.