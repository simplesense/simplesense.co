# PLAN: Billing go-live hardening — portal, period-end grace, checkout confirmation, customer id capture

**Rank rationale:** SimpleSense is live and code-complete on Stripe test mode; the only human blocker is pasting live keys. The moment that happens, today's code has three revenue-critical holes: (1) the Stripe customer id is never captured, so there is no way to ever open a billing portal for a paying merchant (no self-serve cancel/card-update → chargebacks and support load); (2) `current_period_end` is never persisted and `currentTier()` demotes only on `CANCELED`, so a single missed cancellation webhook grants free paid access forever; (3) after paying, the merchant lands back on `/plans` with zero confirmation. These are all small, fully-testable changes on already-tested money paths — maximum leverage per line of code, and they must land before live keys do.

## Goal

When live Stripe keys are pasted: every checkout/subscription webhook persists the Stripe customer id and current period end; paid access is bounded by `currentPeriodEnd + 7 days` grace even if a cancellation webhook is missed; merchants with a captured customer id get a \"Manage billing / cancel\" button on `/plans` that opens the Stripe customer portal; and `/plans` shows honest success/canceled banners after checkout redirects. All existing fail-closed webhook behavior and the 145-test suite stay green.

## Files to touch

- `packages/integrations/src/stripe.ts` — extend `StripeEvent` with `customerId` + `currentPeriodEnd`; parse them in `RealStripeClient.parseWebhook`; add `createPortalSession` to the `StripeClient` interface, `RealStripeClient`, and `MockStripeClient`; add pure `subscriptionLapsed()` helper + `BILLING_GRACE_DAYS`.
- `packages/integrations/src/index.ts` — add `subscriptionLapsed` and `BILLING_GRACE_DAYS` to the explicit `./stripe` export block (lines 20–28; it is NOT `export *`).
- `packages/integrations/test/stripe.test.ts` — new cases: customer-id capture, period-end capture (top-level + `items.data[0]` fallback), expanded-object customer ignored, mock portal method, mock passthrough, `subscriptionLapsed` boundaries; existing fail-closed tests untouched.
- `apps/web/app/api/webhooks/stripe/route.ts` — persist `stripeCustomerId` + `currentPeriodEnd` in the upsert (both branches, conditional spread on update).
- `apps/web/lib/billing.ts` — `currentTier()` selects `currentPeriodEnd` and returns `'free'` when `subscriptionLapsed(...)`.
- `apps/web/app/api/billing/portal/route.ts` — NEW: POST route creating a Stripe billing-portal session and 303-redirecting to it.
- `apps/web/app/api/billing/checkout/route.ts` — change `cancelUrl` to `${origin}/plans?canceled=1`.
- `apps/web/app/plans/page.tsx` — accept async `searchParams`; render `?upgraded=1` success banner and `?canceled=1` banner; render \"Manage billing / cancel\" form when the org's subscription has a `stripeCustomerId`.
- `packages/db/prisma/schema.prisma` — NO EDIT (see correction below); only run an idempotent `prisma db push` to verify the DB matches.

**SEED CORRECTION (trust exploration):** the seed says \"add `Subscription.currentPeriodEnd DateTime?`\". Both `stripeCustomerId String?` (schema.prisma:285) and `currentPeriodEnd DateTime?` (schema.prisma:288) ALREADY EXIST in the schema. Do not edit the schema or write a migration — step 12 only verifies the live DB has no drift.

## Implementation order

1. **`packages/integrations/src/stripe.ts` — extend the event shape and interface.**
   Replace the `StripeEvent` interface (currently lines 12–17) with:
   ```ts
   export interface StripeEvent {
     type: string
     orgId: string | null
     tier: 'BASIC' | 'PRO' | null
     status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null
     /** Stripe customer id (cus_...) when the event carries one as a plain string. */
     customerId: string | null
     /** End of the paid period, when the event carries current_period_end (unix seconds). */
     currentPeriodEnd: Date | null
   }
   ```
   Extend the `StripeClient` interface (currently lines 19–23) with one method:
   ```ts
   createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string>
   ```

2. **`RealStripeClient.parseWebhook` — capture the two new fields.**
   Widen the JSON cast (currently lines 96–99) to:
   ```ts
   const evt = JSON.parse(rawBody) as {
     type: string
     data?: {
       object?: {
         metadata?: { orgId?: string; tier?: string }
         status?: string
         customer?: unknown
         current_period_end?: unknown
         items?: { data?: Array<{ current_period_end?: unknown }> }
       }
     }
   }
   ```
   After `const obj = evt.data?.object`, add:
   ```ts
   // customer may arrive expanded as an object; we only trust a plain string id.
   const customerId = typeof obj?.customer === 'string' && obj.customer !== '' ? obj.customer : null
   // Stripe API >= 2025-03-31 (Basil) moved current_period_end from the Subscription top
   // level onto items.data[]. Accept either location; validate it's a positive finite number.
   const rawPeriodEnd = obj?.current_period_end ?? obj?.items?.data?.[0]?.current_period_end
   const currentPeriodEnd =
     typeof rawPeriodEnd === 'number' && Number.isFinite(rawPeriodEnd) && rawPeriodEnd > 0
       ? new Date(rawPeriodEnd * 1000)
       : null
   ```
   Add `customerId,` and `currentPeriodEnd,` to the returned object literal (after `tier`). Do NOT touch the `statusMap` (lines 105–114) or the status fallback expression (lines 121–125) — the fail-closed mapping is covered by existing tests and must not regress.

3. **`RealStripeClient.createPortalSession` — new method** (below `createCheckoutSession`, same fetch pattern as lines 60–89):
   ```ts
   /** Create a Stripe customer-portal session; returns the URL to redirect the merchant to. */
   async createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string> {
     const body = new URLSearchParams({ customer: p.customerId, return_url: p.returnUrl })
     const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${this.cfg.secretKey}`,
         'content-type': 'application/x-www-form-urlencoded',
       },
       body,
     })
     if (!res.ok) throw new Error(`Stripe portal failed: ${res.status}`)
     const data = (await res.json()) as { url?: string }
     if (!data.url) throw new Error('Stripe returned no portal url')
     return data.url
   }
   ```

4. **`MockStripeClient` — keep the interface satisfied** (typecheck breaks otherwise). Extend its `parseWebhook` input cast (currently lines 135–140) with `customerId?: string` and `currentPeriodEnd?: number` (unix seconds, matching the real shape), and return:
   ```ts
   customerId: evt.customerId ?? null,
   currentPeriodEnd:
     typeof evt.currentPeriodEnd === 'number' ? new Date(evt.currentPeriodEnd * 1000) : null,
   ```
   Add:
   ```ts
   createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string> {
     return Promise.resolve(`${p.returnUrl}?mock_portal=1`)
   }
   ```

5. **`subscriptionLapsed` pure helper — same file** (so the money logic lives next to the other tested money code):
   ```ts
   /** Grace window after a paid period ends before access is revoked (missed-webhook safety). */
   export const BILLING_GRACE_DAYS = 7

   /**
    * True when the paid period ended more than the grace window ago. A null periodEnd never
    * lapses: legacy rows and mock/dev flows have no period end and must keep current behavior.
    */
   export function subscriptionLapsed(
     currentPeriodEnd: Date | null,
     nowMs = Date.now(),
     graceDays = BILLING_GRACE_DAYS,
   ): boolean {
     if (!currentPeriodEnd) return false
     return currentPeriodEnd.getTime() + graceDays * 86_400_000 < nowMs
   }
   ```
   Then in `packages/integrations/src/index.ts`, add `subscriptionLapsed,` and `BILLING_GRACE_DAYS,` to the existing explicit export block from `'./stripe'` (lines 20–28).

6. **`apps/web/app/api/webhooks/stripe/route.ts` — persist the new fields.** Replace the upsert body (lines 20–31) with:
   ```ts
   await prisma.subscription.upsert({
     where: { orgId: evt.orgId },
     update: {
       ...(evt.tier ? { tier: evt.tier } : {}),
       ...(evt.status ? { status: evt.status } : {}),
       ...(evt.customerId ? { stripeCustomerId: evt.customerId } : {}),
       ...(evt.currentPeriodEnd ? { currentPeriodEnd: evt.currentPeriodEnd } : {}),
     },
     create: {
       orgId: evt.orgId,
       tier: evt.tier ?? 'BASIC',
       status: evt.status ?? 'ACTIVE',
       stripeCustomerId: evt.customerId,
       currentPeriodEnd: evt.currentPeriodEnd,
     },
   })
   ```
   Conditional spread on `update` is mandatory: `checkout.session.completed` has no `current_period_end`, and a later event without `customer` must not null-out a previously captured id. Leave the enclosing guard at line 19 (`if (evt.orgId && (evt.tier || evt.status))`) EXACTLY as-is — do not widen it to `|| evt.customerId`: every orgId-carrying event already resolves a status (`checkout.session.completed` → `ACTIVE` fallback; `customer.subscription.*` → statusMap or `CANCELED` fallback), so nothing real is dropped, and widening it would let a hypothetical status-less event CREATE a row with the `status: 'ACTIVE'` default — granting paid access. Do NOT touch lines 8–17 (503/503/401 fail-closed responses).

7. **`apps/web/lib/billing.ts` — grace-bound `currentTier`.** Add `import { subscriptionLapsed } from '@ss/integrations'` and change `currentTier` (lines 5–12) to:
   ```ts
   export async function currentTier(orgId: string): Promise<TierId> {
     const sub = await prisma.subscription.findUnique({
       where: { orgId },
       select: { tier: true, status: true, currentPeriodEnd: true },
     })
     if (!sub || sub.status === 'CANCELED') return 'free'
     // Missed-webhook safety: a paid period that ended > grace window ago no longer grants
     // paid access, regardless of a stale ACTIVE/PAST_DUE status row.
     if (subscriptionLapsed(sub.currentPeriodEnd)) return 'free'
     return sub.tier === 'PRO' ? 'pro' : 'basic'
   }
   ```
   `entitlementsForOrg` (lines 15–17) needs no change — it calls `currentTier`.

8. **NEW `apps/web/app/api/billing/portal/route.ts`** — mirror the checkout route's structure exactly (rate limit, 503-when-unconfigured, `getSession`, 303 redirect):
   ```ts
   import { NextResponse } from 'next/server'
   import { stripeConfig } from '@ss/config'
   import { createStripeClient } from '@ss/integrations'
   import { prisma } from '@ss/db'
   import { getSession } from '@/lib/auth'
   import { rateLimit } from '@/lib/security'

   /** Open the Stripe customer portal (manage payment method / cancel). POST, no body. */
   export async function POST(req: Request): Promise<Response> {
     const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
     if (!rateLimit(`portal:${ip}`, 10, 60_000).allowed) {
       return NextResponse.json({ error: 'rate limited' }, { status: 429 })
     }
     const cfg = stripeConfig()
     if (!cfg.hasCredentials) {
       return NextResponse.json({ error: 'Billing not configured.' }, { status: 503 })
     }
     const { orgId } = await getSession()
     const origin = new URL(req.url).origin
     const sub = await prisma.subscription.findUnique({
       where: { orgId },
       select: { stripeCustomerId: true },
     })
     // No captured customer id (never checked out, or pre-capture subscriber): nothing to
     // manage — send them back to /plans instead of erroring.
     if (!sub?.stripeCustomerId) return NextResponse.redirect(`${origin}/plans`, { status: 303 })
     const url = await createStripeClient().createPortalSession({
       customerId: sub.stripeCustomerId,
       returnUrl: `${origin}/plans`,
     })
     return NextResponse.redirect(url, { status: 303 })
   }
   ```
   Note: like `/api/billing/checkout`, this route is NOT in the middleware's public matcher (`apps/web/middleware.ts`) — with Clerk configured, unauthenticated requests are blocked by `auth.protect()` before this handler runs. That is correct and intentional; do not add it to the public list.

9. **`apps/web/app/api/billing/checkout/route.ts` — canceled path.** Change line 36 only: `cancelUrl: \`${origin}/plans?canceled=1\`,` (successUrl at line 35 already carries `?upgraded=1` — leave it).

10. **`apps/web/app/plans/page.tsx` — banners + Manage billing.**
    a. Change the signature (line 28) to Next 15's async searchParams (same pattern as `apps/web/app/connections/page.tsx:13-18`):
    ```tsx
    export default async function PlansPage({
      searchParams,
    }: {
      searchParams: Promise<{ upgraded?: string; canceled?: string }>
    }) {
      const sp = await searchParams
    ```
    b. Add `import { prisma } from '@ss/db'` and, after `const cfg = stripeConfig()` (line 31):
    ```tsx
    const sub = await prisma.subscription.findUnique({
      where: { orgId },
      select: { stripeCustomerId: true },
    })
    ```
    c. Directly above the existing no-credentials warning block (line 52), render the banners. Reuse the warning box's inline-style shape (lines 53–63). For success, do NOT invent a new token — use the verified `var(--ss-success)` (already used at line 140) for the icon/text on a `var(--surface-card)` background with `1px solid var(--border-hairline)`:
    ```tsx
    {sp.upgraded === '1' ? (
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, margin: '12px 0', maxWidth: 760, color: 'var(--text-body)' }}>
        <i className="bi bi-check2-circle" style={{ color: 'var(--ss-success)', marginRight: 8 }} />
        Payment received — thank you. Your plan activates as soon as Stripe confirms it
        (usually seconds). Refresh if your Current badge hasn’t moved yet.
      </div>
    ) : null}
    {sp.canceled === '1' ? (
      <div style={{ background: 'var(--ss-warning-bg)', color: 'var(--ss-warning)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, margin: '12px 0', maxWidth: 760 }}>
        <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
        Checkout canceled — no charge was made. Pick a plan whenever you’re ready.
      </div>
    ) : null}
    ```
    The success wording is deliberately non-committal: the webhook may not have landed before the redirect, so the page must not claim the tier is active (grounding invariant — don't show state we haven't computed).
    d. Below the plan grid's closing `</div>` (line 169), add the portal entry point, shown only when there is something to manage:
    ```tsx
    {cfg.hasCredentials && sub?.stripeCustomerId ? (
      <form action="/api/billing/portal" method="post" style={{ marginTop: 16 }}>
        <button type="submit" style={{ height: 38, padding: '0 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', color: 'var(--text-body)', fontWeight: 600, cursor: 'pointer' }}>
          Manage billing / cancel
        </button>
      </form>
    ) : null}
    ```

11. **`packages/integrations/test/stripe.test.ts` — new cases** (reuse the existing `sign`/`SECRET` helpers, lines 5–7):
    - `RealStripeClient.parseWebhook` captures customer id + period end from a signed `customer.subscription.updated` body with `data.object.customer: 'cus_123'` and `current_period_end: 1700003600` → expect `evt.customerId === 'cus_123'` and `evt.currentPeriodEnd?.getTime() === 1700003600 * 1000`. (Sign with a now-based timestamp like the existing test at lines 76–83 — the 5-minute tolerance rejects stale `t=` values.)
    - `checkout.session.completed` with `customer: 'cus_123'` and NO `current_period_end` → `customerId` captured, `currentPeriodEnd === null`, `status === 'ACTIVE'` (existing default preserved).
    - Basil fallback: body with no top-level `current_period_end` but `items: { data: [{ current_period_end: 1700003600 }] }` → Date captured.
    - Expanded customer object (`customer: { id: 'cus_123' }`) → `customerId === null` (we only trust strings).
    - Garbage period end (`current_period_end: 'soon'` and `-1`) → `currentPeriodEnd === null`.
    - `MockStripeClient.parseWebhook` passes through `customerId`/`currentPeriodEnd` (unix seconds → Date) and returns nulls when absent.
    - `MockStripeClient.createPortalSession` resolves to a url containing `mock_portal=1`.
    - `subscriptionLapsed`: `null → false`; period end 6 days ago → `false`; 8 days ago → `true`; exact boundary (`periodEnd + 7d === now`) → `false` (strict `<`).
    - Confirm the three existing `RealStripeClient.parseWebhook` fail-closed tests (lines 60–90) still pass UNMODIFIED.

12. **Verify DB has no drift (idempotent — schema already contains both columns).** `packages/db/.env` does not exist, so the Prisma CLI (cwd = packages/db) finds no env file; source the URLs from the repo-root `.env`, which holds `DATABASE_URL`/`DIRECT_URL` and is the documented CLI env file (LEARNINGS.md: root `.env` is for CLI tooling like Prisma migrate/seed; Next itself loads `apps/web/.env.local`, which also has both):
    ```sh
    set -a; source .env; set +a
    pnpm --filter @ss/db push   # runs the existing "push": "prisma db push" script
    ```
    Expected output: database already in sync (or it applies only the two nullable columns if a past push was skipped — both are additive and safe). If the connection fails on an IPv4-only network, use the Supabase pooler host, not `db.<ref>.supabase.co` (IPv6-only).

13. **Gate:** `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`. All must pass.

14. **Commit** (do not push unless asked):
    `feat: billing go-live hardening — capture stripe customer id + period end, 7d grace bound in currentTier, customer portal, checkout result banners`

## Edge cases & landmines

- **Schema fields already exist — do not migrate.** `stripeCustomerId` (packages/db/prisma/schema.prisma:285) and `currentPeriodEnd` (:288) are already in the schema; the seed's \"add column\" instruction is stale. Editing the schema or generating a migration here would be wrong (ADR-006: Supabase schema via `db push` + baseline migration, not `migrate dev` — and there is no schema delta to migrate). Step 12 is verification only.
- **`update` must use conditional spread for the new fields.** `checkout.session.completed` carries `customer` but no `current_period_end`; later `customer.subscription.*` events might omit `customer` in odd shapes. Writing `stripeCustomerId: evt.customerId` unconditionally on `update` would null-out a previously captured id and permanently kill the portal button. (Current upsert at apps/web/app/api/webhooks/stripe/route.ts:20-31 already uses this pattern for tier/status — extend it, don't replace it.) And keep the guard at line 19 unwidened — see step 6.
- **Stripe Basil API moved `current_period_end`.** On API versions ≥ 2025-03-31, the field lives at `items.data[0].current_period_end`, not the subscription top level. `RealStripeClient` uses raw fetch with NO pinned API version (stripe.ts:77-84), so the account default decides which shape arrives. Parse both locations (step 2) or period-end capture silently never happens on newer accounts.
- **`customer` can arrive as an expanded object.** Only persist it when `typeof === 'string'`; writing `[object Object]` into `stripeCustomerId` would make every portal call 400.
- **`subscriptionLapsed(null) === false` is load-bearing.** Every existing Subscription row and every Mock/dev flow has `currentPeriodEnd = null`. If null lapsed, all current paid orgs and local dev would instantly demote to free. Grace only binds once a real period end has been captured.
- **Do not touch the fail-closed paths.** Webhook route lines 8–17 (503 no-creds / 503 no-webhook-secret / 401 bad signature) and `parseWebhook`'s `statusMap` + unknown-status→`CANCELED` fallback (stripe.ts:105-125) are audited security behavior with tests (stripe.test.ts:60-90). Extend around them; never modify them.
- **`MockStripeClient` implements `StripeClient`** (stripe.ts:130). Adding `createPortalSession` to the interface without adding it to the mock breaks `pnpm typecheck` — do step 4 in the same edit as step 1.
- **`packages/integrations/src/index.ts` uses explicit named exports, not `export *`** (verified: lines 20–28). Forgetting to export `subscriptionLapsed` makes the `apps/web/lib/billing.ts` import fail at build.
- **Next 15 `searchParams` is a Promise** — the page must `await searchParams`; typing it as a plain object fails the `@ss/web` build's type validation. (`apps/web/app/connections/page.tsx:13-18` is the in-repo reference for the pattern.)
- **Success banner must not lie (grounding invariant).** The Stripe redirect can beat the webhook, so `?upgraded=1` does NOT mean the Subscription row exists yet — the `Current` badge (page.tsx:100-104) can lag. Word the banner as \"payment received / activates shortly\", never \"You're now on Basic\".
- **Demo/unauthenticated fallback org** (SECURITY.md known gap #1): `getSession()` can resolve to the shared demo org, which will never have a `stripeCustomerId` → the portal route's redirect-to-/plans branch handles it; the button never renders for it. No extra demo-gating needed.
- **Portal API param shape:** POST `https://api.stripe.com/v1/billing_portal/sessions`, form-encoded `customer` + `return_url`, Bearer secret key — same auth/content-type as the existing checkout call. Response JSON's `url` is the redirect target. No `configuration` param in code (Stripe uses the account's default portal configuration) — BUT the default configuration must be saved once per mode in the Stripe Dashboard (Settings → Billing → Customer portal), or the API errors with \"default configuration has not been created\". That is a one-time dashboard click for the human, same bucket as pasting live keys — note it in the commit/PR body.
- **Clerk middleware gates `/api/billing/*`** (apps/web/middleware.ts: the public matcher covers `/api/webhooks(.*)` but not `/api/billing`), and `apps/web/.env.local` HAS Clerk dev keys — so unauthenticated curls to the portal/checkout routes are blocked by `auth.protect()` before the handler. The browser form POST from `/plans` is session-authed and passes. Do not \"fix\" a 4xx from an unauthenticated curl by making the route public.
- **Env sourcing for db push:** `packages/db/.env` does not exist; `DATABASE_URL`/`DIRECT_URL` live in the repo-root `.env` (the documented Prisma-CLI env file per LEARNINGS.md) and in `apps/web/.env.local` (what Next actually loads). Running `prisma db push` from `packages/db` without sourcing one of them fails with a missing-URL error, not a helpful message.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass; all 145 pre-existing tests still green, plus the new ones below.
- [ ] NEW tests in `packages/integrations/test/stripe.test.ts` pass: customer-id capture (subscription event + checkout event), period-end capture (top-level unix seconds → Date), Basil `items.data[0].current_period_end` fallback, expanded-object customer → null, non-numeric/negative period end → null, Mock passthrough of both fields, `MockStripeClient.createPortalSession` → contains `mock_portal=1`, and `subscriptionLapsed` (null→false, <7d→false, >7d→true, boundary→false).
- [ ] The three pre-existing `RealStripeClient.parseWebhook` fail-closed tests (no-secret→null, bad-signature→null, revocation statusMap) pass without any modification to their assertions.
- [ ] `grep -rn \"stripeCustomerId\" apps/web packages --include='*.ts' --include='*.tsx'` now shows writes in `apps/web/app/api/webhooks/stripe/route.ts` and reads in `apps/web/app/plans/page.tsx` + `apps/web/app/api/billing/portal/route.ts` (before this plan, that grep returns ZERO hits — the field exists only in `schema.prisma`, which the `--include` filters exclude).
- [ ] Portal route not-configured behavior: with ALL Clerk env vars unset (dev shim → `getSession()` demo fallback) and `STRIPE_SECRET_KEY` unset, `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/billing/portal` returns `503` (mirrors the checkout route's not-configured branch). Under the default dev env (Clerk dev keys ARE set in `apps/web/.env.local`), the same unauthenticated curl is blocked by the Clerk middleware before the handler — it must return the SAME status code as the identical curl against `/api/billing/checkout` (parity check), not 503.
- [ ] `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/webhooks/stripe -d '{}'` still returns `503` without Stripe env config (fail-closed unchanged; `/api/webhooks(.*)` is public in the middleware, so this works under the default dev env).
- [ ] Screen check (`pnpm --filter @ss/web dev`, signed in via Clerk dev — `/plans` is auth-gated by the middleware): `/plans?upgraded=1` shows the \"Payment received\" banner; `/plans?canceled=1` shows the canceled banner; plain `/plans` shows neither; the \"Manage billing / cancel\" button does NOT render (no `stripeCustomerId` in dev).
- [ ] `apps/web/app/api/billing/checkout/route.ts` sends `cancel_url = ${origin}/plans?canceled=1` and (unchanged) `success_url = ${origin}/plans?upgraded=1`.
- [ ] `currentTier` in `apps/web/lib/billing.ts` selects `currentPeriodEnd` and returns `'free'` via `subscriptionLapsed` for any non-CANCELED row whose period ended more than 7 days ago; rows with `currentPeriodEnd = null` behave exactly as before (code inspection + the `subscriptionLapsed` unit tests).
- [ ] `prisma db push` (URLs sourced from repo-root `.env`) reports the database already in sync, or applies only the two nullable Subscription columns.
- [ ] No changes to `verifyStripeSignature`, the `statusMap` values, or the webhook route's 503/401 responses (diff inspection).

## Out of scope

- Do NOT deep-link locked CTAs to checkout — `apps/web/components/locked.tsx` keeps `href=\"/plans\"` (line 11); tier choice matters, this is deliberate.
- Do NOT pin a Stripe API version header or add the `stripe` npm SDK — the raw-fetch client is intentional; just parse both period-end locations.
- Do NOT add `TRIALING` to the `StripeEvent.status` union or change the `trialing→ACTIVE` mapping.
- Do NOT touch checkout session creation params (no `customer`, `customer_email`, or `customer_creation` — the id arrives via webhook).
- Do NOT edit `packages/db/prisma/schema.prisma` or create migrations — both columns already exist.
- No live Stripe keys, Clerk prod instance, or Shopify approvals — human-only blockers (the one-time \"save default portal configuration\" dashboard step belongs to this bucket too).
- No dunning emails/receipts (no email integration exists), no Sentry, no Inngest, no Playwright e2e.
- No portal `configuration`/`flow_data` customization — default portal config only.
- Do NOT fix the `/audit/demo` hardcoded-slug issue, the dead `Audit` model, or the in-memory rate limiter — known, separately-tracked gaps.
