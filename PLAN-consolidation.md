# PLAN: Codebase consolidation — shared formatters, Notice, PageHeading, toCore, entitled-set helper, error boundaries

**Rank rationale:** The app layer is accumulating divergent copies of the same five things: usd/pct/int formatters re-declared in 7 files (with genuinely different behavior between them), a byte-identical `toCore()` pasted into 3 lib files, the free-tier top-N gating query hand-written in 3 places (where a future drift in `orderBy` would silently break the "fixed top-3" tier invariant), six banner implementations that are near-copies of each other (two of them inlined verbatim in `app/app/page.tsx`), and a `PageHeading` that only 3 of ~9 screens use while the rest hand-roll the same eyebrow+h1 block. Every new screen multiplies the drift. Consolidating now — while the codebase is still small and 145 tests are green — is the cheapest moment to do it, and it bundles the one genuine gap (zero `error.tsx` anywhere: unhandled server errors show Next's unstyled default page on a LIVE product). Everything here is a pure refactor with zero behavior change except the two new error pages.

**SEQUENCING: execute this plan AFTER PLAN-dashboard-query-batching.** Both plans touch `apps/web/lib/dashboard.ts` lines ~80–119. If that plan landed, the code around `latestRecommendations`/`entitledMoveIds` in `getDashboard()` will not match the snippets below — adapt: only swap the local `toCore` for the shared import and leave the (batched) query shape alone.

## Goal

One definition each for: money/percent/count formatters (`apps/web/lib/format.ts`), the Prisma→core recommendation mapper (`recommendationToCore` in `@ss/jobs`), the canonical fixed-top-N query (`topRunMoveIds` in `@ss/jobs`), the banner component (`<Notice>`), and the page heading (`<PageHeading>` in its own file) — with every duplicate deleted and grep proving it. Plus route-level error boundaries at `apps/web/app/error.tsx` and `apps/web/app/app/error.tsx`. Tests, lint, and build stay green; no data/logic behavior changes.

## Files to touch

- `apps/web/lib/format.ts` — NEW: `usd`, `usdAdaptive`, `pct`, `int`, `num`, `days` (null-safe, return `'—'`).
- `apps/web/lib/format.test.ts` — NEW: unit tests for every formatter incl. the `0`-is-not-null grounding cases.
- `packages/jobs/src/analyze.ts` — add `recommendationToCore()` and `topRunMoveIds()`.
- `packages/jobs/src/index.ts` — export the two new functions.
- `packages/jobs/test/rec-helpers.test.ts` — NEW: tests for both helpers (fake-db style, same pattern as `analyze.test.ts`).
- `apps/web/components/Notice.tsx` — NEW: single banner component (`tone`, `icon`, `href?`, `role?`, `align?`, `spin?`).
- `apps/web/components/PageHeading.tsx` — NEW: `PageHeading` moved verbatim out of `detail.tsx`.
- `apps/web/app/error.tsx` — NEW: root error boundary (client component, design-system styled, `reset()` button).
- `apps/web/app/app/error.tsx` — NEW: dashboard-segment error boundary.
- `apps/web/lib/dashboard.ts` — delete local `toCore` (lines 40–59), import `recommendationToCore` from `@ss/jobs`.
- `apps/web/lib/move-detail.ts` — delete local `toCore` (107–126) and local `usd` (77–82); use `recommendationToCore`, `usdAdaptive`, and `topRunMoveIds` (replaces inline findMany at 148–154).
- `apps/web/lib/audit.ts` — delete local `usd`/`pct` (22–30) and `toCore` (32–51); import shared ones.
- `apps/web/app/app/actions.ts` — replace inline top-N findMany (31–37) with `topRunMoveIds`.
- `apps/web/app/app/page.tsx` — delete local `usd`/`pct` (11–19); replace the two inline banners (26–46, 48–69) with `<Notice>`.
- `apps/web/app/customers/page.tsx` — delete local `pct`/`n`/`days` (17–19); import shared; `PageHeading` import path change.
- `apps/web/app/products/page.tsx` — delete local `pct`/`usd` (10–18); import shared; `PageHeading` import path change.
- `apps/web/app/geography/page.tsx` — delete local `pct` (11); import shared; `PageHeading` import path change.
- `apps/web/app/monitoring/page.tsx` — delete local `fmt` (13), use shared `num`; adopt `PageHeading`.
- `apps/web/app/plans/page.tsx` — adopt `PageHeading` (replaces hand-rolled block at 35–51).
- `apps/web/app/connections/page.tsx` — adopt `PageHeading` (replaces block at 29–42).
- `apps/web/app/settings/page.tsx` — adopt `PageHeading` (replaces block at 16–32).
- `apps/web/components/detail.tsx` — `DemoBanner` becomes a thin `<Notice>` wrapper; `PageHeading` removed (moved to its own file).
- `apps/web/components/SyncingBanner.tsx` — keep the `'use client'` refresh loop; swap the visual shell for `<Notice spin>`.
- `apps/web/components/PartialHistoryNotice.tsx` — swap shell for `<Notice tone="warning" align="top">`.
- `apps/web/components/ConnectNotice.tsx` — both variants become `<Notice>`.
- `apps/web/components/MovesList.tsx` — header block (49–80) becomes `<PageHeading>`; inline notice banner (82–104) becomes `<Notice>`.

## Implementation order

1. **Create `apps/web/lib/format.ts`.** Exact content (the canonical shapes come from the existing duplicates — do not "improve" them):

   ```ts
   /** Shared display formatters. Null-safe: missing data renders '—', NEVER a fabricated 0. */

   /** Whole-dollar USD (the dashboard/audit/products shape). */
   export const usd = (v: number | null): string =>
     v == null
       ? '—'
       : new Intl.NumberFormat('en-US', {
           style: 'currency',
           currency: 'USD',
           maximumFractionDigits: 0,
         }).format(v)

   /** Cents below $1,000, whole dollars above (move-detail evidence shape). */
   export const usdAdaptive = (v: number | null): string =>
     v == null
       ? '—'
       : new Intl.NumberFormat('en-US', {
           style: 'currency',
           currency: 'USD',
           maximumFractionDigits: v >= 1000 ? 0 : 2,
         }).format(v)

   /** Rounded whole percent from a 0–1 share. */
   export const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)

   /** Rounded integer with thousands separators. */
   export const int = (v: number | null): string =>
     v == null ? '—' : Math.round(v).toLocaleString('en-US')

   /** Number as-is with locale separators (may show decimals — used for outcome lift values). */
   export const num = (v: number | null): string => (v == null ? '—' : v.toLocaleString('en-US'))

   /** Day count, unrounded (customers page shape). */
   export const days = (v: number | null): string => (v == null ? '—' : `${v} days`)
   ```

   NOTE — seed correction: the seed said "have formatMetric consume the shared usd", but move-detail's local `usd` (move-detail.ts:77–82) is behaviorally different (2 fraction digits under $1,000). Literally using the shared 0-fraction `usd` there would change rendered evidence values. That is why `usdAdaptive` exists: it IS move-detail's formatter, relocated. Same for monitoring's `fmt` (monitoring/page.tsx:13): it is a plain `toLocaleString()` applied to lift/baseline values that can be decimals — `int` would round them, so `num` preserves it.

2. **Add `format.test.ts`** at `apps/web/lib/format.test.ts` (vitest already runs `apps/web/lib/*.test.ts` — see `gating.test.ts`):
   - all six return `'—'` for `null`;
   - `usd(0) === '$0'` and `pct(0) === '0%'` (zero is real data, not missing — grounding invariant);
   - `usd(1234) === '$1,234'`; `usdAdaptive(999.5) === '$999.50'`; `usdAdaptive(1000) === '$1,000'`;
   - `pct(0.42) === '42%'`; `int(1234.6) === '1,235'`; `num(1.25) === '1.25'`; `days(34) === '34 days'`.

3. **Add the two helpers to `packages/jobs/src/analyze.ts`** (it already imports `type Recommendation` from `@ss/db` at line 1 and already depends on `@ss/core` per `packages/jobs/package.json`). Append:

   ```ts
   import type { Recommendation as CoreRecommendation } from '@ss/core' // add to the top imports

   /** Map a persisted recommendation row to the core shape the UI consumes. */
   export function recommendationToCore(r: Recommendation): CoreRecommendation {
     return {
       id: r.id,
       category: r.category,
       title: r.title,
       rationale: r.rationale,
       evidenceMetricIds: r.evidenceMetricIds,
       impactLow: r.impactLow,
       impactHigh: r.impactHigh,
       impactUnit: r.impactUnit,
       effort: r.effort,
       confidence: r.confidence,
       rankScore: r.rankScore,
       status: r.status,
       suggestedExecution: (r.suggestedExecution ?? { type: 'manual', spec: {} }) as {
         type: string
         spec: Record<string, unknown>
       },
     }
   }

   /**
    * The FIXED top-n recommendation ids of a run — ALL statuses, canonical stable order
    * [{rankScore desc},{id asc}]. This is the tier-gating anchor: membership (not current
    * status) decides visibility, so dismissing a move never rotates a locked one into view.
    */
   export async function topRunMoveIds(
     db: PrismaClient,
     runId: string,
     n: number,
   ): Promise<string[]> {
     const rows = await db.recommendation.findMany({
       where: { runId },
       orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
       take: n,
       select: { id: true },
     })
     return rows.map((r) => r.id)
   }
   ```

   The body of `recommendationToCore` must be byte-identical to the existing three copies (dashboard.ts:40–59, move-detail.ts:107–126, audit.ts:32–51) — they are already identical to each other; copy one, don't retype.

4. **Export from `packages/jobs/src/index.ts`:** add `recommendationToCore, topRunMoveIds` to the existing `export { ... } from './analyze'` list (lines 6–14).

5. **Add `packages/jobs/test/rec-helpers.test.ts`** following the fake-db pattern already used in `packages/jobs/test/analyze.test.ts` (plain objects, no PGlite):
   - `recommendationToCore` maps every field and defaults `suggestedExecution` to `{ type: 'manual', spec: {} }` when the row's is `null`;
   - `topRunMoveIds` calls `db.recommendation.findMany` with exactly `{ where: { runId }, orderBy: [{ rankScore: 'desc' }, { id: 'asc' }], take: n, select: { id: true } }` (capture the arg in the fake and assert with `toEqual`) and returns the ids in order.

6. **Swap the three `toCore` copies.**
   - `apps/web/lib/dashboard.ts`: delete lines 40–59 (`function toCore…`), remove the now-unused `import type { Recommendation as PrismaRecommendation } from '@ss/db'` (line 1), add `recommendationToCore` to the existing `@ss/jobs` import (lines 3–9), change line 111 to `recommendations: visible.map(recommendationToCore),`. (Adapt line numbers if the batching plan reshaped this file — the only change here is the mapper.)
   - `apps/web/lib/move-detail.ts`: delete `toCore` (107–126), import `recommendationToCore` from `@ss/jobs` (extend line 2's import), change line 156 to `const rec = recommendationToCore(row)`. Remove the `PrismaRecommendation` type import from line 1 if now unused.
   - `apps/web/lib/audit.ts`: delete `toCore` (32–51), remove line 1's `PrismaRecommendation` import if unused, extend line 3's `@ss/jobs` import, change line 64 to `rows.slice(0, 3).map(recommendationToCore)`.

7. **Swap the two inline top-N gating queries** (dashboard keeps its `latestRecommendations` + `entitledMoveIds` path — per the batching plan it is the fewer-queries shape; do NOT touch it):
   - `apps/web/lib/move-detail.ts` lines 147–155 become:
     ```ts
     if (!isDemo && ent.moves === 'top') {
       const topOfRun = await topRunMoveIds(prisma, runId, FREE_TOP_MOVES)
       if (!topOfRun.includes(row.id)) return null
     }
     ```
     (add `topRunMoveIds` to the `@ss/jobs` import at line 2; keep the existing gating comment block above it).
   - `apps/web/app/app/actions.ts` lines 30–38 become:
     ```ts
     if (ent.moves === 'top') {
       const topOfRun = await topRunMoveIds(prisma, rec.runId, FREE_TOP_MOVES)
       if (!topOfRun.includes(recId)) return { ok: false, reason: 'tier_locked' }
     }
     ```
     (import `topRunMoveIds` from `@ss/jobs` alongside the existing `scheduleOutcome` import at line 3; keep the comment at lines 27–28). NOTE: actions.ts deliberately has no `!isDemo` in this condition — the demo store was already rejected at line 24; do not "unify" it with move-detail's condition.

8. **Replace the formatter locals.** In each file delete the local declarations and add `import { … } from '@/lib/format'`:
   - `apps/web/app/app/page.tsx`: delete lines 11–19; `import { usd, pct } from '@/lib/format'`.
   - `apps/web/app/customers/page.tsx`: delete lines 17–19; `import { pct, int, days } from '@/lib/format'`; rename the three `n(` call sites (lines 47, 58) to `int(`.
   - `apps/web/app/products/page.tsx`: delete lines 10–18; `import { pct, usd } from '@/lib/format'`.
   - `apps/web/app/geography/page.tsx`: delete line 11; `import { pct } from '@/lib/format'`.
   - `apps/web/app/monitoring/page.tsx`: delete line 13; `import { num } from '@/lib/format'`; rename the three `fmt(` call sites (lines 91, 93, 100) to `num(`.
   - `apps/web/lib/audit.ts`: delete lines 22–30; `import { usd, pct } from './format'` (relative — audit.ts is inside `lib/`).
   - `apps/web/lib/move-detail.ts`: delete lines 77–82 (local `usd`); `import { usdAdaptive } from './format'`; in `formatMetric` (line 102) change `usd(value)` to `usdAdaptive(value)`. `formatMetric` itself stays in move-detail.ts untouched otherwise.

9. **Create `apps/web/components/Notice.tsx`.** Exact content:

   ```tsx
   import type { CSSProperties, ReactNode } from 'react'

   type Tone = 'info' | 'warning' | 'success'

   const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
     info: { bg: 'var(--ss-info-bg)', fg: 'var(--text-link)', border: 'var(--ss-blue-300)' },
     warning: { bg: 'var(--ss-warning-bg)', fg: 'var(--ss-warning)', border: 'var(--ss-warning)' },
     success: { bg: 'var(--ss-success-bg)', fg: 'var(--ss-success)', border: 'var(--ss-success)' },
   }

   /**
    * The one status/info banner. Renders as a link when `href` is given (whole banner
    * clickable, e.g. the demo-data banner), else a div. `align="top"` for multi-line copy.
    */
   export function Notice({
     tone,
     icon,
     href,
     role,
     align = 'center',
     spin = false,
     children,
   }: {
     tone: Tone
     icon: string
     href?: string
     role?: string
     align?: 'center' | 'top'
     /** Animate the icon (sync-in-progress). */
     spin?: boolean
     children: ReactNode
   }) {
     const t = TONES[tone]
     const style: CSSProperties = {
       display: 'flex',
       alignItems: align === 'top' ? 'flex-start' : 'center',
       gap: 10,
       background: t.bg,
       color: t.fg,
       border: `1px solid ${t.border}`,
       borderRadius: 'var(--radius-sm)',
       padding: '12px 16px',
       fontSize: 13.5,
       lineHeight: 1.5,
       marginBottom: 20,
       textDecoration: 'none',
     }
     const iconEl = (
       <i
         className={`bi bi-${icon}`}
         aria-hidden="true"
         style={{
           flex: 'none',
           ...(align === 'top' ? { marginTop: 2 } : null),
           ...(spin ? { animation: 'ss-notice-spin 1.4s linear infinite' } : null),
         }}
       />
     )
     const spinStyle = spin ? (
       <style>{'@keyframes ss-notice-spin{to{transform:rotate(360deg)}}'}</style>
     ) : null
     if (href)
       return (
         <a href={href} style={style}>
           {iconEl}
           {children}
           {spinStyle}
         </a>
       )
     return (
       <div role={role} style={style}>
         {iconEl}
         {children}
         {spinStyle}
       </div>
     )
   }
   ```

   IMPORTANT: `children` must be rendered directly inside the flex row (as above, NOT wrapped in a `<span>`) — MovesList's trailing link relies on `marginLeft: 'auto'` working against the flex container.

10. **Convert the six banner sites to `<Notice>`** (keep every string of user-facing copy byte-identical):
    - `apps/web/components/detail.tsx` — `DemoBanner` body becomes:
      ```tsx
      import { Notice } from './Notice'
      export function DemoBanner({ show }: { show: boolean }) {
        if (!show) return null
        return (
          <Notice tone="info" icon="info-circle" href="/connections">
            Demo data — connect your Shopify store to see your own numbers →
          </Notice>
        )
      }
      ```
    - `apps/web/app/app/page.tsx` — the `data.isDemo` banner (26–46) becomes `<Notice tone="info" icon="info-circle" href="/connections">You're viewing demo data. Connect your Shopify store to see your own moves →</Notice>`; the `data.needsSync` banner (48–69) becomes `<Notice tone="warning" icon="exclamation-triangle" href="/connections">Your store is connected but hasn&apos;t synced yet — run your first sync to see your moves →</Notice>`.
    - `apps/web/components/SyncingBanner.tsx` — keep `'use client'`, `useRouter`, and the 4s `setInterval(router.refresh)` exactly; replace the returned `<div …>` (14–32) with `<Notice tone="info" icon="arrow-repeat" spin>Preparing your moves — pulling your store history and analyzing it. This page updates automatically.</Notice>` and delete the local `<style>` keyframes.
    - `apps/web/components/PartialHistoryNotice.tsx` — keep the `show` guard; replace the div (9–31) with `<Notice tone="warning" icon="clock-history" align="top"><span>…existing copy with its <strong>/<code> markup, unchanged…</span></Notice>`.
    - `apps/web/components/ConnectNotice.tsx` — success branch becomes `<Notice tone="success" icon="check2-circle"><span>…</span></Notice>`; error branch becomes `<Notice tone="warning" icon="exclamation-triangle" role="alert"><span>{ERRORS[error] ?? '…'}</span></Notice>`. Keep the `ERRORS` map untouched.
    - `apps/web/components/MovesList.tsx` — replace the `notice` div (82–104) with:
      ```tsx
      <Notice tone="info" icon="info-circle" role="status">
        {notice}
        <a href="/connections" style={{ marginLeft: 'auto', color: 'var(--text-link)' }}>
          Connect your store →
        </a>
      </Notice>
      ```

11. **Move `PageHeading` to `apps/web/components/PageHeading.tsx`.** Cut lines 29–73 of `apps/web/components/detail.tsx` verbatim into the new file (it needs `import type { ReactNode } from 'react'`; check whether detail.tsx still uses `ReactNode` after the cut — `ExportButton`/`MetricGrid`/`Panel`/`StatBars` do, so keep the import there too). Update the three existing consumers, which import it from `'@/components/detail'`: `customers/page.tsx:6-13`, `products/page.tsx:4`, `geography/page.tsx:5` — remove `PageHeading` from the `detail` import list and add `import { PageHeading } from '@/components/PageHeading'`.

12. **Adopt `PageHeading` on the four hand-rolled screens** (all currently render the same eyebrow+h1 at fontSize 32; sub-paragraph margins shift by a few px to PageHeading's ramp — that standardization is sanctioned):
    - `apps/web/app/monitoring/page.tsx` (24–41): `<PageHeading eyebrow="MONITORING" title="The flywheel" sub="When you apply a move, Simple Sense captures the baseline of its tracked metric and measures the lift after a 30-day window — so prescriptions get sharper with proof, not opinions." />` (the current `{30}` JSX literal is just the number 30 — inline it into the string).
    - `apps/web/app/plans/page.tsx` (35–51): `<PageHeading eyebrow="PLANS & BILLING" title="Pick your plan" sub="The free Audit is the front door. Geo + Pareto — the omnichannel wedge — live in Basic." />`.
    - `apps/web/app/connections/page.tsx` (29–42): `<PageHeading eyebrow="CONNECTIONS" title="Connect your store" />`.
    - `apps/web/app/settings/page.tsx` (16–32): `<PageHeading eyebrow="SETTINGS" title="Store settings" sub="These tell the engine which moves apply to your store. Saving re-runs the analysis." />`.
    - `apps/web/components/MovesList.tsx` (49–80): replace the header flex block with `<PageHeading eyebrow="THIS WEEK" title="Your next moves" action={applied.length > 0 ? (<span style={{ fontSize: 13, color: 'var(--ss-success)' }}><i className="bi bi-check2-circle" style={{ marginRight: 6 }} />{applied.length} applied · measuring lift</span>) : undefined} />`. The h1 goes 36→32 per the seed's "standardize to PageHeading's ramp". PageHeading has no hooks, so importing it into this `'use client'` file is fine.

13. **Create the error boundaries.** `apps/web/app/error.tsx`:

    ```tsx
    'use client'

    /** Route-level error boundary — shown instead of Next's default when a server render throws. */
    export default function ErrorPage({
      error,
      reset,
    }: {
      error: Error & { digest?: string }
      reset: () => void
    }) {
      return (
        <div
          style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}
        >
          <div style={{ maxWidth: 460, textAlign: 'center' }}>
            <p className="ss-eyebrow" style={{ margin: 0 }}>SOMETHING WENT WRONG</p>
            <h1
              style={{
                margin: '8px 0 12px',
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                letterSpacing: '-0.02em',
                color: 'var(--text-strong)',
              }}
            >
              We hit an unexpected error
            </h1>
            <p style={{ margin: '0 0 20px', color: 'var(--text-body)' }}>
              Your data is safe — this page just failed to render. Try again, or head back to
              your moves.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  background: 'var(--action-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/app"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--text-strong)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'var(--surface-card)',
                }}
              >
                Back to moves
              </a>
            </div>
            {error.digest ? (
              <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--text-muted)' }}>
                Error reference: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
      )
    }
    ```

    `apps/web/app/app/error.tsx`: same file with the copy changed to eyebrow `"DASHBOARD ERROR"`, title `"Your moves failed to load"`, body `"Nothing was lost. Try again — if it keeps happening, your last analysis is still safe on the server."`. Never render `error.message` — it can contain internal details, and inventing user-facing numbers/claims from it would violate grounding.

14. **Purge check before the gate.** Run these greps; each must come back clean as specified:
    - `grep -rn "function toCore" apps/web packages --include='*.ts'` → 0 hits.
    - `grep -rn "maximumFractionDigits" apps/web --include='*.ts' --include='*.tsx' | grep -v "lib/format.ts"` → 0 hits.
    - `grep -rn "rankScore: 'desc'" apps/web --include='*.ts' --include='*.tsx'` → 0 hits (canonical orderBy now lives only in `packages/jobs/src/analyze.ts`).
    - `grep -rn "ss-info-bg\|ss-warning-bg\|ss-success-bg" apps/web/components apps/web/app --include='*.tsx' | grep -v "Notice.tsx"` → only the settings-page "connect first" box (settings/page.tsx:44 — an inline info box, not one of the six banners; leave it) and plans' `hasCredentials` warning box if present. If unsure, leave any hit that is not one of the six sites listed in step 10.
    - `grep -rn "export function PageHeading" apps/web` → exactly 1 hit (`components/PageHeading.tsx`).
15. **Gate:** `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`. All must pass; test count goes UP from 145 (new formatter + jobs-helper tests), never down.
16. **Commit:** `refactor: consolidate formatters, toCore, top-N gating query into single definitions; add Notice + PageHeading components and route error boundaries`

## Edge cases & landmines

- **This plan collides with PLAN-dashboard-query-batching on `apps/web/lib/dashboard.ts` (lines ~80–119).** Run AFTER it. If `getDashboard()` no longer matches the snippets (e.g. queries wrapped in `Promise.all` or merged), do NOT restore the old shape — only delete the local `toCore` and swap the call to `recommendationToCore`. Dashboard keeps `latestRecommendations` + `entitledMoveIds` (gating.ts:26–33 slices `FREE_TOP_MOVES` itself); do not switch it to `topRunMoveIds`.
- **`usd` is NOT one formatter — it's two.** move-detail.ts:77–82 uses `maximumFractionDigits: v >= 1000 ? 0 : 2` (evidence rows show cents under $1,000); dashboard/audit/products use fixed `0`. The seed's "have formatMetric consume the shared usd" would be a visible behavior change — that's why step 1 ships `usdAdaptive` and step 8 wires `formatMetric` to it. TRUST THIS over the seed.
- **monitoring's `fmt` is not `int`.** monitoring/page.tsx:13 is a bare `toLocaleString()` applied to `baselineValue`/`measuredValue`/`liftValue` (lines 91–100), which are decimal metric values (rates, ratios). `int` would `Math.round` them — e.g. a 0.42 baseline would render "0". Use `num`. TRUST THIS over the seed's four-function list.
- **`days` must not round.** customers/page.tsx:19 renders `` `${v} days` `` raw; move-detail's `formatMetric` (line 100) rounds days — those are different call paths and both stay as they are. The shared `days` is the customers shape; `formatMetric` keeps its own rounding internally.
- **`topRunMoveIds` must query ALL statuses.** The gating comment at move-detail.ts:142–145 explains why: the entitled set is anchored to run rank positions, not to open moves — filtering by status would turn "Not now" into a paging cursor that leaks locked moves. Do not add a `status` filter, and keep `orderBy: [{ rankScore: 'desc' }, { id: 'asc' }]` exactly (the `id asc` tiebreak is what makes the set stable; see analyze.ts:99).
- **actions.ts and move-detail.ts gate with DIFFERENT conditions on purpose.** actions.ts:30 checks only `ent.moves === 'top'` (the demo store was already rejected at line 24 with `demo_readonly`); move-detail.ts:147 checks `!isDemo && ent.moves === 'top'` (demo is an ungated showcase for reads). Unifying them breaks either demo read access or the demo write-block.
- **`Notice` children must be direct flex children.** MovesList's trailing `<a style={{ marginLeft: 'auto' }}>` (MovesList.tsx:100) only right-aligns because it sits directly in the flex row. If you wrap `children` in a `<span>`, it silently collapses to the left.
- **SyncingBanner keeps its client shell.** SyncingBanner.tsx:1–11 is `'use client'` with a `setInterval(router.refresh, 4000)` — that's the dashboard's whole live-update mechanism while a sync runs. Only the returned JSX changes. `Notice` itself must stay hook-free so it works in both server and client components.
- **Removing `PageHeading` from detail.tsx breaks three imports.** customers/products/geography all pull it from `'@/components/detail'` in a combined import (customers/page.tsx:6–13, products/page.tsx:4, geography/page.tsx:5). Update all three or the build fails. Keep `ReactNode` imported in detail.tsx — `ExportButton`(80)/`MetricGrid`(114)/`Panel`(129) still use it.
- **`error.tsx` must be a client component** (`'use client'` first line) or the build fails. Also know its limits: a segment's `error.tsx` does not catch errors thrown in that same segment's `layout.tsx`, and the root one doesn't catch root-layout errors (that would need `global-error.tsx` — out of scope). Do not render `error.message`; only `error.digest`.
- **Banner micro-standardization is sanctioned; copy changes are not.** The six banners currently disagree on padding ('10px 14px' vs '12px 16px'), gap (8 vs 10), fontSize (13 vs 13.5), and marginBottom (18 vs 20). `Notice` standardizes to '12px 16px'/10/13.5/20. Every user-facing STRING must remain byte-identical — including the `&apos;` entity in the needsSync banner and the `<strong>`/`<code>` markup inside PartialHistoryNotice.
- **The settings "connect first" box (settings/page.tsx:42–58) and the plans Stripe-credentials warning (plans/page.tsx:52+) are NOT among the six banners.** They're contextual inline boxes with different structure. Leave them alone; converting them is scope creep.
- **onboarding/audit/moves-detail headings stay hand-rolled** (onboarding/page.tsx:62–68, audit/[slug]/page.tsx:69–75, app/moves/[id]/page.tsx:72+138–141). The audit and onboarding pages live outside `AppShell` with their own layout rhythm, and the move-detail page splits eyebrow and h1 across a two-part layout — forcing `PageHeading` there is not parity-safe. Seed scope is monitoring/plans/connections/settings + MovesList only.
- **`prettier` will reformat your new files** — run `pnpm format` before the gate, not after seeing lint fail.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass (all 145 existing tests still green, plus the new ones).
- [ ] NEW tests exist and pass: `apps/web/lib/format.test.ts` (incl. `usd(0)==='$0'`, `pct(0)==='0%'`, all-null→`'—'`, `usdAdaptive(999.5)==='$999.50'`) and `packages/jobs/test/rec-helpers.test.ts` (`recommendationToCore` field mapping + null `suggestedExecution` default; `topRunMoveIds` canonical query args + ordered ids).
- [ ] `grep -rn "function toCore" apps/web packages --include='*.ts'` → 0 hits; `grep -rn "recommendationToCore" apps/web/lib | wc -l` → 3 importing files (dashboard.ts, move-detail.ts, audit.ts).
- [ ] `grep -rn "maximumFractionDigits" apps/web --include='*.ts' --include='*.tsx' | grep -v lib/format.ts` → 0 hits.
- [ ] `grep -rn "rankScore: 'desc'" apps/web --include='*.ts' --include='*.tsx'` → 0 hits; `grep -n "rankScore" packages/jobs/src/analyze.ts` shows the only remaining orderBy definitions.
- [ ] `grep -rn "export function PageHeading" apps/web` → exactly 1 hit in `apps/web/components/PageHeading.tsx`; `grep -rln "PageHeading" apps/web/app apps/web/components` includes monitoring, plans, connections, settings pages and MovesList.tsx.
- [ ] `grep -c "ss-info-bg" apps/web/components/Notice.tsx` → 1, and none of these files still contain `ss-info-bg`: `apps/web/app/app/page.tsx`, `apps/web/components/detail.tsx`, `apps/web/components/SyncingBanner.tsx`, `apps/web/components/MovesList.tsx`.
- [ ] `test -f apps/web/app/error.tsx && test -f apps/web/app/app/error.tsx` and both files' first line is `'use client'`.
- [ ] Screen check (`pnpm --filter @ss/web dev`, signed out → demo org): `/app` shows the demo banner (info blue, links to /connections), KPI cards show the same $-and-% values as before; `/customers`, `/products`, `/geography` render headings + metrics identically; `/monitoring`, `/plans`, `/connections`, `/settings` show the same eyebrow/h1 text at fontSize 32; a move-detail page's evidence values still show cents for sub-$1,000 USD metrics.
- [ ] Behavior spot-check of gating: on a free-tier org, a direct URL to a locked move still returns the 404/refusal path, and "Not now" on a top-3 move still does NOT reveal a 4th move.

## Out of scope

- ANY change to `entitledMoveIds`/`splitOpenMoves` logic in `apps/web/lib/gating.ts`, tier entitlements, or `FREE_TOP_MOVES`'s value/location — the gating semantics move nowhere; only the duplicated Prisma query does.
- The dashboard query batching itself (separate plan, runs first). Do not add/remove queries in `getDashboard()`.
- Sidebar/AppShell responsiveness, hover/focus states, `.ss-nav-item` styling, next/font migration, muted-text contrast bump — all separate P1 UX plans.
- `global-error.tsx`, `not-found.tsx`, and per-route `loading.tsx` additions (only the two `error.tsx` files ship here).
- Converting the settings "connect first" box, plans' Stripe-credentials warning, MovesList's empty-state card, or `LockedPanel`/`LockedMovesCard` to `Notice` — they are not banners.
- Adopting `PageHeading` on onboarding, `/audit/[slug]`, or `/app/moves/[id]` (layout parity not guaranteed there).
- Touching `formatMetric`'s key-based dispatch logic in move-detail.ts (only its internal `usd` call changes to `usdAdaptive`).
- Moving `Notice`/`PageHeading` into `@ss/ui` — they depend on bootstrap-icons classes and app-layer conventions; keep them in `apps/web/components`.
- Fixing the dead `Audit` model, the `/audit/demo` slug hardcoding, GDPR webhooks, Inngest, or anything else surfaced in exploration but not in this plan's scope.
- Any copy/wording changes to banners or headings.
