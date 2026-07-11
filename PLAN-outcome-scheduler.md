# PLAN: Outcome measurement scheduler + weekly re-analysis (make the flywheel real)

**Rank rationale:** The product's core promise — "apply a move and we measure the lift after the window" — is currently broken in production: `measureOutcome` (packages/jobs/src/outcome.ts:40) has ZERO production call sites (only the test calls it), so every applied move sits in status `SCHEDULED` and the /monitoring page renders "measuring" forever. Likewise, analysis only runs on first dashboard load, settings save, or a user-clicked Sync — there is no recurring re-analysis anywhere (no cron route, no `schedule:` in CI, no Fly scheduled machines, no Inngest despite the Slice-3 comment). Worse, even if something called `measureOutcome`, `latestMetricValue` would return a value from the SAME run that produced the baseline unless fresh data is synced+analyzed after the window — the measured "lift" would be groundless. This plan closes the whole loop with the smallest honest mechanism: a secret-guarded `/api/cron/tick` route driven by a GitHub Actions schedule, which (a) refreshes stale stores (backfill + re-analysis, reusing the existing atomic SYNCING claim) and (b) measures due outcomes against a genuinely post-window run.

## Goal

A tick endpoint, callable every 6 hours by a GitHub Actions cron, that:

1. **Measures due outcomes**: every `RecommendationOutcome` in status `SCHEDULED` whose `implementedAt + measurementWindowDays` is in the past gets its tracked metric read from a run started AFTER the window closed, `computeLift` applied, and the row atomically flipped to `MEASURED`/`INCONCLUSIVE` (idempotent — a concurrent/repeated tick cannot double-measure).
2. **Weekly re-analysis**: READY, token-connected, non-demo stores whose latest DONE run is older than 7 days get a fresh backfill + analysis (capped per tick, per-store try/catch), so "This week's moves" actually refreshes weekly and post-window runs exist for measurement.
3. **Trigger**: `.github/workflows/cron.yml` on `cron: '17 */6 * * *'` curling `POST https://simplesense.co/api/cron/tick` with `Authorization: Bearer $CRON_SECRET` (constant-time verified server-side). No new infra.
4. The /monitoring page (which already renders MEASURED/INCONCLUSIVE badges — verified at apps/web/app/monitoring/page.tsx:97-108) starts showing real lifts; its hardcoded `{30}`-day copy is replaced with `ATTRIBUTION_WINDOW_DAYS`.

`CRON_SECRET` is an OPTIONAL env (assertServerEnv untouched); when unset the route returns 503, matching the Shopify webhook route's "not configured" pattern.

## Files to touch

- `packages/jobs/src/tick.ts` — NEW: `runTick`, `findDueOutcomes`, `measureDueOutcomes`, `selectStoresToRefresh`, constants `MAX_STORES_PER_TICK`, `REANALYZE_AFTER_DAYS`.
- `packages/jobs/src/index.ts` — export the new tick functions/types.
- `packages/jobs/test/tick.test.ts` — NEW: unit tests with mock PrismaClient objects (same style as `packages/jobs/test/outcome.test.ts`).
- `apps/web/lib/cron-auth.ts` — NEW: pure constant-time bearer-secret check (`isAuthorizedCron`).
- `apps/web/lib/cron-auth.test.ts` — NEW: tests for the auth helper.
- `apps/web/app/api/cron/tick/route.ts` — NEW: POST handler — 503 when CRON_SECRET unset, 401 on bad secret, otherwise `runTick(prisma, …)` and JSON counts.
- `apps/web/middleware.ts` — add `'/api/cron(.*)'` to the `isPublic` route matcher (Clerk would otherwise gate the machine-to-machine call).
- `.github/workflows/cron.yml` — NEW: scheduled workflow + `workflow_dispatch`, curls the endpoint with the repo secret.
- `apps/web/app/monitoring/page.tsx` — replace hardcoded `{30}` (line 40) with `ATTRIBUTION_WINDOW_DAYS` from `@ss/config`.
- `STATUS.md` — add unchecked human action item: set `CRON_SECRET` on Fly and as a GitHub repo secret.

## Implementation order

1. **Create `packages/jobs/src/tick.ts`.** `@ss/jobs` already depends on `@ss/core`, `@ss/config`, `@ss/db`, `@ss/engine`, `@ss/integrations` (packages/jobs/package.json), so all imports below resolve. Shape:

   ```ts
   import { computeLift } from '@ss/core'
   import { DEMO, type PrismaClient } from '@ss/db'
   import type { LlmClient } from '@ss/engine'
   import type { ShopifyReader } from '@ss/integrations'
   import { analyzeStore } from './analyze'
   import { backfillStore } from './backfill'

   /** LLM re-analysis costs money — hard cap the number of stores refreshed per tick. */
   export const MAX_STORES_PER_TICK = 5
   /** A store whose latest DONE run is older than this gets re-analyzed ("weekly moves"). */
   export const REANALYZE_AFTER_DAYS = 7
   /** Mirror of the sync stale-takeover in apps/web/app/connections/actions.ts:11. */
   const STUCK_AFTER_MS = 15 * 60 * 1000
   const DAY_MS = 86_400_000

   export interface DueOutcomeRow {
     id: string
     implementedAt: Date
     measurementWindowDays: number
     baselineValue: number | null
     storeId: string
     trackedKey: string | null
   }

   export interface TickResult {
     refreshed: number
     refreshErrors: number
     skippedSyncing: number
     measured: number
     inconclusive: number
     deferred: number
   }
   ```

   `findDueOutcomes(db, now)`: there is NO due-date column on RecommendationOutcome (schema.prisma:256-269) and NO storeId on the row — dueness is computed in JS and store/metric come through the recommendation relation:

   ```ts
   export async function findDueOutcomes(db: PrismaClient, now: Date): Promise<DueOutcomeRow[]> {
     const scheduled = await db.recommendationOutcome.findMany({
       where: { status: 'SCHEDULED' },
       select: {
         id: true, implementedAt: true, measurementWindowDays: true, baselineValue: true,
         recommendation: { select: { storeId: true, evidenceMetricIds: true } },
       },
     })
     return scheduled
       .filter((o) => o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS <= now.getTime())
       .map((o) => ({
         id: o.id, implementedAt: o.implementedAt,
         measurementWindowDays: o.measurementWindowDays, baselineValue: o.baselineValue,
         storeId: o.recommendation.storeId,
         trackedKey: o.recommendation.evidenceMetricIds[0] ?? null,
       }))
   }
   ```

   Private helper (do not reuse `latestRunId` — we need `startedAt` for the post-window check):

   ```ts
   async function latestDoneRun(db: PrismaClient, storeId: string) {
     return db.analysisRun.findFirst({
       where: { storeId, status: 'DONE' },
       orderBy: { startedAt: 'desc' },
       select: { id: true, startedAt: true },
     })
   }
   ```

   `measureDueOutcomes(db, due, now)` — GROUNDING + IDEMPOTENCY core. Only measure against a run started at/after the window close; write via a conditional `updateMany` claim (same pattern as the sync lock) so a second tick can never double-measure:

   ```ts
   export async function measureDueOutcomes(
     db: PrismaClient, due: DueOutcomeRow[], now: Date,
   ): Promise<Pick<TickResult, 'measured' | 'inconclusive' | 'deferred'>> {
     let measured = 0, inconclusive = 0, deferred = 0
     for (const o of due) {
       try {
         const dueAt = new Date(o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS)
         const run = await latestDoneRun(db, o.storeId)
         // GROUNDING: never measure against the same (pre-window) run that produced the
         // baseline — wait for a run started after the window closed.
         if (!run || run.startedAt.getTime() < dueAt.getTime()) { deferred += 1; continue }
         const metric = o.trackedKey
           ? await db.metric.findFirst({
               where: { runId: run.id, key: o.trackedKey }, select: { valueNumeric: true },
             })
           : null
         const measuredValue = metric?.valueNumeric ?? null
         const r = computeLift(o.baselineValue, measuredValue)
         // Idempotent claim: only the tick that still sees SCHEDULED wins (count === 1).
         const claimed = await db.recommendationOutcome.updateMany({
           where: { id: o.id, status: 'SCHEDULED' },
           data: {
             measuredValue, liftValue: r.liftValue,
             liftConfidence: r.liftConfidence, status: r.status,
           },
         })
         if (claimed.count === 1) r.status === 'MEASURED' ? (measured += 1) : (inconclusive += 1)
       } catch (err) {
         console.error('[tick] measure failed outcome=%s: %s', o.id, (err as Error).message)
       }
     }
     return { measured, inconclusive, deferred }
   }
   ```

   `selectStoresToRefresh(db, due, now, maxStores)` — union of (a) stores of due outcomes lacking a post-window run and (b) READY stores with a stale latest run; due-outcome stores first; demo excluded:

   ```ts
   export async function selectStoresToRefresh(
     db: PrismaClient, due: DueOutcomeRow[], now: Date, maxStores: number,
   ): Promise<string[]> {
     const picked: string[] = []
     const seen = new Set<string>()
     // (a) due outcomes that can't be measured yet — need a post-window run first
     for (const o of due) {
       if (o.storeId === DEMO.storeId || seen.has(o.storeId)) continue
       const dueAt = o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS
       const run = await latestDoneRun(db, o.storeId)
       if (!run || run.startedAt.getTime() < dueAt) { seen.add(o.storeId); picked.push(o.storeId) }
     }
     // (b) weekly refresh: READY, token-connected, non-demo, latest DONE run > 7d old
     const candidates = await db.store.findMany({
       // Demo store is skipped deliberately: it is a static seeded showcase and each
       // re-analysis is a paid LLM call — refreshing it weekly buys nothing.
       where: { id: { not: DEMO.storeId }, syncStatus: 'READY', accessTokenEnc: { not: null } },
       select: { id: true },
     })
     const staleBefore = now.getTime() - REANALYZE_AFTER_DAYS * DAY_MS
     for (const s of candidates) {
       if (seen.has(s.id)) continue
       const run = await latestDoneRun(db, s.id)
       if (!run || run.startedAt.getTime() < staleBefore) { seen.add(s.id); picked.push(s.id) }
     }
     return picked.slice(0, maxStores)
   }
   ```

   `runTick` — orchestrator. It accepts an injectable `refresh` for tests; the DEFAULT refresh is backfill-then-analyze under the same atomic SYNCING claim used by `syncStoreAction` (apps/web/app/connections/actions.ts:53-65), so a tick never collides with a user-clicked sync:

   ```ts
   export interface TickOpts {
     llm: LlmClient
     reader?: ShopifyReader
     decryptToken?: (enc: string) => string
     now?: Date
     maxStores?: number
     /** Test seam — replaces the default claim+backfill+analyze per-store refresh. */
     refresh?: (storeId: string) => Promise<'refreshed' | 'skipped'>
   }

   export async function runTick(db: PrismaClient, opts: TickOpts): Promise<TickResult> {
     const now = opts.now ?? new Date()
     const maxStores = opts.maxStores ?? MAX_STORES_PER_TICK
     const due = await findDueOutcomes(db, now)
     const stores = await selectStoresToRefresh(db, due, now, maxStores)

     const defaultRefresh = async (storeId: string): Promise<'refreshed' | 'skipped'> => {
       // Atomic claim — identical shape to syncStoreAction; loses to an in-flight user sync.
       const stale = new Date(now.getTime() - STUCK_AFTER_MS)
       const claimed = await db.store.updateMany({
         where: {
           id: storeId,
           OR: [
             { syncStatus: { not: 'SYNCING' } },
             { syncStartedAt: null },
             { syncStartedAt: { lt: stale } },
           ],
         },
         data: { syncStatus: 'SYNCING', syncStartedAt: new Date(), syncError: null },
       })
       if (claimed.count === 0) return 'skipped'
       try {
         const store = await db.store.findUnique({
           where: { id: storeId }, select: { shopDomain: true, accessTokenEnc: true },
         })
         if (store?.accessTokenEnc && opts.reader && opts.decryptToken) {
           // Fresh data first — re-analyzing stale rows would replay the baseline numbers.
           await backfillStore(db, storeId, opts.reader, {
             shop: store.shopDomain, token: opts.decryptToken(store.accessTokenEnc),
           })
           // backfillStore flips READY internally — re-assert SYNCING for the analysis leg
           // (same dance as syncStoreAction, connections/actions.ts:72).
           await db.store.update({ where: { id: storeId }, data: { syncStatus: 'SYNCING' } })
         }
         await analyzeStore(db, storeId, { llm: opts.llm })
         await db.store.update({
           where: { id: storeId },
           data: { syncStatus: 'READY', lastSyncedAt: new Date(), syncError: null },
         })
         return 'refreshed'
       } catch (err) {
         await db.store.update({
           where: { id: storeId },
           data: { syncStatus: 'ERROR', syncError: String((err as Error).message).slice(0, 500) },
         })
         throw err
       }
     }
     const refresh = opts.refresh ?? defaultRefresh

     let refreshed = 0, refreshErrors = 0, skippedSyncing = 0
     for (const storeId of stores) {
       try {
         const r = await refresh(storeId)
         r === 'refreshed' ? (refreshed += 1) : (skippedSyncing += 1)
       } catch (err) {
         refreshErrors += 1
         console.error('[tick] refresh failed store=%s: %s', storeId, (err as Error).message)
       }
     }

     const m = await measureDueOutcomes(db, due, now)
     return { refreshed, refreshErrors, skippedSyncing, ...m }
   }
   ```

2. **Export from `packages/jobs/src/index.ts`** — append:

   ```ts
   export {
     runTick,
     findDueOutcomes,
     measureDueOutcomes,
     selectStoresToRefresh,
     MAX_STORES_PER_TICK,
     REANALYZE_AFTER_DAYS,
     type TickResult,
     type TickOpts,
     type DueOutcomeRow,
   } from './tick'
   ```

3. **Create `packages/jobs/test/tick.test.ts`** using the mock-PrismaClient style of `packages/jobs/test/outcome.test.ts` (plain objects cast `as unknown as PrismaClient`; pass `refresh` spies and `now` explicitly; `maxStores` small). Cover at minimum:
   - `findDueOutcomes`: one SCHEDULED outcome due (`implementedAt` 31 days before `now`, window 30) is returned; one not-yet-due (5 days ago) is filtered out; `trackedKey` is `evidenceMetricIds[0]`, and `null` when the array is empty.
   - `measureDueOutcomes` defers (count in `deferred`, no `updateMany` call) when the latest DONE run's `startedAt` is BEFORE `implementedAt + window`.
   - `measureDueOutcomes` measures when a post-window run exists: mock `analysisRun.findFirst` → `{ id: 'run2', startedAt: <after dueAt> }`, `metric.findFirst` → `{ valueNumeric: 0.84 }`, baseline 0.7 → assert `updateMany` called with `where: { id, status: 'SCHEDULED' }` and `data.status === 'MEASURED'`, `data.liftValue ≈ 0.14` (mirrors outcome.test.ts:45-49).
   - Idempotency: when the mock `updateMany` returns `{ count: 0 }` (another tick won), the result counters do NOT increment.
   - Missing tracked metric in the post-window run (`metric.findFirst` → null) → `computeLift(baseline, null)` → `updateMany` with `status: 'INCONCLUSIVE'`, `measuredValue: null` (grounding: never fabricate 0).
   - `selectStoresToRefresh`: skips `DEMO.storeId` even when stale; caps at `maxStores`; puts due-outcome stores before merely-stale stores; a READY store with a DONE run 2 days old is NOT selected; one with an 8-day-old run IS.
   - `runTick` error isolation: injected `refresh` throws for store A, resolves for store B → result has `refreshErrors: 1`, `refreshed: 1`, and measurement still runs.

4. **Create `apps/web/lib/cron-auth.ts`** — pure and unit-testable, kept out of the route so tests don't import `prisma`. `timingSafeEqual` throws on length mismatch, so HMAC both sides to fixed length first (avoids the length-leak branch used in packages/integrations):

   ```ts
   import { createHmac, timingSafeEqual } from 'node:crypto'

   /**
    * Constant-time check of the cron bearer secret. Both values are HMAC'd to a fixed
    * length before comparison so neither content nor length leaks via timing.
    */
   export function isAuthorizedCron(header: string | null, secret: string | null): boolean {
     if (!secret || !header) return false
     const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header
     const a = createHmac('sha256', 'cron-auth').update(presented).digest()
     const b = createHmac('sha256', 'cron-auth').update(secret).digest()
     return timingSafeEqual(a, b)
   }
   ```

5. **Create `apps/web/lib/cron-auth.test.ts`** (vitest picks up `apps/**/*.test.ts` per vitest.config.ts): correct secret with `Bearer ` prefix → true; correct secret bare → true; wrong secret → false; empty header → false; null header → false; null/empty secret → false (even when header matches "").

6. **Create `apps/web/app/api/cron/tick/route.ts`** — thin; mirrors the webhook route's not-configured 503 (apps/web/app/api/webhooks/shopify/route.ts:12):

   ```ts
   import { NextResponse } from 'next/server'
   import { prisma } from '@ss/db'
   import { runTick } from '@ss/jobs'
   import { createLlmClient } from '@ss/engine'
   import { RealShopifyReader, decryptSecret } from '@ss/integrations'
   import { isAuthorizedCron } from '@/lib/cron-auth'

   /**
    * Scheduler tick (GitHub Actions cron): measure due outcomes + weekly re-analysis.
    * Guarded by CRON_SECRET — an OPTIONAL env (assertServerEnv intentionally does not
    * require it); unset → 503, same as the unconfigured Shopify webhook route.
    */
   export async function POST(req: Request): Promise<Response> {
     const secret = process.env.CRON_SECRET ?? null
     if (!secret) return new NextResponse('not configured', { status: 503 })
     if (!isAuthorizedCron(req.headers.get('authorization'), secret)) {
       return new NextResponse('unauthorized', { status: 401 })
     }
     const result = await runTick(prisma, {
       llm: createLlmClient(),
       reader: new RealShopifyReader(),
       decryptToken: decryptSecret,
     })
     console.log(
       '[cron] tick refreshed=%d errors=%d skipped=%d measured=%d inconclusive=%d deferred=%d',
       result.refreshed, result.refreshErrors, result.skippedSyncing,
       result.measured, result.inconclusive, result.deferred,
     ) // counts only — PII-free
     return NextResponse.json({ ok: true, ...result })
   }
   ```

7. **Edit `apps/web/middleware.ts`** — in the `isPublic` matcher list, after `'/api/webhooks(.*)'`, add:

   ```ts
   '/api/cron(.*)',
   ```

   (Machine-to-machine, secret-verified — same rationale as the webhooks entry in the comment above the matcher. Without this, Clerk's `auth.protect()` intercepts the curl.)

8. **Create `.github/workflows/cron.yml`**:

   ```yaml
   # Scheduler for the outcome flywheel: measures due outcomes and re-analyzes stale stores.
   # SETUP (one-time, human): generate a secret (`openssl rand -hex 32`), then
   #   fly secrets set CRON_SECRET=<value> -a simplesense-co
   #   gh secret set CRON_SECRET --body <value>
   name: Cron tick

   on:
     schedule:
       - cron: '17 */6 * * *'
     workflow_dispatch: {}

   jobs:
     tick:
       runs-on: ubuntu-latest
       steps:
         - name: Call /api/cron/tick
           env:
             CRON_SECRET: ${{ secrets.CRON_SECRET }}
           run: |
             if [ -z "$CRON_SECRET" ]; then
               echo "CRON_SECRET repo secret is not set — see comment at top of this file."
               exit 1
             fi
             # Retries are safe: the tick claims outcomes/stores atomically (idempotent).
             curl --fail-with-body -sS -X POST \
               --max-time 570 --retry 2 --retry-delay 30 --retry-all-errors \
               -H "Authorization: Bearer $CRON_SECRET" \
               https://simplesense.co/api/cron/tick
   ```

9. **Edit `apps/web/app/monitoring/page.tsx`** — add `import { ATTRIBUTION_WINDOW_DAYS } from '@ss/config'` and change line 40's `a {30}-day window` to `a {ATTRIBUTION_WINDOW_DAYS}-day window`.

10. **Edit `STATUS.md`** — add one unchecked item to the open/human-action list: `- [ ] Set CRON_SECRET (openssl rand -hex 32) on Fly (fly secrets set CRON_SECRET=… -a simplesense-co) and as a GitHub repo secret (gh secret set CRON_SECRET) — enables the outcome-measurement / weekly re-analysis tick (.github/workflows/cron.yml). For local testing put it in apps/web/.env.local.`

11. **Verification gate** (run from repo root, in order; fix anything that fails before proceeding):
    ```
    pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
    ```
    (`pnpm format` matters: CI runs `pnpm format:check` and will fail on unformatted new files.)

12. **Commit** (only the files above) with message:
    ```
    feat: outcome scheduler + weekly re-analysis tick (flywheel measurement leg)

    - runTick in @ss/jobs: measure due outcomes against post-window runs
      (atomic SCHEDULED claim, grounded computeLift) + capped weekly
      backfill+re-analysis of stale READY stores
    - POST /api/cron/tick guarded by optional CRON_SECRET (constant-time)
    - GitHub Actions schedule (17 */6 * * *) as the trigger
    ```

## Edge cases & landmines

- **Clerk middleware gates ALL /api routes by default.** `apps/web/middleware.ts` matcher includes `'/(api|trpc)(.*)'` and only listed routes are public. Forgetting step 7 means the GH Actions curl gets a Clerk auth response, and the failure is invisible until the first scheduled run. Add `'/api/cron(.*)'` to `isPublic`.
- **There is NO `PENDING` outcome status.** The seed spec says "status PENDING/SCHEDULED" — exploration corrects this: `enum OutcomeStatus = SCHEDULED | MEASURED | INCONCLUSIVE` (schema.prisma:49-53). Filter on `status: 'SCHEDULED'` only. TRUST EXPLORATION here.
- **Idempotency has no room for a "claiming" status.** Because the enum has no intermediate value, the claim IS the final write: `updateMany({ where: { id, status: 'SCHEDULED' }, data: { …final } })` and check `count === 1`. Do NOT use `measureOutcome` (outcome.ts:51) for the tick — its `update` is unconditional and a double tick would double-write. Leave `measureOutcome` untouched (its API and test stay valid).
- **The grounding trap: measuring against the baseline's own run.** `latestMetricValue` reads the latest DONE run (analyze.ts:127-136); if the store hasn't re-analyzed since the move was applied, that IS the run the baseline came from and "lift" would always be ~0 (INCONCLUSIVE noise). Two defenses, both required: (a) `measureDueOutcomes` skips (defers) unless the latest DONE run's `startedAt >= implementedAt + windowDays`; (b) the refresh leg runs BEFORE the measurement leg inside `runTick` and prioritizes stores with unmeasurable due outcomes.
- **Re-analysis without re-backfill is fake freshness.** `analyzeStore` recomputes from rows already in Postgres (analyze.ts:24 `loadNormalizedStore`); it does NOT talk to Shopify. A "post-window run" on stale data would replay the pre-window numbers. That's why the default refresh does `backfillStore` → `analyzeStore` (the exact pipeline of `syncStoreAction`, connections/actions.ts:67-77), and why `runTick` takes `reader`/`decryptToken`. This extends the seed's "re-analyze READY stores" — justified by exploration fact (d)'s consequence note.
- **Race with a user-clicked Sync.** `syncStoreAction` claims via atomic `store.updateMany` flipping to SYNCING with a 15-min stale takeover (connections/actions.ts:53-65). The tick MUST use the identical claim (step 1, `defaultRefresh`) or two concurrent backfills will interleave upserts. If the claim returns `count === 0`, skip the store this tick (`skippedSyncing`).
- **backfillStore flips status to READY internally on success** (backfill.ts:62-65) — re-assert SYNCING before the analysis leg (as connections/actions.ts:72 does) so the UI pill stays honest, then set READY + `lastSyncedAt` after `analyzeStore`.
- **`analyzeStore` never writes RunStatus ERROR** — a crash mid-run leaves a RUNNING orphan (run created RUNNING at analyze.ts:31, flipped DONE at :67-70). Harmless for reads (`latestRunId` filters `status: 'DONE'`), but it means per-store try/catch in the tick is mandatory: catch, set `Store.syncStatus = 'ERROR'` with truncated `syncError`, count it, continue with the next store.
- **No due-date column, no storeId on the outcome row** (schema.prisma:256-269). Dueness cannot be expressed in a Prisma `where` on this schema — fetch all SCHEDULED rows (small table) and filter in JS; get `storeId`/`evidenceMetricIds` via the `recommendation` relation select. Do NOT add a migration for this.
- **`evidenceMetricIds[0]` can be missing, and the tracked metric can be absent from the new run.** Both paths must resolve to `computeLift(baseline, null)` → `INCONCLUSIVE` with `measuredValue: null` — never a fabricated 0 (the `?? 0` grounding trap from LEARNINGS; computeLift already handles nulls, packages/core/src/outcome.ts:20-27). Also fine: `baselineValue` null → INCONCLUSIVE.
- **assertServerEnv (packages/config/src/env.ts:113) must NOT be modified.** CRON_SECRET is an optional feature; the route 503s when unset. Adding it to the production-required list would brick the running Fly app on next deploy until the human sets the secret.
- **`timingSafeEqual` throws on unequal buffer lengths.** The repo's existing pattern short-circuits on `a.length === b.length` (e.g. packages/integrations/src/shopify/webhooks.ts:17) which leaks length; for a bearer secret, HMAC both sides to fixed 32 bytes first (step 4). Either way, never `===` on the raw strings.
- **Do NOT add `maxDuration`** to the route — that's a Vercel knob; this app is on Fly (fly.toml, single warm machine). Runtime is bounded instead by `MAX_STORES_PER_TICK = 5` and the workflow's `--max-time 570`.
- **Demo store is deliberately skipped in refresh** (`id: { not: DEMO.storeId }`, DEMO from `@ss/db`, packages/db/src/demo-ids.ts) — every re-analysis is a paid LLM call and the demo is a static showcase. Keep the comment in the code. Side effect: outcomes applied while browsing the demo org may defer forever — acceptable; do not special-case them.
- **GH Actions `--retry` re-POSTs.** Safe ONLY because both legs claim atomically (outcome `updateMany` on SCHEDULED; store SYNCING claim). Don't weaken either claim "for simplicity".
- **The mock LLM fallback:** `createLlmClient()` degrades to a mock when `ANTHROPIC_API_KEY` is unset (env.ts:27). Fine in dev — the tick still works end-to-end locally; nothing to guard.
- **Local env loading:** Next reads `apps/web/.env.local`, NOT the repo-root `.env` (LEARNINGS) — put `CRON_SECRET` there for local curl testing.
- **Prettier/oxlint gate:** CI runs `pnpm format:check` — run `pnpm format` (step 11) so the new .yml/.ts files pass.

## Acceptance criteria

- [ ] All existing tests still pass and the full gate is green: `pnpm format:check && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` (145 pre-existing tests + new ones).
- [ ] NEW `packages/jobs/test/tick.test.ts` passes, covering: due filtering, post-window deferral, conditional-claim idempotency (`updateMany where {id, status:'SCHEDULED'}`, count 0 → no counter bump), MEASURED lift math (0.7 → 0.84 ⇒ liftValue ≈ 0.14), missing-metric → INCONCLUSIVE with `measuredValue: null`, demo-store skip, `maxStores` cap, per-store error isolation in `runTick`.
- [ ] NEW `apps/web/lib/cron-auth.test.ts` passes (Bearer and bare forms accepted; wrong/missing header rejected; unset secret rejected).
- [ ] `grep -n "api/cron" apps/web/middleware.ts` shows `/api/cron(.*)` inside the `isPublic` matcher.
- [ ] With `CRON_SECRET` unset, `pnpm dev` then `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/cron/tick` → `503`.
- [ ] With `CRON_SECRET=testsecret` in `apps/web/.env.local` (restart dev server): wrong secret → `401`; `curl -s -X POST -H "Authorization: Bearer testsecret" http://localhost:3000/api/cron/tick` → `200` with JSON containing keys `ok, refreshed, refreshErrors, skippedSyncing, measured, inconclusive, deferred`.
- [ ] Running the same authorized curl twice in a row does not change any already-measured outcome (second response's `measured` + `inconclusive` for those rows is 0 — idempotency).
- [ ] `.github/workflows/cron.yml` exists with `cron: '17 */6 * * *'` and `workflow_dispatch`, and `gh workflow list` shows "Cron tick" after push (actual scheduled execution requires the human-set repo secret — that setup is documented in the file header and STATUS.md, not automated).
- [ ] `grep -n "ATTRIBUTION_WINDOW_DAYS" apps/web/app/monitoring/page.tsx` hits (hardcoded `{30}` on line 40 is gone).
- [ ] `grep -rn "measureOutcome\|measureDueOutcomes" packages/jobs/src apps/web/app` shows the measurement path now reachable from `runTick` → route (no longer test-only).
- [ ] `STATUS.md` contains the CRON_SECRET setup item.
- [ ] No changes to `assertServerEnv` (git diff on packages/config/src/env.ts is empty).

## Out of scope

- **Inngest or any durable-queue infrastructure** (the Slice-3 comment in packages/jobs/src/index.ts stays as-is; do not add the dependency).
- **Per-topic Shopify webhook sync** — the `TODO(Slice 3)` in apps/web/app/api/webhooks/shopify/route.ts:27 stays; GDPR compliance webhooks are the parked App Store track.
- **Fly scheduled machines or a worker process** — no fly.toml changes; the trigger is GitHub Actions only.
- **Requiring CRON_SECRET in assertServerEnv** or any packages/config/src/env.ts change.
- **Weekly digest emails / Resend integration** (never wired; separate feature).
- **Monitoring page redesign** (BUILD_SPEC §4 pulse stats/TrendLine/Ring) — only the `{30}` copy fix.
- **Fixing the `latestRunId` query duplication / dashboard batching** (STATUS.md P1 perf item — separate plan).
- **buildAudit slug fix, Audit model wiring, features.ts, missing chart components** — unrelated audit findings.
- **Schema migrations** — no new columns (no dueAt, no storeId on RecommendationOutcome, no new OutcomeStatus values).
- **Setting the actual secrets** — `fly secrets set` / `gh secret set` are human actions; the code must behave gracefully (503) until then.
- **Refreshing the demo store on the tick** — deliberately skipped (LLM cost); do not "fix" this.
