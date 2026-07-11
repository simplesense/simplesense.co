# PLAN: Wire real acquisition source (order channel) into the analyzers

**Rank rationale:** The live product currently has a permanent honesty gap: the demo store shows the acquisition-mix metric working (demo fixture sets `sourceName`), but every real connected store gets \"insufficient — no Shopify source/UTM data on orders\" forever, because `RealShopifyReader` hard-codes `sourceName: null` and never requests the field. The fix is unusually cheap-to-leverage: `Order.sourceName` is a plain nullable scalar on the Admin GraphQL Order object (verified in current docs, not deprecated), so adding it costs **zero** query-cost points, and the entire downstream pipeline (core type, Prisma column, ingest, load-store, analyzer) already passes the field through end-to-end. One query token, one mapper line, and tests turn a permanently-dead metric into a live one with no schema migration and no cost-budget risk.

## Goal

Real Shopify stores get `order.sourceName` populated from the Admin GraphQL `Order.sourceName` scalar (normalized: trimmed, lowercased, empty → null), so the `acquisitionAnalyzer` (`acquisition.top_source_share`, `acquisition.source_count`) computes real values instead of always returning `insufficient`. Null-source orders (e.g. API-created) remain null and are skipped by the analyzer exactly as today. No claim of marketing/ad attribution is introduced anywhere — Shopify channel means \"where the order was placed.\"

## Files to touch

- `packages/integrations/src/shopify/reader.ts` — add `sourceName` to the orders GraphQL query, to the `OrderNode` interface, and map it (normalized) in the orders mapper; one-line addition to the cost comment.
- `packages/integrations/test/shopify.test.ts` — extend the existing `gqlOk` live-mapping test with `sourceName`; add one new test covering normalization + null/empty cases and asserting the query string requests `sourceName`.
- `packages/core/src/analyzers/mix.ts` — doc-comment only: clarify that Shopify source is point-of-sale channel, not marketing attribution.
- (verify-only, NO changes) `packages/core/src/types.ts:56`, `packages/db/src/ingest.ts:78`, `packages/db/src/load-store.ts:58`, `packages/db/prisma/schema.prisma:170`, `packages/db/src/demo-fixture.ts:68` — confirm the field already flows through each hop.

## Implementation order

1. **Read the current mapper** — `packages/integrations/src/shopify/reader.ts`, the `orders()` method (lines 168–230). Confirm the hard-coded `sourceName: null` at line 216 and that the GraphQL query (lines 174–185) does not request `sourceName`.

2. **Add a normalization helper** at module scope in `reader.ts` (next to the existing `num()` / `mapAddress()` helpers):

   ```ts
   /** Shopify sourceName, normalized: trimmed + lowercased; empty/missing → null. */
   function normalizeSource(s: string | null | undefined): string | null {
     const v = s?.trim().toLowerCase()
     return v ? v : null
   }
   ```

3. **Add the field to the GraphQL query.** In the `orders()` query string (line 176), change:

   ```
   nodes{ id createdAt
   ```
   to
   ```
   nodes{ id createdAt sourceName
   ```

   Use plain `sourceName` — it is a nullable `String` scalar directly on `Order` in Admin GraphQL (verified in current shopify.dev docs, present since well before 2024-10, not deprecated). Do NOT use `channelInformation { ... }` (deprecated as of 2026-07, and each nested object costs query points) and do NOT use `Order.attribution` (does not exist in API version 2024-10, which is what this reader pins via the `API_VERSION` const at reader.ts:66).

4. **Extend the `OrderNode` interface** (reader.ts:186–202): add one member

   ```ts
   sourceName?: string | null
   ```

5. **Replace the hard-coded null in the mapper.** reader.ts:216, change:

   ```ts
   sourceName: null,
   ```
   to
   ```ts
   sourceName: normalizeSource(n.sourceName),
   ```

6. **Update the cost comment** (reader.ts:169–170). Append one sentence to the existing comment block — do not rewrite the 922 arithmetic:

   ```ts
   // sourceName is a scalar → 0 additional query-cost points under Shopify's static model.
   ```

7. **Verify (read-only, no edits) that the field flows end-to-end.** Each of these must already exist exactly as described — if any doesn't, STOP and re-check rather than inventing plumbing:
   - `packages/core/src/types.ts:56` — `sourceName?: string | null` on the core `Order` type.
   - `packages/db/prisma/schema.prisma:170` — `sourceName String?` on the `Order` model (column already exists; **no migration needed**).
   - `packages/db/src/ingest.ts:78` — order upsert writes `sourceName: o.sourceName ?? null`.
   - `packages/db/src/load-store.ts:58` — reads `sourceName` back into the analyzer store.
   - `packages/core/src/analyzers/mix.ts:95` — `acquisitionAnalyzer` skips orders where `!o.customerId || !o.sourceName` (null stays \"unknown\"; the analyzer returns `insufficient` when `firstSource.size === 0` at mix.ts:103–110, so stores whose orders all lack source still degrade honestly).
   - `packages/db/src/demo-fixture.ts:47,68` — demo vocabulary is `const SOURCES = ['web', 'google', 'facebook', 'web', 'web', 'instagram']` (6 entries, deliberately weighted toward `web`; distinct values `web`/`google`/`facebook`/`instagram`), already lowercase, so lowercasing real values keeps live and demo values in the same shape (`web`, `pos`, `shopify_draft_order`, etc. arrive lowercase from Shopify anyway).

8. **Extend the existing mapping test.** `packages/integrations/test/shopify.test.ts`, test `'maps GROSS totalPriceSet to totalPrice with refunds separate (no double-count)'` (lines 97–146): add `sourceName: 'web',` to the fixture node (e.g. after `createdAt` at line 104), and add an assertion next to the other field assertions:

   ```ts
   expect(o.sourceName).toBe('web')
   ```

9. **Add one new test** in the same `describe('RealShopifyReader live mapping')` block, reusing the `gqlOk` helper (shopify.test.ts:83–89):

   ```ts
   it('maps sourceName: requests the field, normalizes case/whitespace, nulls empty', async () => {
     const node = (id: string, sourceName: string | null) => ({
       id,
       createdAt: '2026-01-01T00:00:00Z',
       totalPriceSet: { shopMoney: { amount: '10.00', currencyCode: 'USD' } },
       totalDiscountsSet: { shopMoney: { amount: '0' } },
       totalRefundedSet: { shopMoney: { amount: '0' } },
       customer: null,
       shippingAddress: null,
       lineItems: { nodes: [] },
       sourceName,
     })
     const page = gqlOk({
       orders: {
         pageInfo: { hasNextPage: false, endCursor: null },
         nodes: [
           node('gid://shopify/Order/1', ' POS '),
           node('gid://shopify/Order/2', ''),
           node('gid://shopify/Order/3', null),
         ],
       },
     })
     const fetchMock = vi.fn().mockResolvedValue(page)
     vi.stubGlobal('fetch', fetchMock)

     const reader = new RealShopifyReader()
     const orders = []
     for await (const p of reader.orders('shop.myshopify.com', 'tok')) orders.push(...p)

     // the query itself must request the scalar
     expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain('sourceName')
     expect(orders.map((o) => o.sourceName)).toEqual(['pos', null, null])
   })
   ```

10. **Clarify the analyzer doc comment** (comment only — no logic, no string changes). `packages/core/src/analyzers/mix.ts`, the block comment above `acquisitionAnalyzer` (lines 84–88): extend it to state explicitly:

    ```
    Shopify sourceName is WHERE the order was placed (web, pos, mobile app, a sales
    channel app) — it is NOT marketing/ad attribution. Never present it as such.
    ```

    Do NOT change the `insufficient(...)` reason strings at mix.ts:105/123/133 and do NOT change any metric ids.

11. **Run the full gate:**

    ```
    pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
    ```

    All existing tests (145 at plan time) plus the new/extended ones must pass.

12. **Commit** with message:

    ```
    feat: map Order.sourceName from Shopify Admin GraphQL — acquisition analyzer live for real stores
    ```

## Edge cases & landmines

- **Do not use `channelInformation` or `attribution`.** `Order.channelInformation` is deprecated as of API 2026-07 and each nested object (`channelDefinition`, `app`) costs 1 query point per order node; `Order.attribution` does not exist at all in 2024-10 (the pinned `API_VERSION` at reader.ts:66) and will error. Plain `sourceName` is a scalar, 0 points, un-deprecated. A weaker model reading current shopify.dev pages may be misled: shopify.dev now serves the latest version's docs regardless of the `/2024-10/` URL segment (verified: the `/2024-10/objects/Order` page reports `api_version: 2026-07` and shows `attribution`).
- **The seed's claim that the \"owned-channel analyzer\" consumes sourceName is WRONG — trust exploration.** `ownedChannelAnalyzer` (`packages/core/src/analyzers/gated.ts:26–36`) is intentionally hard-gated on Klaviyo data and always emits `insufficient` by design. Do not touch `gated.ts`. Only `acquisitionAnalyzer` (mix.ts:89) reads `sourceName`.
- **Do not \"fix\" the 922 cost estimate at reader.ts:169–170.** The comment's arithmetic matches neither the documented linear model nor Shopify's live logarithmic connection costing, but the page sizes (40×20) are safe and validated in production. Adding a scalar changes cost by 0. Only append the one-line scalar note; a rewrite risks churn on a live-verified query with no behavioral benefit.
- **Existing test fixtures omit `sourceName`.** The mapper must use `normalizeSource(n.sourceName)` where `n.sourceName` is optional (`sourceName?: string | null`), so fixture nodes without the key map to `null` and the untouched tests (e.g. the THROTTLED-retry test at shopify.test.ts:148) keep passing.
- **Normalization must stay minimal: trim + lowercase + empty→null. Nothing else.** The analyzer groups by the raw string and surfaces the top source verbatim in `valueJson.source` (mix.ts:144). Mapping numeric channel-app ids or renaming values to \"friendlier\" labels would fabricate semantics — a GROUNDING-invariant violation. Empty string must become `null` (not `''`) so DB rows stay clean; the analyzer's `!o.sourceName` check treats both as unknown either way.
- **Null sources are expected and correct** (orders created via API/apps may have no source). The analyzer already handles them: skipped at mix.ts:95, and if zero orders have a source, `firstSource.size === 0` → `insufficient` at mix.ts:103–110. No new threshold logic needed.
- **No Prisma migration.** `Order.sourceName String?` already exists at schema.prisma:170 and ingest already writes it (ingest.ts:78). If you find yourself editing schema.prisma or ingest.ts, you've gone off-plan.
- **Demo store must be byte-identical.** `demo-fixture.ts:68` already sets sourceName; the demo path never goes through `RealShopifyReader`. Any diff in `packages/db/src/demo-fixture.ts` is a mistake.
- **Backfill/ingest tests use a narrow `fakeDb`** (`packages/jobs/test/backfill.test.ts:23–64`) — an in-memory stub exposing `store.findUnique`/`store.update`, `storeLocation.deleteMany`/`create`, and shopifyId-keyed `upsert` on customer/product/order. This plan touches neither ingest nor backfill, so all 4 tests in that file (the collectStore drain test plus the 3 fakeDb-backed status/idempotency tests) must pass unmodified — if they break, you changed something out of scope.
- **Honesty of copy:** Shopify channel is \"where the order was placed,\" not ad-platform attribution. The only copy change allowed is the mix.ts doc comment (step 10). Do not add or change UI copy, `PartialHistoryNotice` usage, or the `insufficient` reason strings.

## Acceptance criteria

- [ ] `grep -n \"sourceName: null\" packages/integrations/src/shopify/reader.ts` returns no match anywhere in the file (the string occurs exactly once today, at the orders mapper line 216; nothing else in the file matches it).
- [ ] `grep -n \"sourceName\" packages/integrations/src/shopify/reader.ts` shows the scalar inside the orders GraphQL query string.
- [ ] Extended test in `packages/integrations/test/shopify.test.ts` asserts `o.sourceName === 'web'` in the GROSS-mapping test and passes: `pnpm --filter @ss/integrations test`.
- [ ] NEW test `'maps sourceName: requests the field, normalizes case/whitespace, nulls empty'` in `packages/integrations/test/shopify.test.ts` passes, asserting (a) the fetch body contains `sourceName`, (b) `' POS '` → `'pos'`, (c) `''` → `null`, (d) `null` → `null`.
- [ ] All existing tests still pass: `pnpm test` (145 pre-existing tests green plus the new ones).
- [ ] Full gate passes: `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`.
- [ ] `git diff --stat` touches ONLY: `packages/integrations/src/shopify/reader.ts`, `packages/integrations/test/shopify.test.ts`, `packages/core/src/analyzers/mix.ts` (comment-only — verify with `git diff packages/core/src/analyzers/mix.ts` showing no non-comment lines changed).
- [ ] No changes to `packages/db/prisma/schema.prisma`, `packages/db/src/ingest.ts`, `packages/db/src/demo-fixture.ts`, `packages/core/src/analyzers/gated.ts`, or any `apps/web` file.
- [ ] Demo regression (objective, no screen check needed — the app has no dashboard \"channel-mix\" tile; `acquisition.top_source_share` surfaces in the web app only as the move-evidence label at `apps/web/lib/move-detail.ts:68`): (a) `git diff packages/db/src/demo-fixture.ts` is empty, (b) the mix.ts diff is comment-only, and (c) the existing `acquisitionAnalyzer` unit tests in `packages/core/test/analyzers/mix.test.ts` (describe at line 22: top-share 0.75, source_count 2, insufficient path) pass unchanged — together these guarantee demo values are byte-identical.

## Out of scope

- **`grantedScopes` capture** — widening `exchangeCodeForToken` to return the OAuth `scope` string, adding a `Store.grantedScopes` column, or making `historyLimited` per-store (it stays env-derived via `shopifyConfig().hasAllOrdersScope`). Separate plan.
- **`firstOrderAt` derivation** — the other hard-coded null at reader.ts:250. Admin GraphQL Customer has no first-order field; it needs derivation from order ingest. Separate plan.
- **Streaming/page-incremental ingest** — `collectStore` RAM behavior in `packages/jobs/src/backfill.ts` is untouched.
- **`channelInformation` / `Order.attribution` migration** — not usable/needed on 2024-10; revisit only if the API version is ever bumped.
- **Any UI copy changes** — no new notices, no `PartialHistoryNotice` edits, no dashboard text about acquisition sources.
- **Marketing/ad-platform attribution of any kind** — UTM parsing, `customerJourneySummary`, Meta/Google joins. The metric remains \"where the order was placed.\"
- **Rewriting the query-cost comment math or changing page sizes** (40×20 stays).
- **Live verification against a real Shopify store** (e.g. `Shopify-GraphQL-Cost-Debug: 1` header check) — blocked on human-held Shopify Partner approvals; the unit-test fixture is the verification surface for this plan.
