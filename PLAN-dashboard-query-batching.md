# PLAN: Collapse dashboard/audit N+1 queries (runId-once + metric batch + parallel)

**Rank rationale:** `getDashboard()` — the most-hit authenticated page loader — issues ~14–16 *sequential* DB round-trips per render, and the public `/audit/[slug]` page issues 22 (buildAudit runs twice per request: once in `generateMetadata`, once in the page). The dominant waste is one identical query (`analysisRun.findFirst` for the latest run id) executed 7–8× per dashboard render (8 on the free tier, which also re-resolves it for the ranked gating list) because every `@ss/jobs` read helper re-resolves it internally, plus 4 KPI metrics fetched one-at-a-time. The app runs on a single warm Fly machine talking to Supabase Postgres, so every round-trip is real latency on every page view. This change is pure read-path refactoring — no schema changes, no behavior changes, no new dependencies — and drops the dashboard loader to ~5–6 queries (3 of them parallel) and the audit page to ~3 once per request. It also unblocks nothing and risks nothing gated by the known human-only blockers.

## Goal

Resolve the latest run id ONCE per loader, batch the 4 KPI metric reads into one `findMany`, run the independent reads in `Promise.all`, and deduplicate `resolveActiveStore` / `buildAudit` per request via React `cache()` — while preserving exact grounding semantics (missing metric → `null`, never a fabricated 0), exact recommendation ordering (`rankScore desc, id asc`), and the free-tier fixed-top-3 gating anchored to the FULL ranked list. All 145 existing tests stay green; old helper signatures remain as thin wrappers.

## Files to touch

- `packages/jobs/src/analyze.ts` — add `metricValuesForRun`, `recommendationsForRun`, `openRecommendationsForRun`; refactor `latestRecommendations`/`openRecommendations` into thin wrappers over the ForRun variants. Leave `latestRunId`, `latestMetrics`, `latestMetricValue` bodies untouched.
- `packages/jobs/src/index.ts` — export the three new helpers from `./analyze`.
- `packages/jobs/test/metric-values.test.ts` — NEW unit tests for `metricValuesForRun` (null semantics, no-query-on-null-runId, first-row-wins).
- `apps/web/lib/store-resolve.ts` — wrap `resolveActiveStore` in React `cache()` (one-line dedupe; AppShell + page loader currently each run it).
- `apps/web/lib/dashboard.ts` — `ensureRun` returns the run id; single ranked-list fetch reused for gating AND open rows; `Promise.all` entitlements + recommendations + batched metrics.
- `apps/web/lib/audit.ts` — resolve runId once, `Promise.all` the two reads, wrap `buildAudit` in `cache()` (halves the generateMetadata+page double call).
- `apps/web/lib/store-metrics.ts` — `Promise.all` the independent `entitlementsForOrg` + `latestMetrics` calls.

## Implementation order

1. **`packages/jobs/src/analyze.ts` — add the runId-parameterized helpers** (below `latestRunId`, ~line 88). The `Recommendation` type is already imported at line 1.

   ```ts
   /** Recommendations for a SPECIFIC run, ranked (stable across queries — ties at boundaries). */
   export async function recommendationsForRun(
     db: PrismaClient,
     runId: string,
   ): Promise<Recommendation[]> {
     return db.recommendation.findMany({
       where: { runId },
       orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
     })
   }

   /** OPEN moves (status NEW or VIEWED) for a SPECIFIC run, ranked. */
   export async function openRecommendationsForRun(
     db: PrismaClient,
     runId: string,
   ): Promise<Recommendation[]> {
     return db.recommendation.findMany({
       where: { runId, status: { in: ['NEW', 'VIEWED'] } },
       orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
     })
   }

   /**
    * Metric values for a SPECIFIC run in ONE query. Every requested key is present in the
    * returned Map; a metric absent from the run maps to null (grounding: missing data is
    * "insufficient", never a fabricated 0). Pass runId=null (no completed run) to get the
    * all-null map without touching the DB.
    */
   export async function metricValuesForRun(
     db: PrismaClient,
     runId: string | null,
     keys: readonly string[],
   ): Promise<Map<string, number | null>> {
     const values = new Map<string, number | null>()
     for (const key of keys) values.set(key, null)
     if (!runId || keys.length === 0) return values
     const rows = await db.metric.findMany({
       where: { runId, key: { in: [...keys] } },
       select: { key: true, valueNumeric: true },
     })
     const seen = new Set<string>()
     for (const row of rows) {
       if (seen.has(row.key)) continue // first row wins — mirrors the old findFirst behavior
       seen.add(row.key)
       values.set(row.key, row.valueNumeric ?? null)
     }
     return values
   }
   ```

2. **Same file — turn the latest-run helpers into thin wrappers** (production call sites use these signatures; do NOT remove them). Replace the bodies of `latestRecommendations` (lines 91–101) and `openRecommendations` (lines 107–117) with:

   ```ts
   export async function latestRecommendations(
     db: PrismaClient,
     storeId: string,
   ): Promise<Recommendation[]> {
     const runId = await latestRunId(db, storeId)
     return runId ? recommendationsForRun(db, runId) : []
   }

   export async function openRecommendations(
     db: PrismaClient,
     storeId: string,
   ): Promise<Recommendation[]> {
     const runId = await latestRunId(db, storeId)
     return runId ? openRecommendationsForRun(db, runId) : []
   }
   ```

   Keep the existing doc comments. Do NOT change `latestMetrics` (line 120) or `latestMetricValue` (line 127) — they stay as-is (still used by `loadStoreMetrics` and `scheduleOutcome`).

3. **`packages/jobs/src/index.ts`** — add the three names to the `./analyze` export block (lines 6–14): `recommendationsForRun`, `openRecommendationsForRun`, `metricValuesForRun`.

4. **`packages/jobs/test/metric-values.test.ts`** — NEW file, following the fake-db pattern used in `packages/jobs/test/analyze.test.ts`:

   ```ts
   import { describe, it, expect } from 'vitest'
   import type { PrismaClient } from '@ss/db'
   import { metricValuesForRun } from '../src/analyze'

   function fakeDb(rows: { key: string; valueNumeric: number | null }[]) {
     let calls = 0
     const db = {
       metric: {
         findMany: () => {
           calls += 1
           return Promise.resolve(rows)
         },
       },
     } as unknown as PrismaClient
     return { db, calls: () => calls }
   }

   describe('metricValuesForRun', () => {
     it('returns found values and null for keys missing from the run', async () => {
       const { db } = fakeDb([{ key: 'a', valueNumeric: 1.5 }])
       const m = await metricValuesForRun(db, 'run1', ['a', 'b'])
       expect(m.get('a')).toBe(1.5)
       expect(m.get('b')).toBeNull() // grounding: missing → null, never 0
     })

     it('preserves a stored null valueNumeric as null', async () => {
       const { db } = fakeDb([{ key: 'a', valueNumeric: null }])
       const m = await metricValuesForRun(db, 'run1', ['a'])
       expect(m.get('a')).toBeNull()
     })

     it('returns an all-null map WITHOUT querying when runId is null', async () => {
       const { db, calls } = fakeDb([{ key: 'a', valueNumeric: 9 }])
       const m = await metricValuesForRun(db, null, ['a', 'b'])
       expect(calls()).toBe(0)
       expect(m.get('a')).toBeNull()
       expect(m.get('b')).toBeNull()
     })

     it('first row wins on duplicate keys (mirrors old findFirst)', async () => {
       const { db } = fakeDb([
         { key: 'a', valueNumeric: 1 },
         { key: 'a', valueNumeric: 2 },
       ])
       const m = await metricValuesForRun(db, 'run1', ['a'])
       expect(m.get('a')).toBe(1)
     })
   })
   ```

5. **`apps/web/lib/store-resolve.ts`** — wrap `resolveActiveStore` in React `cache()`. Add `import { cache } from 'react'` at the top and convert the function declaration (lines 9–24) to a const, keeping the body and doc comment byte-identical:

   ```ts
   export const resolveActiveStore = cache(
     async (orgId: string): Promise<{ store: Store; isDemo: boolean }> => {
       // ...existing body unchanged...
     },
   )
   ```

   Leave `ownStoreId` untouched. All call sites (`shell.ts:25`, `dashboard.ts:82`, `store-metrics.ts:28`, `move-detail.ts:135`, `monitoring/page.tsx:17`, `api/export/[kind]/route.ts:57`) keep working — same signature.

6. **`apps/web/lib/dashboard.ts`** — the core rewrite.
   - Change the `@ss/jobs` import (lines 3–9) to: `import { analyzeStore, latestRunId, recommendationsForRun, metricValuesForRun } from '@ss/jobs'` (drop `openRecommendations`, `latestRecommendations`, `latestMetricValue`; keep `latestRunId` — `ensureRun` still uses it).
   - Add a module-level key list near the top:

   ```ts
   const DASHBOARD_METRIC_KEYS = [
     'pareto.revenue_total',
     'pareto.top20_revenue_share',
     'geo.within_5mi_revenue_share',
     'cohort.repeat_purchase_rate',
   ] as const
   ```

   - Rewrite `ensureRun` (lines 72–77) to return the run id — keep its existing doc comment about only analyzing READY stores:

   ```ts
   async function ensureRun(storeId: string, ready: boolean): Promise<string | null> {
     const existing = await latestRunId(prisma, storeId)
     if (existing) return existing
     if (!ready) return null
     const result = await analyzeStore(prisma, storeId, { llm: createLlmClient() })
     return result?.runId ?? null
   }
   ```

   - Rewrite `getDashboard` (lines 80–119). Keep the existing gating comment block. The full new body:

   ```ts
   export async function getDashboard(): Promise<DashboardData> {
     const { orgId } = await getSession()
     const { store, isDemo } = await resolveActiveStore(orgId)
     const syncing = !isDemo && store.syncStatus === 'SYNCING'
     const runId = await ensureRun(store.id, isDemo || store.syncStatus === 'READY')
     const hasRun = Boolean(runId)
     // Independent reads in parallel — runId was resolved ONCE above (after ensureRun,
     // which may have just created the run).
     const [ent, ranked, metricValues] = await Promise.all([
       entitlementsForOrg(orgId),
       runId ? recommendationsForRun(prisma, runId) : Promise.resolve([]),
       metricValuesForRun(prisma, runId, DASHBOARD_METRIC_KEYS),
     ])
     // One recommendation query serves BOTH the gating anchor (full ranked list) and the
     // open rows (filtered in JS — same predicate openRecommendations used, order preserved).
     const rows = ranked.filter((r) => r.status === 'NEW' || r.status === 'VIEWED')
     const restricted = !isDemo && ent.moves === 'top'
     const entitled = restricted
       ? entitledMoveIds(
           ent,
           isDemo,
           ranked.map((r) => r.id),
         )
       : null
     const { visible, lockedCount } = splitOpenMoves(entitled, rows)
     return {
       storeName: isDemo ? DEMO.storeName : store.shopDomain,
       model: modelLabel(),
       isDemo,
       syncing,
       needsSync: !isDemo && !syncing && !hasRun,
       historyLimited: !isDemo && !shopifyConfig().hasAllOrdersScope,
       lockedMoveCount: lockedCount,
       recommendations: visible.map(toCore),
       metrics: {
         revenue: metricValues.get('pareto.revenue_total') ?? null,
         top20: metricValues.get('pareto.top20_revenue_share') ?? null,
         within5: metricValues.get('geo.within_5mi_revenue_share') ?? null,
         repeat: metricValues.get('cohort.repeat_purchase_rate') ?? null,
       },
     }
   }
   ```

   (Keep the existing inline comments for `needsSync` etc. where they fit.)

7. **`apps/web/lib/audit.ts`** — same treatment plus per-request dedupe.
   - Change imports: `import { cache } from 'react'`; from `@ss/jobs` import `{ analyzeStore, latestRunId, recommendationsForRun, metricValuesForRun }` (drop `latestRecommendations`, `latestMetricValue`).
   - Add `const AUDIT_METRIC_KEYS = [...]` — same four keys as `DASHBOARD_METRIC_KEYS` above.
   - Rewrite `buildAudit` (lines 58–94) as a `cache()`-wrapped const (this collapses the double call from `apps/web/app/audit/[slug]/page.tsx:13` generateMetadata + `page.tsx:26` page render into one execution per request). Keep the doc comment and the `pareto.revenue_total` "identified customers" comment:

   ```ts
   export const buildAudit = cache(async (slug: string): Promise<PublicAudit> => {
     const storeId = DEMO.storeId
     let runId = await latestRunId(prisma, storeId)
     if (!runId) {
       const result = await analyzeStore(prisma, storeId, { llm: createLlmClient() })
       runId = result?.runId ?? null
     }
     const [rows, values] = await Promise.all([
       runId ? recommendationsForRun(prisma, runId) : Promise.resolve<PrismaRecommendation[]>([]),
       metricValuesForRun(prisma, runId, AUDIT_METRIC_KEYS),
     ])
     const moves = rows.slice(0, 3).map(toCore)
     const stats: AuditStat[] = [
       {
         label: 'Revenue from identified customers',
         value: usd(values.get('pareto.revenue_total') ?? null),
       },
       { label: 'Top-20% revenue share', value: pct(values.get('pareto.top20_revenue_share') ?? null) },
       { label: 'Revenue within 5 miles', value: pct(values.get('geo.within_5mi_revenue_share') ?? null) },
       { label: 'Repeat-purchase rate', value: pct(values.get('cohort.repeat_purchase_rate') ?? null) },
     ]
     return {
       storeName: DEMO.storeName,
       slug,
       headline: `${DEMO.storeName}: your highest-conviction moves`,
       generatedNote:
         'A free, grounded snapshot from Simple Sense — every number earned from your own store data.',
       moves,
       stats,
     }
   })
   ```

   Leave `findPiiLeaks` untouched.

8. **`apps/web/lib/store-metrics.ts`** — parallelize the two independent reads in `loadStoreMetrics` (lines 29–30):

   ```ts
   const [ent, metrics] = await Promise.all([
     entitlementsForOrg(orgId),
     latestMetrics(prisma, store.id),
   ])
   ```

   Everything else unchanged.

9. **Verification gate** (from repo root):

   ```
   pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
   ```

   All must pass; test count should be 145 existing + 4 new = 149 (or 145+N if the runner counts differently — the point is zero failures and the new file runs).

10. **Optional runtime query-count check** (screen-verifiable): `DEBUG="prisma:query" pnpm --filter @ss/web dev`, load `/app` while signed in with a run present, and count the `prisma:query` lines for that request. The whole request includes more than `getDashboard`: AppShell's `getShellContext` still runs `openRecommendations` (2 queries) and `getSession` upserts the org on the Clerk path (1). Expect ≤ 9 lines for the whole request (loader alone ~5–6, was ~14–16; whole request was ~19–20). Load `/audit/<demo-slug>` — expect ~3 total (not 22).

11. **Commit** with message:

    ```
    perf: collapse dashboard/audit N+1 — runId once, batched metrics, parallel reads
    ```

## Edge cases & landmines

- **`ensureRun` MUTATES — the run id must come from AFTER it, never before.** `ensureRun` may create the very run being read (`apps/web/lib/dashboard.ts:72-77` calls `analyzeStore`, which creates the run and flips it DONE at `packages/jobs/src/analyze.ts:67-70`). The rewrite in step 6 handles this by having `ensureRun` itself return the fresh id (`analyzeStore`'s `AnalyzeResult.runId`, `analyze.ts:6-11,72-77`). Do NOT hoist a `latestRunId` call above `ensureRun` in `getDashboard` and reuse it after. Note the new `ensureRun` checks `latestRunId` BEFORE the `ready` guard (the old one checked `ready` first) — required so its return value also serves the `hasRun`/`needsSync` semantics for a not-ready store with an old run, and it saves the old separate `hasRun` query.
- **Grounding null semantics are load-bearing.** Old `latestMetricValue` (`analyze.ts:127-136`) returns `null` for a missing run, a missing metric row, or a null `valueNumeric`. `metricValuesForRun` must pre-seed EVERY requested key with `null` and never default to 0. Also, `Map.get()` is typed `number | null | undefined` — call sites must use `?? null` (steps 6–7 do) so a typo'd key degrades to `null`/"insufficient", not `undefined` leaking into the UI.
- **`findFirst` → `findMany` duplicate-key behavior.** The old per-key read used `metric.findFirst` (`analyze.ts:134`). Metrics are written once per run via `createMany` (`analyze.ts:33-44`) so duplicates shouldn't exist, but the `seen`-set "first row wins" guard in `metricValuesForRun` keeps behavior identical if they ever do. Don't drop it.
- **Recommendation ordering is part of the gating contract.** Both existing findMany calls order by `[{ rankScore: 'desc' }, { id: 'asc' }]` with an explicit "stable across queries (ties at boundaries)" comment (`analyze.ts:99,115`). The ForRun variants must use the exact same orderBy, and deriving open rows via JS `filter` preserves that order — do not re-sort.
- **The gating anchor needs the FULL ranked list, not the open list.** `entitledMoveIds` (`apps/web/lib/gating.ts:26-33`) must receive ALL statuses of the run — passing the NEW/VIEWED-filtered rows would reintroduce the "dismiss-to-page-through-locked-moves" bypass closed in commit 44548e1. In step 6, `ranked` (all statuses) feeds `entitledMoveIds`; the filtered `rows` feed `splitOpenMoves`. Keep that split.
- **The paid path previously fetched only NEW/VIEWED rows; it now fetches the full run list once.** Behavior is identical (`splitOpenMoves` with `entitled === null` returns all open rows, `gating.ts:45`) and it's still strictly fewer queries (1 vs the old 2–4), just marginally more rows over the wire. Intentional — don't "optimize" it back into two queries.
- **React `cache()` is per-request and keys on arguments.** `resolveActiveStore(orgId)` gets the same `orgId` from the `cache()`d `getSession` (`apps/web/lib/auth.ts:21`), so AppShell (`shell.ts:25`) and the page loader now share one `store.findFirst`. In the route handler caller (`api/export/[kind]/route.ts:57`) Next 15 scopes `cache()` per request there too — it either dedupes within that request or falls through to a plain call; same signature and same result either way, safe. Precedent already in repo: `getSession` and `getShellContext` (`shell.ts:23`).
- **SEED CORRECTION (trust exploration):** the seed suggested getDashboard "reuse getShellContext for store/isDemo". `ShellContext` (`shell.ts:10-16`) does not expose `store.id`, and its `syncStatus` is the remapped `ShellSyncStatus` (demo collapsed to `'DEMO'`, `shell.ts:31`), not the raw store field — `getDashboard` needs both `store.id` and the raw `syncStatus`, so reusing the shell would require widening its public shape and touching its UI consumers. Wrapping `resolveActiveStore` in `cache()` (step 5) achieves the identical dedupe with zero interface change. Do that instead.
- **Old helper signatures must survive.** `openRecommendations` is still called by `getShellContext` (`shell.ts:26`), `latestMetricValue` by `scheduleOutcome` (`packages/jobs/src/outcome.ts:23`), and `latestMetrics` by `loadStoreMetrics` (`store-metrics.ts:30`). Note: NO test exercises these storeId-based read helpers (verified — nothing in `packages/jobs/test/` or `apps/web` tests references them), so only the gate's typecheck guards those call sites. Keep everything exported and behaviorally identical (thin wrappers); do not delete or rename anything currently exported from `packages/jobs/src/index.ts`.
- **Don't over-parallelize.** `getSession → resolveActiveStore → ensureRun` is a real dependency chain (orgId → store.id → runId); only the three reads AFTER runId is known are independent. Putting `ensureRun` inside the `Promise.all` would race the run creation against reads of it.
- **`buildAudit`'s `cache()` wrapper also prevents a double `analyzeStore`** on the audit cold path: previously generateMetadata's call and the page's call each ran the ensure-run check (`audit.ts:60-62`); they were sequential so no race, but the wrapper makes the whole 2× execution (22 queries, and 2 LLM-path checks) collapse to 1.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass from repo root.
- [ ] All 145 pre-existing tests still pass (no existing test file modified).
- [ ] NEW test file `packages/jobs/test/metric-values.test.ts` passes with 4 cases: found-key value + missing-key → null (one test), stored-null → null (never 0), runId=null → zero `findMany` calls + all-null map, duplicate-key first-row-wins.
- [ ] `grep -n "latestMetricValue" apps/web/lib/dashboard.ts apps/web/lib/audit.ts` returns nothing (the 8 per-key queries are gone from both hot paths).
- [ ] `grep -n "latestRunId" apps/web/lib/dashboard.ts` shows exactly two matches — the import line and the single call inside `ensureRun`; `grep -n "latestRunId" apps/web/lib/audit.ts` likewise shows exactly two (import + the one call in `buildAudit`).
- [ ] `grep -n "Promise.all" apps/web/lib/dashboard.ts apps/web/lib/audit.ts apps/web/lib/store-metrics.ts` shows one hit in each file.
- [ ] `grep -n "cache(" apps/web/lib/store-resolve.ts apps/web/lib/audit.ts` shows `resolveActiveStore` and `buildAudit` wrapped.
- [ ] `packages/jobs/src/index.ts` exports `metricValuesForRun`, `recommendationsForRun`, `openRecommendationsForRun` in addition to (not instead of) every previously exported name.
- [ ] Runtime check: with `DEBUG="prisma:query" pnpm --filter @ss/web dev`, one signed-in load of `/app` (run already exists) logs ≤ 9 `prisma:query` lines for the whole request — loader + AppShell's `openRecommendations` (2) + session upsert (was ~19–20; the loader alone drops from ~14–16 to ~5–6); one load of the demo audit page logs ≤ 4 (was 22).
- [ ] Screen check `/app`: KPI tiles show the same four values as before the change (or "—"/insufficient where a metric is absent — never 0 where it was previously blank); free-tier org still sees exactly the top-3 moves with the same locked-count card.
- [ ] Screen check `/audit/<demo-slug>`: page renders identical stats and 3 moves; `<title>` (from generateMetadata) still shows the store name.

## Out of scope

- NO scheduler / outcome-measurement work. The exploration facts about `measureOutcome` being dead code, the missing cron/Inngest, and the flywheel gap are context from a sibling investigation — do not add any of it here.
- NO changes to `analyzeStore`'s WRITE path (the per-recommendation `create` loop at `packages/jobs/src/analyze.ts:46-65` is a write-side N+1 — leave it; it runs once per store, not per render).
- NO schema changes, no new indexes, no Prisma client config changes (don't permanently enable query logging).
- NO cross-request caching (`unstable_cache`, ISR, `revalidate` changes) — React `cache()` per-request dedupe only.
- NO `cache()` wrapper on `entitlementsForOrg` or refactors of `move-detail.ts` / `monitoring/page.tsx` beyond what the `resolveActiveStore` wrapper gives them for free.
- NO removal or signature change of any existing `@ss/jobs` export; no changes to `getShellContext`'s `ShellContext` shape or its consumers.
- NO touching `fly.toml`, CI, tier gating logic (`gating.ts`), or the hardcoded 30-day copy in `monitoring/page.tsx` (separate concern).
- Do NOT deploy; stop after the gate passes and the commit is made.
