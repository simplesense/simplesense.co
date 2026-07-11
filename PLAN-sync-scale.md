# PLAN: Streaming ingest + nested line-item pagination + firstOrderAt (large-store readiness)

**Rank rationale:** `backfillStore` currently drains an ENTIRE store into RAM (`collectStore` at `packages/jobs/src/backfill.ts:12-34` runs four `drain()`s via `Promise.all` — every customer, product, order, and location materialized concurrently) before a single row is ingested. On the 1GB Fly machine (fly.toml:27 `memory = "1024mb"`) this is a deterministic OOM for any real store with meaningful order history, and because the sync retries, it becomes a retry-OOM loop that permanently blocks onboarding of exactly the stores that would pay. Two silent data-quality bugs ride along the same code path: orders with >20 line items are truncated (the GraphQL query at `reader.ts:182` fetches `lineItems(first:20)` with no follow-up), and `firstOrderAt` is hard-coded `null` (`reader.ts:250`), so the Customer CSV export column (`packages/core/src/export.ts:18,77`) is always empty for real stores. All three are fixed by one coherent refactor of the same pipeline, with no schema migration (both DB columns already exist) and no external approvals needed — this is the highest-leverage plannable work for going live with real merchants.

## Goal

`backfillStore` ingests a store of any size in bounded memory: catalog (customers/products/locations) first, then orders strictly page-by-page with a `syncStartedAt` heartbeat per page; orders with more than 20 line items are fully fetched via per-order nested pagination; `Customer.firstOrderAt` is derived from `min(order.createdAt)` per customer after orders land. `ingestNormalizedStore` survives unchanged in behavior as a wrapper (seed + demo + existing tests keep working), and every existing upsert call shape stays byte-identical.

## Files to touch

- `packages/db/src/ingest.ts` — split `ingestNormalizedStore` into exported `ingestCatalog(...)` + `ingestOrdersPage(...)` (moving the existing upsert loops verbatim), keep `ingestNormalizedStore` as a wrapper, add new `applyFirstOrderAt(...)`.
- `packages/jobs/src/backfill.ts` — rewrite `backfillStore` to stream: drain catalog generators, `ingestCatalog`, then `for await` over `reader.orders(...)` calling `ingestOrdersPage` per page + heartbeat, then `applyFirstOrderAt`, then the final READY update (now including `currency`). `collectStore` stays (tests use it) but is no longer called by `backfillStore`.
- `packages/integrations/src/shopify/reader.ts` — `gql()` gains a `variables` parameter; orders query adds `pageInfo{ hasNextPage endCursor }` inside `lineItems(first:20)`; `orders()` becomes an `async *` generator that paginates remaining line items per order via a new per-order `order(id:){ lineItems(after:) }` query.
- `packages/jobs/test/backfill.test.ts` — extend `fakeDb` with `order.groupBy`, `customer.update`, and a heartbeat counter; add tests for per-page heartbeats and firstOrderAt derivation.
- `packages/integrations/test/shopify.test.ts` — add tests: an order whose first line-items page reports `hasNextPage: true` gets its remaining items fetched and merged; an order with ≤20 items triggers no extra fetch.

No schema changes: `Customer.firstOrderAt DateTime?` (schema.prisma:139) and `Store.syncStartedAt DateTime?` (schema.prisma:96) already exist. No changes to `packages/db/src/index.ts` needed — it already does `export * from './ingest'` (index.ts:9), so the new exports flow through automatically.

## Implementation order

1. **`packages/db/src/ingest.ts` — split the ingest.** Add near the top:

   ```ts
   import type { Order } from '@ss/core'   // extend the existing @ss/core type import

   export interface IngestIdMaps {
     /** reader/fixture id (e.g. "gid://shopify/Customer/123" or "c12") → internal db cuid */
     customerDbId: Map<string, string>
     productDbId: Map<string, string>
   }
   ```

   Create `ingestCatalog` by moving (verbatim, do not reshape any upsert argument) the locations block (current lines 21-34), the customers block (36-55), and the products block (57-67):

   ```ts
   export async function ingestCatalog(
     db: PrismaClient,
     storeId: string,
     store: Pick<NormalizedStore, 'locations' | 'customers' | 'products'>,
   ): Promise<IngestIdMaps> {
     // ...moved locations deleteMany + create loop...
     // ...moved customer upsert loop building customerDbId...
     // ...moved product upsert loop building productDbId...
     return { customerDbId, productDbId }
   }
   ```

   Create `ingestOrdersPage` by moving the order upsert loop (current lines 69-106) verbatim:

   ```ts
   export async function ingestOrdersPage(
     db: PrismaClient,
     storeId: string,
     orders: readonly Order[],
     maps: IngestIdMaps,
   ): Promise<void> {
     const { customerDbId, productDbId } = maps
     for (const o of orders) { /* moved body, unchanged: scalars, lineItems map, db.order.upsert */ }
   }
   ```

2. **`packages/db/src/ingest.ts` — rewrite `ingestNormalizedStore` as a wrapper** with the SAME signature and the SAME trailing store update (current lines 112-119, including the currency comment):

   ```ts
   export async function ingestNormalizedStore(
     db: PrismaClient, orgId: string, storeId: string, store: NormalizedStore,
   ): Promise<string> {
     const maps = await ingestCatalog(db, storeId, store)
     await ingestOrdersPage(db, storeId, store.orders, maps)
     await db.store.update({
       where: { id: storeId },
       data: { currency: store.currency, syncStatus: 'READY', lastSyncedAt: new Date() },
     })
     return storeId
   }
   ```

   Do NOT call `applyFirstOrderAt` here — the seed/demo path (`packages/db/prisma/seed.ts:41`) must keep today's behavior byte-identical. Note the fixture customers carry NO `firstOrderAt` (`packages/db/src/demo-fixture.ts:78,94,112` push `{ id: cid }` only; the field is optional at `packages/core/src/types.ts:24`), so demo customers persist `firstOrderAt = null` today and the demo VIP CSV column renders empty. Deriving it for the demo would be a (small) behavior change — out of scope, don't.

3. **`packages/db/src/ingest.ts` — add `applyFirstOrderAt`:**

   ```ts
   /** Derive Customer.firstOrderAt = min(order.createdAt) per customer, from ingested rows. */
   export async function applyFirstOrderAt(db: PrismaClient, storeId: string): Promise<number> {
     const groups = await db.order.groupBy({
       by: ['customerId'],
       where: { storeId, customerId: { not: null } },
       _min: { createdAt: true },
     })
     let updated = 0
     for (const g of groups) {
       if (!g.customerId || !g._min.createdAt) continue
       await db.customer.update({
         where: { id: g.customerId },
         data: { firstOrderAt: g._min.createdAt },
       })
       updated++
     }
     return updated
   }
   ```

   (`where: { id }` is safe/tenant-correct: the `customerId` values come from order rows already filtered by `storeId`.)

4. **`packages/jobs/src/backfill.ts` — stream the backfill.** Change the import to `import { ingestCatalog, ingestOrdersPage, applyFirstOrderAt, type PrismaClient } from '@ss/db'`. Leave `drain` and `collectStore` in place unchanged (the `collectStore` test at `backfill.test.ts:11-20` uses them); add a doc-comment line to `collectStore`: "Demo/test-scale only — materializes the whole store in RAM; live backfill streams via backfillStore." Keep the existing `findUnique` existence guard; rewrite the SYNCING update + try block:

   ```ts
   await db.store.update({
     where: { id: storeId },
     data: { syncStatus: 'SYNCING', syncStartedAt: new Date() },
   })
   try {
     const info = await reader.fetchShopInfo(opts.shop, opts.token)
     // Catalog phases are small (id/email/address rows); orders dominate memory and stream below.
     const [customers, products, locations] = await Promise.all([
       drain<Customer>(reader.customers(opts.shop, opts.token)),
       drain<Product>(reader.products(opts.shop, opts.token)),
       drain<StoreLocation>(reader.locations(opts.shop, opts.token)),
     ])
     const maps = await ingestCatalog(db, storeId, { locations, customers, products })

     let orderCount = 0
     for await (const page of reader.orders(opts.shop, opts.token)) {
       await ingestOrdersPage(db, storeId, page, maps)
       orderCount += page.length
       // Heartbeat: keep the 15-min stale watchdog (connections/actions.ts) from stealing a live job.
       await db.store.update({ where: { id: storeId }, data: { syncStartedAt: new Date() } })
     }

     await applyFirstOrderAt(db, storeId)
     await db.store.update({
       where: { id: storeId },
       data: { currency: info.currency, syncStatus: 'READY', lastSyncedAt: new Date() },
     })
     return { orders: orderCount, customers: customers.length, products: products.length }
   } catch (err) {
     await db.store.update({ where: { id: storeId }, data: { syncStatus: 'ERROR' } })
     throw err
   }
   ```

   Note `currency: info.currency` in the final update — previously `ingestNormalizedStore`'s trailing update wrote currency (ingest.ts:115); since backfillStore no longer calls it, currency responsibility moves here. Do NOT write `hasPhysicalLocations`/`freeShippingThreshold` (user settings — see comment at ingest.ts:110-111).

5. **`packages/integrations/src/shopify/reader.ts` — widen `gql` to arbitrary variables.** Change the signature (reader.ts:102-107) from `cursor: string | null` to:

   ```ts
   private async gql<T>(
     shop: string, token: string, query: string,
     variables: Record<string, unknown> = {},
   ): Promise<T> {
     const body = JSON.stringify({ query, variables })
     // ...rest of the retry loop unchanged...
   ```

   Update internal callers: `paginate` (reader.ts:146) passes `{ cursor }`; `fetchShopInfo` (reader.ts:154-159) drops its trailing `null` argument (defaults to `{}`).

6. **`reader.ts` — orders query gains lineItems pageInfo.** In the orders query (reader.ts:182), change `lineItems(first:20){ nodes{ ... } }` to:

   ```
   lineItems(first:20){ pageInfo{ hasNextPage endCursor } nodes{ quantity product{ id }
     originalUnitPriceSet{ shopMoney{ amount } }
     discountedUnitPriceSet{ shopMoney{ amount } } } }
   ```

   Extract the line-item node type so it can be shared, and HOIST `OrderNode` to module scope — it is currently declared inside `orders()` (reader.ts:186-202), and the module-level `mapOrderNode` in step 7 cannot reference a function-scoped interface (typecheck would fail):

   ```ts
   interface LineItemNode {
     quantity: number
     product?: { id: string } | null
     originalUnitPriceSet?: MoneyBag
     discountedUnitPriceSet?: MoneyBag
   }
   ```

   Move `interface OrderNode { ... }` next to it at module level and change `OrderNode.lineItems` to `lineItems?: { pageInfo?: PageInfo; nodes: LineItemNode[] }` (pageInfo optional so the existing mapping test's mock — which has no `lineItems.pageInfo` — keeps compiling and passing).

7. **`reader.ts` — per-order line-item pagination.** Add a module-level constant next to the orders query:

   ```ts
   const LINE_ITEMS_QUERY = `query($id:ID!,$cursor:String){ order(id:$id){
     lineItems(first:250, after:$cursor){ pageInfo{ hasNextPage endCursor }
       nodes{ quantity product{ id }
         originalUnitPriceSet{ shopMoney{ amount } }
         discountedUnitPriceSet{ shopMoney{ amount } } } } } }`
   ```

   Convert `orders()` from `return this.paginate(...)` into an `async *` generator (the `ShopifyReader` interface return type `AsyncGenerator<Order[]>` is unchanged, so `MockShopifyReader` and all callers are unaffected). Extract the existing arrow-mapper (reader.ts:208-228) into a module-level `function mapOrderNode(n: OrderNode, items: LineItemNode[]): Order` (using the module-scoped `OrderNode` from step 6) that maps `lineItems: items.map(...)` instead of `n.lineItems?.nodes`:

   ```ts
   async *orders(shop: string, token: string): AsyncGenerator<Order[]> {
     const query = /* existing orders query with pageInfo added */
     let cursor: string | null = null
     do {
       const data = await this.gql<{ orders: { nodes: OrderNode[]; pageInfo: PageInfo } }>(
         shop, token, query, { cursor })
       const page: Order[] = []
       for (const n of data.orders.nodes) {
         const items: LineItemNode[] = [...(n.lineItems?.nodes ?? [])]
         let li = n.lineItems?.pageInfo
         while (li?.hasNextPage && li.endCursor) {  // rare path: >20 line items
           const more = await this.gql<{
             order: { lineItems: { nodes: LineItemNode[]; pageInfo: PageInfo } } | null
           }>(shop, token, LINE_ITEMS_QUERY, { id: n.id, cursor: li.endCursor })
           if (!more.order) break  // order deleted mid-sync — keep what we have
           items.push(...more.order.lineItems.nodes)
           li = more.order.lineItems.pageInfo
         }
         page.push(mapOrderNode(n, items))
       }
       yield page
       cursor = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null
     } while (cursor)
   }
   ```

   Keep `sourceName: null` in `mapOrderNode` exactly as today (reader.ts:216) — sourceName plumbing is a separate plan.

8. **`packages/jobs/test/backfill.test.ts` — extend `fakeDb`.** The backfill path now calls `db.order.groupBy`, `db.customer.update`, and heartbeat `db.store.update({ data: { syncStartedAt } })`. Extend the fake (keep everything else identical):

   ```ts
   const heartbeats = { count: 0 }
   // store.update handler becomes:
   update: ({ data }: { data: { syncStatus?: string; syncStartedAt?: Date } }) => {
     if (data.syncStatus) status.push(data.syncStatus)
     else if (data.syncStartedAt) heartbeats.count++
     return Promise.resolve({})
   },
   // customer gains update (records firstOrderAt onto the row matched by internal id):
   customer: {
     upsert: upsertInto(customers, 'c'),
     update: ({ where, data }: { where: { id: string }; data: { firstOrderAt?: Date } }) => {
       for (const row of customers.values()) {
         const r = row as { id: string; firstOrderAt?: Date | null }
         if (r.id === where.id) Object.assign(r, data)
       }
       return Promise.resolve({})
     },
   },
   // order gains groupBy (min createdAt per customerId over ingested rows):
   order: {
     upsert: upsertInto(orders, 'o'),
     groupBy: () => {
       const mins = new Map<string, Date>()
       for (const row of orders.values()) {
         const o = row as { customerId?: string | null; createdAt: Date }
         if (!o.customerId) continue
         const cur = mins.get(o.customerId)
         if (!cur || o.createdAt < cur) mins.set(o.customerId, o.createdAt)
       }
       return Promise.resolve(
         [...mins].map(([customerId, min]) => ({ customerId, _min: { createdAt: min } })),
       )
     },
   },
   ```

   Return `heartbeats` and `customerRows: () => [...customers.values()] as { id: string; firstOrderAt?: Date | null }[]` from `fakeDb()` alongside `db/status/sizes`.

9. **`backfill.test.ts` — new tests** (existing 3 must pass untouched in their assertions):

   ```ts
   it('heartbeats syncStartedAt once per orders page (stale-watchdog safety)', async () => {
     const { db, heartbeats } = fakeDb()
     await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
       shop: 'wildflower.myshopify.com', token: 'tok',
     })
     expect(heartbeats.count).toBe(Math.ceil(seed.orders.length / 10))
   })

   it('derives firstOrderAt = min order createdAt per customer', async () => {
     const { db, customerRows } = fakeDb()
     await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
       shop: 'wildflower.myshopify.com', token: 'tok',
     })
     // pick any seed customer that has orders; expected min from the seed itself
     const withOrders = seed.orders.filter((o) => o.customerId)
     const target = withOrders[0]!.customerId!
     const expected = new Date(Math.min(
       ...seed.orders.filter((o) => o.customerId === target).map((o) => o.createdAt.getTime()),
     ))
     // internal fake id is `c_${digits of target}` (shopifyIdOf strips non-digits)
     const internalId = `c_${target.replace(/\D/g, '')}`
     const row = customerRows().find((c) => c.id === internalId)
     expect(row?.firstOrderAt).toEqual(expected)
   })
   ```

10. **`packages/integrations/test/shopify.test.ts` — line-item pagination tests.** Follow the existing stub pattern (`vi.stubGlobal('fetch', ...)`, `describe('RealShopifyReader live mapping')` around lines 91-176). Add:

    - Test A (paginates): `fetch` mock resolves in sequence: (1) an orders page with one node `id: 'gid://shopify/Order/1'`, 20 line-item nodes, `lineItems.pageInfo: { hasNextPage: true, endCursor: 'li20' }`, outer `orders.pageInfo: { hasNextPage: false, endCursor: null }`; (2) `{ data: { order: { lineItems: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [/* 5 more */] } } } }`. Drain `new RealShopifyReader().orders('x.myshopify.com','tok')`; assert the single mapped order has 25 `lineItems`, `fetch` was called exactly twice, and the second call's parsed body has `variables: { id: 'gid://shopify/Order/1', cursor: 'li20' }`.
    - Test B (no extra fetch): one orders page whose node has 3 line items and `lineItems.pageInfo.hasNextPage: false`; assert `fetch` called exactly once and 3 line items survive.
    - If any existing reader test asserts on request bodies, note the body shape changed from `variables: { cursor }` only in that `fetchShopInfo` now sends `variables: {}` — adjust only if a test actually asserts it. (Today's two reader tests assert only call counts and mapped output, so no edits expected.)

11. **Gate + commit.** Run from repo root:

    ```
    pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
    ```

    All must pass. Suggested commit message:

    ```
    feat: streaming order ingest + nested line-item pagination + derived firstOrderAt (large-store readiness)
    ```

## Edge cases & landmines

- **fakeDb is a shape contract** (`packages/jobs/test/backfill.test.ts:23-64`): customer/product/order expose ONLY `upsert` today; `store` only `findUnique`/`update`. Every new Prisma method the backfill path calls (`order.groupBy`, `customer.update`, heartbeat `store.update`) MUST be added to the fake or all three existing tests explode. Do NOT add methods the code doesn't call.
- **Seed-spec correction — do NOT rebuild id maps via `findMany`.** The seed suggested re-querying `Customer/Product` (`findMany select shopifyId,id`) after catalog ingest. Trust exploration instead: the DB stores `shopifyId` as digits-only BigInt (`shopifyIdOf` at ingest.ts:5-8 strips `gid://shopify/Customer/` prefixes), while orders reference customers by the RAW reader id — a DB-rebuilt map would need lossy key normalization on both sides, and `findMany` doesn't exist on the fakeDb. Within a single job run, returning the maps from `ingestCatalog` (built from upsert return values, exactly like today's closure at ingest.ts:37,58) is behavior-identical and test-safe.
- **Seed-spec correction — detect truncation via `pageInfo.hasNextPage`, not `length === 20`.** The seed proposed the length heuristic; `lineItems` is a connection and exposes `pageInfo` directly (verified against the documented connection model). The heuristic wastes a query on every order with exactly 20 items; `hasNextPage` is exact. Also: the nested pagination belongs in `RealShopifyReader.orders()`, not in `@ss/jobs` — the reader owns Shopify wire mapping (reader.ts:10-14 doc), and `MockShopifyReader`/tests are untouched that way.
- **Currency write moves.** `ingestNormalizedStore`'s trailing update (ingest.ts:112-119) wrote `currency` + READY; `backfillStore`'s own final update (backfill.ts:62-65) wrote READY + `lastSyncedAt` WITHOUT currency (a harmless duplicate flip today). Once backfillStore stops calling the wrapper, it must write `currency: info.currency` itself or live stores lose currency detection. Never write `hasPhysicalLocations`/`freeShippingThreshold` from sync — they're user settings (ingest.ts:110-111 comment).
- **Heartbeat must NOT set `syncStatus`.** The watchdog claim at `apps/web/app/connections/actions.ts:53-64` treats `syncStartedAt < now-15min` as stale and steals the job; bumping only `syncStartedAt` per page keeps long syncs alive. If the heartbeat also wrote `syncStatus`, it would pollute the fake's `status[]` array (test asserts `status[status.length-1] === 'READY'`) and re-trigger UI polling states. Also note `syncStoreAction` re-asserts SYNCING after backfill for the analysis leg (actions.ts:72) — unchanged, no interaction.
- **Order → deleted customer.** A page can contain an order whose `customerId` is not in the map (customer deleted in Shopify). Current behavior at ingest.ts:73 is `customerDbId.get(o.customerId) ?? null` — the moved code preserves this; do not "fix" it into a throw.
- **`applyFirstOrderAt` must run AFTER all order pages.** The customer upsert's `update: fields` (ingest.ts:47,51) resets `firstOrderAt` to null on every re-sync (the reader yields `firstOrderAt: null`, reader.ts:250); the derivation recomputes it from order rows afterwards, so ordering inside `backfillStore` is load-bearing. The wrapper (seed path) intentionally skips derivation — fixture customers carry no `firstOrderAt` (demo-fixture.ts:78,94,112), so the demo persists null today and skipping keeps seed behavior byte-identical.
- **`FailingReader` test still works, but the failure point moves.** `backfill.test.ts:91-106` overrides `orders()` to throw on first `next()`. In the streamed flow, catalog ingest completes BEFORE orders, so the fake will have customer/product rows when ERROR is recorded — the test only asserts `status` contains `'ERROR'` and the rejection message, so it passes unchanged. Don't add assertions about empty catalog there.
- **`gql` retry loop and the new `variables` param.** `body` is computed once before the retry loop (reader.ts:109) — keep it that way when adding `variables`; recomputing inside the loop is wasted work but harmless, changing `variables` shape between retries is a bug.
- **`order(id:)` can return null** (order deleted between the page fetch and the line-items follow-up) — `break` and keep the 20 items already fetched rather than throwing the whole store into ERROR.
- **Query cost comment is folklore.** The `≈922` note at reader.ts:169-171 matches neither the documented linear model nor the live logarithmic scale (post-2024 connection costs are logarithmic per Shopify staff; real cost is far below the 1,000-point cap). Adding `pageInfo` to lineItems adds ~1 object per order — do NOT change page sizes (40×20) in this plan, and don't try to "correct" the math; optionally append one sentence to the comment noting costs are verifiable live via the `Shopify-GraphQL-Cost-Debug: 1` header.
- **`locations` deleteMany-then-create (ingest.ts:22) is not page-idempotent** — acceptable because `ingestCatalog` runs exactly once per backfill run with fully-drained locations (always ≤ a few hundred). Do not move it into a per-page path.
- **Memory AC applies to orders only.** Customers/products/locations are still drained to arrays (small rows: id/email/address; id/title/cost). That is the seed's explicit scope — do not gold-plate by streaming catalog phases too.
- **GROUNDING invariant holds:** `firstOrderAt` is computed from ingested order rows (real store data), never fabricated; customers with zero orders keep `firstOrderAt = null`, and the CSV export (`packages/core/src/export.ts:18,77`) renders empty, not a fake date.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass from repo root.
- [ ] All 145 pre-existing tests still pass; the 3 tests in `packages/jobs/test/backfill.test.ts` (SYNCING→READY, idempotency, ERROR-marking) pass with unchanged assertions.
- [ ] NEW test `packages/jobs/test/backfill.test.ts`: heartbeat count equals `Math.ceil(seed.orders.length / 10)` for `MockShopifyReader(seed, 10)` — verifiable via `pnpm --filter @ss/jobs test`.
- [ ] NEW test `packages/jobs/test/backfill.test.ts`: a seed customer with orders ends with `firstOrderAt` equal to the min `createdAt` of its seed orders.
- [ ] NEW tests `packages/integrations/test/shopify.test.ts`: (A) order with `lineItems.pageInfo.hasNextPage=true` yields 25 merged line items from 2 fetches, second fetch body has `variables: { id: 'gid://shopify/Order/1', cursor: 'li20' }`; (B) order with 3 line items triggers exactly 1 fetch — verifiable via `pnpm --filter @ss/integrations test`.
- [ ] No whole-store order accumulation in the backfill path: `grep -n "collectStore\|drain<Order>" packages/jobs/src/backfill.ts` — every match falls within `collectStore`'s doc/definition/body (`drain<Order>` legitimately remains inside `collectStore`), NONE within `backfillStore`; and `backfillStore` contains `for await` over `reader.orders`.
- [ ] Upsert call shapes unchanged: `git diff packages/db/src/ingest.ts` shows the customer/product/order `upsert` argument objects moved but textually identical (same `where: { storeId_shopifyId: ... }`, same `update`/`create` bodies).
- [ ] `ingestNormalizedStore` signature unchanged (`(db, orgId, storeId, store) → Promise<string>`) and `packages/db/prisma/seed.ts:41` compiles without edits.
- [ ] `grep -n "sourceName: null" packages/integrations/src/shopify/reader.ts` still matches (sourceName untouched by this plan).
- [ ] Screen check (optional, needs a connected dev store): trigger Sync on /connections; while syncing, `Store.syncStartedAt` advances in the DB as pages land, and after READY, `SELECT count(*) FROM "Customer" WHERE "firstOrderAt" IS NOT NULL AND "storeId" = '<id>'` is > 0.

## Out of scope

- **`sourceName` plumbing** (adding the scalar to the orders query, widening `exchangeCodeForToken`, `grantedScopes` column, per-store `historyLimited`) — separate plan; keep `sourceName: null` at reader.ts:216.
- **Resumable/durable jobs (Inngest or checkpointed cursors).** The job is still one in-process run inside `after()`; a killed job restarts from scratch on next Sync (idempotent upserts make that safe). No cursor persistence, no `[processes]` worker in fly.toml.
- **Streaming the catalog phases** (customers/products/locations stay drained to arrays — seed scope is orders only).
- **Raw-SQL bulk `UPDATE ... FROM` for firstOrderAt** — the groupBy + per-customer update loop is fine off the request path; don't hand-write SQL against unmapped table names.
- **Changing order/lineItems page sizes (40/20), the cost-comment math, retry policy, or API_VERSION '2024-10'.**
- **Reader changes for `firstOrderAt`** — Admin GraphQL Customer has NO first-order field (verified negative); do not add anything to the customers query.
- **Deriving `firstOrderAt` for the demo/seed path** — fixture customers carry no `firstOrderAt` and the demo VIP CSV column is empty today; keep the wrapper behavior byte-identical.
- **Fixing the duplicate READY flip semantics beyond what step 4 requires**, `measureOutcome` scheduling, query-duplication (`latestRunId` memoization), or any dashboard loader work — different plans.
- **Prisma schema/migrations** — zero schema changes in this plan.
