# PLAN: Per-store granted-scope tracking (historyLimited from reality, re-grant flow)

**Rank rationale:** `historyLimited` — the honesty banner that tells merchants their analysis covers only ~60 days — is currently derived from the `SHOPIFY_SCOPES` env var (what the deployment *requests*), not from what any store actually *granted*. That means flipping the env var the day Shopify approves `read_all_orders` would instantly un-label every existing store's still-partial data, violating the GROUNDING invariant (implying data we don't have). The fix is cheap and unblocks the known human-gated milestone: capture the `scope` field Shopify already returns in the token exchange (we currently throw it away), persist it per store, compute `historyLimited` from it, and give merchants a one-click re-consent path when new scopes become available. Everything else about the upgrade path (full re-backfill) already works because backfill is idempotent-full on every run.

## Goal

1. `exchangeCodeForToken` returns `{ token, scope }` instead of a bare token string; the OAuth callback persists the granted scope list on the store.
2. New nullable `Store.grantedScopes` column (raw comma-separated string as Shopify returns it).
3. `historyLimited` is computed per store: if `grantedScopes` is recorded, check it for `read_all_orders`; if `null` (legacy stores connected before this change), fall back to the current env-based check. Demo store behavior unchanged (`isDemo` already short-circuits).
4. Re-grant flow: when the env `SHOPIFY_SCOPES` includes a scope the store's recorded grant lacks, the Connections page shows a \"re-connect to grant new permissions\" banner linking the existing `/api/stores/connect/start?shop=...` GET route. OAuth re-consent overwrites both the token and `grantedScopes` via the existing upsert. No special post-upgrade sync handling is needed: `backfillStore` re-drains every page on each run (verified in `packages/jobs/src/backfill.ts:12-34` — `collectStore` fully re-fetches all entities every time), so the user's next \"Re-sync\" click pulls the full history.
5. Update `PartialHistoryNotice` copy (currently says \"request it in your Partner dashboard\") to point at the per-store re-connect path.

## Files to touch

- `packages/db/prisma/schema.prisma` — add `grantedScopes String?` to `model Store` (next to `accessTokenEnc`, ~line 91).
- `packages/db/prisma/migrations/20260706000001_store_granted_scopes/migration.sql` — NEW hand-written additive migration (repo convention is authored migrations + `migrate deploy`, per ADR-006 in `DECISIONS.md:63-76` — the seed spec said \"db push\" but that was only for the initial baseline; TRUST the repo convention).
- `packages/integrations/src/shopify/client.ts` — widen `exchangeCodeForToken` to `Promise<{ token: string; scope: string }>` on the interface, `RealShopifyClient`, and `MockShopifyClient`.
- `packages/integrations/test/shopify.test.ts` — update the mock-client test (line 72) for the new shape; add a `RealShopifyClient` exchange test with stubbed fetch.
- `apps/web/app/api/stores/connect/callback/route.ts` — destructure `{ token, scope }` from the exchange; write `grantedScopes` in BOTH branches of the store upsert.
- `packages/config/src/env.ts` — add pure helpers `storeHasAllOrdersScope(grantedScopes, src?)` and `missingScopes(grantedScopes, src?)`; clarify the `hasAllOrdersScope` doc comment (it reflects *requested*, not *granted*, scopes).
- `packages/config/test/config.test.ts` — new describe blocks for both helpers (keep the existing env-fallback tests untouched).
- `apps/web/lib/dashboard.ts` — `historyLimited` from `store.grantedScopes` (line 109), swap import.
- `apps/web/lib/store-metrics.ts` — same change (line 35), remove now-unused `shopifyConfig` import.
- `apps/web/components/PartialHistoryNotice.tsx` — copy update only (do NOT change the `{ show: boolean }` prop — 4 call sites depend on it).
- `apps/web/app/connections/page.tsx` — re-grant banner in the connected branch.

## Implementation order

1. **Schema.** In `packages/db/prisma/schema.prisma`, inside `model Store` (starts line 87), add directly under `accessTokenEnc`:

   ```prisma
   grantedScopes         String? // comma-separated scopes Shopify granted at OAuth; null = pre-tracking legacy connect
   ```

2. **Migration.** Create `packages/db/prisma/migrations/20260706000001_store_granted_scopes/migration.sql` containing exactly:

   ```sql
   ALTER TABLE \"Store\" ADD COLUMN \"grantedScopes\" TEXT;
   ```

   (Model has no `@@map`, so the table is `\"Store\"`.) Then regenerate the client: `pnpm --filter @ss/db generate`. Do NOT run `migrate deploy` yourself — applying to Supabase is a deploy-time step per `DEPLOY.md:64-65` (`pnpm --filter @ss/db exec prisma migrate deploy` against the pooler); note it in the commit message body. (Heads-up: the root `.env` `DATABASE_URL` points at that same Supabase pooler — there is no separate local DB — so the screen checks in the acceptance criteria can only run after the human applies the migration; see below.)

3. **Client signature.** In `packages/integrations/src/shopify/client.ts`:
   - Interface (line 8): `exchangeCodeForToken(shop: string, code: string): Promise<{ token: string; scope: string }>`
   - `RealShopifyClient.exchangeCodeForToken` (lines 26-36): change the parse line to

     ```ts
     const data = (await res.json()) as { access_token?: string; scope?: string }
     if (!data.access_token) throw new Error('Shopify token exchange returned no access_token')
     return { token: data.access_token, scope: data.scope ?? '' }
     ```

     (Shopify's offline-token response is `{\"access_token\": \"...\", \"scope\": \"write_orders,read_customers\"}` — `scope` is the granted list.)
   - `MockShopifyClient` (lines 65-67):

     ```ts
     exchangeCodeForToken(_shop: string, _code: string): Promise<{ token: string; scope: string }> {
       return Promise.resolve({
         token: 'mock_shpat_access_token',
         scope: 'read_orders,read_customers,read_products,read_locations,read_inventory',
       })
     }
     ```

     The mock scope MUST NOT include `read_all_orders` (see landmines).

4. **Callback.** In `apps/web/app/api/stores/connect/callback/route.ts`, replace lines 49-55:

   ```ts
   let token: string
   let grantedScope: string
   try {
     const exchanged = await client.exchangeCodeForToken(shop, code)
     token = exchanged.token
     grantedScope = exchanged.scope
   } catch (err) {
     console.error('[connect] token exchange failed:', (err as Error).message)
     return fail('exchange')
   }
   ```

   Then add `grantedScopes: grantedScope || null` to BOTH the `update` and `create` objects of the `prisma.store.upsert` (lines 59-68). Empty string → store `null` so the legacy env fallback applies instead of \"granted nothing\".

5. **Config helpers.** In `packages/config/src/env.ts`, below `shopifyConfig`:

   ```ts
   const splitScopes = (s: string): string[] =>
     s.split(',').map((x) => x.trim()).filter(Boolean)

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
   ```

   (`EnvSource` is the file-local type alias at `env.ts:7` — already used in exported signatures like `llmConfig`, so declaration emit is fine.) Also reword the `hasAllOrdersScope` doc comment (env.ts:55-59) from \"among the granted scopes\" to \"among the scopes this deployment REQUESTS (SHOPIFY_SCOPES); per-store granted truth lives in Store.grantedScopes — see storeHasAllOrdersScope\". No index change needed: `packages/config/src/index.ts:7` already does `export * from './env'`.

6. **Consumers.** In `apps/web/lib/dashboard.ts`: change the import on line 11 to `import { llmConfig, storeHasAllOrdersScope } from '@ss/config'` and line 109 to:

   ```ts
   historyLimited: !isDemo && !storeHasAllOrdersScope(store.grantedScopes),
   ```

   In `apps/web/lib/store-metrics.ts`: change line 3 to `import { storeHasAllOrdersScope } from '@ss/config'` and line 35 to the same expression. (`resolveActiveStore` returns the full Prisma `Store`, so `store.grantedScopes` typechecks once step 2's `generate` has run.)

7. **Notice copy.** In `apps/web/components/PartialHistoryNotice.tsx`, replace the `<span>` body (lines 25-30) with:

   ```tsx
   <span>
     Showing roughly the <strong>last 60 days</strong> of orders. Shopify limits order history
     until <code>read_all_orders</code> is granted for this store. Once the permission is
     available, <a href=\"/connections\">re-connect your store</a> to unlock the full{' '}
     <strong>24-month</strong> analysis. Until then, trend and cohort figures reflect a partial
     window.
   </span>
   ```

   Keep the file header comment and the `{ show }` prop exactly as-is. It's a server component — a plain `<a>` is fine.

8. **Re-grant banner.** In `apps/web/app/connections/page.tsx`: add `missingScopes` to the `@ss/config` import (line 2 already imports `shopifyConfig`). After line 24 (`orderCount`), add:

   ```ts
   const missing = connected ? missingScopes(connected.grantedScopes) : []
   ```

   Inside the `connected ? (...)` branch (the `<div style={{ display: 'grid', gap: 14 }}>` at line 67), between the status `<p>` and `<SyncButton>`, add:

   ```tsx
   {missing.length > 0 && (
     <div
       style={{
         background: 'var(--ss-warning-bg)',
         color: 'var(--ss-warning)',
         borderRadius: 'var(--radius-sm)',
         padding: '12px 14px',
         fontSize: 13.5,
         lineHeight: 1.5,
       }}
     >
       New permissions are available for this store (<code>{missing.join(', ')}</code>).{' '}
       <a href={`/api/stores/connect/start?shop=${encodeURIComponent(connected.shopDomain)}`}>
         Re-connect Shopify
       </a>{' '}
       to grant them
       {missing.includes('read_all_orders') ? ' and unlock your full 24-month order history' : ''}.
       After re-connecting, click <strong>Re-sync</strong> to pull the new data.
     </div>
   )}
   ```

   (No `connected!` assertion needed — inside the ternary's truthy branch TypeScript has already narrowed `connected` to non-null.) The start route is a GET (`apps/web/app/api/stores/connect/start/route.ts`) that sets the state cookie and redirects to Shopify's consent screen — a plain anchor is the correct trigger; re-consent lands back on the callback whose upsert overwrites `accessTokenEnc` AND `grantedScopes`.

9. **Integrations tests.** In `packages/integrations/test/shopify.test.ts`:
   - Update line 72 to: `expect((await c.exchangeCodeForToken('wildflower.myshopify.com', 'code')).token).toMatch(/mock/)`
   - Add (importing `RealShopifyClient` from the same module the file already imports `MockShopifyClient` from):

     ```ts
     describe('RealShopifyClient token exchange', () => {
       afterEach(() => vi.unstubAllGlobals())
       it('returns the token AND the granted scope list', async () => {
         vi.stubGlobal(
           'fetch',
           vi.fn().mockResolvedValue({
             ok: true,
             json: () =>
               Promise.resolve({ access_token: 'shpat_x', scope: 'read_orders,read_all_orders' }),
           }),
         )
         const c = new RealShopifyClient({ apiKey: 'k', apiSecret: 's' })
         expect(await c.exchangeCodeForToken('wildflower.myshopify.com', 'code')).toEqual({
           token: 'shpat_x',
           scope: 'read_orders,read_all_orders',
         })
       })
       it('defaults scope to empty string when the response omits it', async () => {
         vi.stubGlobal(
           'fetch',
           vi.fn().mockResolvedValue({
             ok: true,
             json: () => Promise.resolve({ access_token: 'shpat_x' }),
           }),
         )
         const c = new RealShopifyClient({ apiKey: 'k', apiSecret: 's' })
         expect((await c.exchangeCodeForToken('s.myshopify.com', 'code')).scope).toBe('')
       })
     })
     ```

10. **Config tests.** In `packages/config/test/config.test.ts`, add `storeHasAllOrdersScope, missingScopes` to the import from `'../src/index'`, keep the existing `shopifyConfig.hasAllOrdersScope` describe untouched, and add:

    ```ts
    describe('storeHasAllOrdersScope (per-store granted scopes)', () => {
      it('trusts the recorded grant when present', () => {
        expect(storeHasAllOrdersScope('read_orders, read_all_orders', {})).toBe(true)
        // env says yes but the STORE never granted it — must stay limited
        expect(
          storeHasAllOrdersScope('read_orders,read_customers', {
            SHOPIFY_SCOPES: 'read_orders,read_all_orders',
          }),
        ).toBe(false)
      })
      it('falls back to env for legacy stores (null grant)', () => {
        expect(storeHasAllOrdersScope(null, {})).toBe(false)
        expect(storeHasAllOrdersScope(null, { SHOPIFY_SCOPES: 'read_all_orders' })).toBe(true)
      })
    })

    describe('missingScopes (re-grant detection)', () => {
      it('is empty for legacy stores (null) — never nag on unknown grants', () => {
        expect(missingScopes(null, { SHOPIFY_SCOPES: 'read_orders,read_all_orders' })).toEqual([])
      })
      it('is empty when the grant covers everything requested', () => {
        expect(
          missingScopes('read_orders,read_customers', {
            SHOPIFY_SCOPES: 'read_orders,read_customers',
          }),
        ).toEqual([])
      })
      it('lists newly requested scopes the store has not granted', () => {
        expect(
          missingScopes('read_orders,read_customers', {
            SHOPIFY_SCOPES: 'read_orders,read_customers,read_all_orders',
          }),
        ).toEqual(['read_all_orders'])
      })
    })
    ```

    Always pass an explicit `src` object in these tests so an ambient `SHOPIFY_SCOPES` in the shell can't flip results.

11. **Gate.** Run `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`. Fix anything it reports (most likely: the callback route or connections page missing the regenerated Prisma types if step 2's `generate` was skipped, or an unused-import lint error in `store-metrics.ts`).

12. **Commit.** Suggested message:

    ```
    feat: per-store granted-scope tracking — historyLimited from reality + re-grant banner

    Capture the `scope` field from Shopify's token exchange (previously discarded),
    persist it as Store.grantedScopes, and compute historyLimited per store with an
    env fallback for legacy connects. Connections shows a re-connect banner when the
    deployment requests scopes the store hasn't granted.

    Deploy note: apply the new migration with
    `pnpm --filter @ss/db exec prisma migrate deploy` against the Supabase pooler
    (DEPLOY.md) before or with this release. Column is additive/nullable — safe.
    ```

## Edge cases & landmines

- **Migration convention conflict (seed vs repo):** the seed spec says \"db push\", but ADR-006 (`DECISIONS.md:63-76`) and `DEPLOY.md:64-65` establish that after the `0_init` baseline, schema changes are authored migration files applied via `prisma migrate deploy`. Trust the repo: write the migration file in step 2 and leave the deploy-time apply as a note. Running `db push` instead would drift the migrations history.
- **Signature change blast radius is exactly three files.** `grep -rn exchangeCodeForToken` (excluding node_modules) hits only `packages/integrations/src/shopify/client.ts` (8, 26, 65), `apps/web/app/api/stores/connect/callback/route.ts:51`, and `packages/integrations/test/shopify.test.ts:72`. If typecheck reports anywhere else, stop and look — you edited the wrong thing.
- **MockShopifyClient scope must exclude `read_all_orders`.** `createShopifyClient` (`packages/integrations/src/index.ts:40`) returns the mock whenever Shopify creds are absent (all local dev). If the mock reported `read_all_orders` granted, every locally-connected store would silently drop the partial-history notice — the exact grounding bug this plan fixes. Use the default requested-scopes string (matches `env.ts:66-70`).
- **Write `grantedScopes` in BOTH upsert branches** (`callback/route.ts:59-68`). The `update` branch is the re-grant path — re-consent for an existing `shopDomain` goes through `update`, not `create`. Adding it only to `create` makes the entire re-grant flow a no-op.
- **Empty `scope` string → store `null`, not `''`.** `''.split(',')` after filter is `[]`, which would mean \"granted nothing\": `historyLimited` always true AND `missingScopes` returns every requested scope → permanent nag banner. `grantedScope || null` routes the weird case to the legacy fallback instead.
- **Legacy stores must not see the banner.** `missingScopes(null) → []` by design — stores connected before this change have unknown grants (`grantedScopes` null); nagging them to re-connect when nothing changed would be noise. They get scopes recorded on their next natural re-connect. (Their `historyLimited` keeps the old env-based behavior via the fallback — no regression.)
- **Demo store:** `grantedScopes` stays null forever, and that's fine — both consumers gate with `!isDemo &&` first (`dashboard.ts:109`, `store-metrics.ts:35`), and the Connections banner only renders for a `connected` (token-holding, org-owned) store. Do not add demo-specific scope logic.
- **Do not change the `PartialHistoryNotice` prop shape.** Four pages pass only `show` (`apps/web/app/customers/page.tsx:41`, `apps/web/app/products/page.tsx:29`, `apps/web/app/app/page.tsx:70`, `apps/web/app/geography/page.tsx:30` — note the dashboard is the nested `app/app/` route, not a root page). Copy-only change keeps this a zero-call-site edit.
- **`store-metrics.ts` will have an unused `shopifyConfig` import after the change** (line 3 imports it solely for line 35) — remove it or lint fails. `dashboard.ts` still needs `llmConfig` from the same import.
- **No post-upgrade sync special-casing.** `collectStore` (`packages/jobs/src/backfill.ts:12-34`) drains ALL pages of customers/products/orders/locations on every run, and ingest upserts by `(storeId, shopifyId)` (`packages/db/src/ingest.ts:50` etc.) — a re-sync after a scope upgrade is automatically a full-history backfill. Adding \"force full re-sync\" logic would be dead weight; the banner just tells the user to click Re-sync.
- **The re-connect link is a GET to the start route** (`apps/web/app/api/stores/connect/start/route.ts`), which is rate-limited (10/min/IP) and validates the shop domain — passing `connected.shopDomain` (already normalized at original connect) is safe. Don't build a new endpoint.
- **Config tests must inject `src`.** `shopifyConfig` defaults to `process.env`; helper tests that omit the `src` argument would pass/fail depending on the developer's shell. Every new assertion in step 10 passes an explicit object.
- **Prisma generate ordering:** `store.grantedScopes` won't exist on the TS `Store` type until `pnpm --filter @ss/db generate` runs after the schema edit. Run it in step 2, before touching `apps/web`.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass.
- [ ] All 145 pre-existing tests still pass (`pnpm test`), including the untouched `shopifyConfig.hasAllOrdersScope` describe in `packages/config/test/config.test.ts:12-25`.
- [ ] NEW tests pass: per-store + legacy-fallback cases for `storeHasAllOrdersScope` and null/covered/missing cases for `missingScopes` in `packages/config/test/config.test.ts`; `RealShopifyClient` exchange returns `{ token, scope }` (and `scope: ''` when omitted) plus the updated mock-client assertion in `packages/integrations/test/shopify.test.ts`.
- [ ] `grep -rn \"exchangeCodeForToken\" --include=\"*.ts\" packages apps | grep \"Promise<string>\"` returns nothing (signature fully widened).
- [ ] `grep -n grantedScopes packages/db/prisma/schema.prisma` shows the new nullable column, and `packages/db/prisma/migrations/20260706000001_store_granted_scopes/migration.sql` exists with the single `ALTER TABLE \"Store\" ADD COLUMN \"grantedScopes\" TEXT;` statement.
- [ ] `grep -rn \"shopifyConfig().hasAllOrdersScope\" apps/web/lib` returns nothing — both `dashboard.ts` and `store-metrics.ts` use `storeHasAllOrdersScope(store.grantedScopes)`.
- [ ] Callback upsert writes `grantedScopes` in both `update` and `create` branches (`grep -n grantedScopes apps/web/app/api/stores/connect/callback/route.ts` shows two hits inside the upsert).
- [ ] `apps/web/components/PartialHistoryNotice.tsx` no longer contains the string \"Partner dashboard\" and links to `/connections`.
- [ ] Screen checks — PREREQUISITE: the new column must exist in the database the dev server reads. The root `.env` `DATABASE_URL` is the live Supabase pooler (there is no separate local DB), so these checks run only AFTER the human applies the migration (`prisma migrate deploy`, the deploy-time step) — and the \"manually set the row\" edits below touch live data: note the original values and restore them afterward.
- [ ] Screen check (dev server, signed-in org with a connected store): manually set the store row's `grantedScopes` to `'read_orders,read_customers'` and run with `SHOPIFY_SCOPES=read_orders,read_customers,read_products,read_locations,read_inventory,read_all_orders` → `/connections` shows the re-connect banner naming `read_all_orders`, linking `/api/stores/connect/start?shop=<domain>`; the dashboard still shows the partial-history notice.
- [ ] Screen check inverse: set the same store's `grantedScopes` to include `read_all_orders` (env WITHOUT it) → no banner for that scope, no partial-history notice on `/app` (per-store truth beats env).
- [ ] Screen check demo: signed-out / demo org shows no partial-history notice and no banner (unchanged behavior).
- [ ] Commit message includes the deploy note about `prisma migrate deploy` against the Supabase pooler.

## Out of scope

- **Do NOT** add `sourceName` to the orders GraphQL query or derive `firstOrderAt` — that's a separate reader-plumbing plan (the hard-coded nulls at `reader.ts:216` and `reader.ts:250` stay).
- **Do NOT** touch ingest/backfill streaming, page-size, or query-cost math (`packages/jobs/src/backfill.ts`, `packages/db/src/ingest.ts`, the 922-cost comment at `packages/integrations/src/shopify/reader.ts:170`) — no special \"full re-sync after upgrade\" code either; existing idempotent-full behavior covers it.
- **Do NOT** add auto-sync to the OAuth callback, extract a shared sync-runner, or change `syncStoreAction` / `SyncButton` / `getSyncStatus` — separate plan.
- **Do NOT** backfill `grantedScopes` for legacy stores via `currentAppInstallation.accessScopes` or `GET /admin/oauth/access_scopes.json` — the null-fallback handles them; a scope-refresh job is a possible follow-up, not this slice.
- **Do NOT** change the onboarding page, connect-form accessibility/validation, tier gating, or `ConnectNotice` copy.
- **Do NOT** run `prisma db push` or `prisma migrate deploy` against production — applying the migration to Supabase is a deploy-time human step (DEPLOY.md).
- **Do NOT** flip `SHOPIFY_SCOPES` to include `read_all_orders` anywhere — that's the human-gated Shopify-approval blocker, not plannable work.
