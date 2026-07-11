# PLAN: Mobile-responsive app shell (icon rail / top bar under 900px)

**Rank rationale:** Merchants live on their phones, and today the app surface is unusable below ~900px: the sidebar is a fixed `16.5rem` (264px) `flex: none` column (apps/web/components/Sidebar.tsx:38-39) that always reserves 264px of a 375px viewport, and there is not a single media query anywhere in the app shell because ALL shell styling is inline `style={{}}` objects — which cannot hold media queries (the only `@media` in apps/web lives in `(marketing)/marketing.css`). This is flagged P1 at STATUS.md:11 (\"P1 UX: mobile app-shell responsiveness, hover/focus states, …\"). The fix is small and mechanical (extract the shell geometry into real CSS classes with one 900px breakpoint), touches no data paths, no tenancy, no gating, and instantly makes every screen reachable on a phone. It also fixes a latent bug for free: `className=\"ss-nav-item\"` is referenced at Sidebar.tsx:73 but no `.ss-nav-item` rule exists anywhere in the repo, so nav items currently have no hover state at all.

**Stated decision (required by the spec):** we create a NEW file `apps/web/app/app-shell.css` and import it from `apps/web/app/layout.tsx` (the root layout), NOT from `AppShell.tsx` and NOT by extending `packages/ui/src/tokens/base.css`. Reason (correction to the seed, trust exploration): `AppShell` is mounted per-page (each page imports it — there is no `/app` layout that renders it), and `apps/web/app/app/loading.tsx` renders the shell skeleton WITHOUT mounting `AppShell` — if the CSS were imported only by `AppShell.tsx`, the loading skeleton could stream before the stylesheet is present. Importing at the root layout guarantees the classes exist for both the real shell and the skeleton. We also do not touch `packages/ui` because these classes are app-chrome-specific, not design-system tokens.

**Collapse pattern (required by the spec):** ICON RAIL (56px, icons only, `title`/`aria-label` for labels, badge becomes a dot). No drawer, no JS state — the collapse is pure CSS. `Sidebar` stays a `'use client'` component only because it already uses `usePathname` for active-state.

## Goal

Below 900px viewport width: the sidebar collapses to a 56px icon rail (icons only, labels via `title` + `aria-label`, count badge becomes a dot), the topbar hides the model label and shrinks padding, `<main>` padding shrinks, and the move-detail two-column grid (`1.5fr / 1fr` + sticky rail) becomes a single column with a non-sticky rail. At ≥900px everything renders pixel-identical to today. The `loading.tsx` skeleton uses the same classes so there is no layout jump when the real shell streams in. Verified against the built app at 375px and 1280px.

## Files to touch

- `apps/web/app/app-shell.css` — NEW. All shell layout classes (`.ss-shell`, `.ss-shell-col`, `.ss-sidebar`, `.ss-brand`, `.ss-nav`, `.ss-nav-item`, `.ss-nav-icon`, `.ss-nav-label`, `.ss-nav-badge`, `.ss-sidebar-foot`, `.ss-topbar`, `.ss-topbar-model`, `.ss-main`, `.ss-move-grid`, `.ss-move-rail`) plus the single `@media (max-width: 900px)` block.
- `apps/web/app/layout.tsx` — add `import './app-shell.css'` after the existing `import './globals.css'` (line 5).
- `apps/web/components/AppShell.tsx` — replace the inline style objects on the root div, inner column div, `<header>`, model-label `<span>`, and `<main>` with the new classes; delete the replaced inline styles.
- `apps/web/components/Sidebar.tsx` — replace all inline layout styles with the new classes; add `aria-label`/`title` to nav links; split the wordmark into full/mini spans.
- `apps/web/app/app/loading.tsx` — swap the skeleton's hand-rolled aside/topbar/main inline dimensions for the same shell classes so the skeleton collapses identically.
- `apps/web/app/app/moves/[id]/page.tsx` — extract the two-column grid (lines 152-159) and the sticky right rail (line 234) to `.ss-move-grid` / `.ss-move-rail`.
- `apps/web/lib/app-shell-css.test.ts` — NEW vitest test asserting the CSS contract (breakpoint exists, tokens referenced, hover rule present). The root `vitest.config.ts` includes `{packages,apps}/**/*.{test,spec}.{ts,tsx}`, so this file is picked up automatically (existing tests like `gating.test.ts` already live in `apps/web/lib`).

## Implementation order

1. **Create `apps/web/app/app-shell.css`** with exactly this content (values transcribed 1:1 from the current inline styles at AppShell.tsx:28-43/93-105 and Sidebar.tsx:36-116, except the three hardcoded dimensions now reference the tokens that already exist at packages/ui/src/tokens/spacing.css:34-36):

```css
/*
 * App shell layout — the ONLY place shell geometry lives.
 * Inline styles cannot hold media queries; these classes can.
 * Breakpoint: 900px → 56px icon rail + compact topbar/main.
 * Imported by app/layout.tsx AFTER globals.css.
 */

.ss-shell {
  display: flex;
  min-height: 100dvh;
  background: var(--surface-page);
}

.ss-shell-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* --- Sidebar --- */
.ss-sidebar {
  width: var(--sidebar-width);
  flex: none;
  border-right: 1px solid var(--border-hairline);
  background: var(--surface-card);
  height: 100dvh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  gap: 6px;
}

.ss-brand {
  display: block;
  padding: 6px 10px 18px;
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: -0.01em;
  color: var(--text-strong);
  text-decoration: none;
}
.ss-brand:hover {
  color: var(--text-strong);
  text-decoration: none;
}
.ss-brand-mini {
  display: none;
}

.ss-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ss-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 11px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-body);
  text-decoration: none;
}
.ss-nav-item:hover {
  background: var(--surface-soft);
  color: var(--text-body);
  text-decoration: none;
}
.ss-nav-item[aria-current='page'] {
  font-weight: 600;
  color: var(--text-strong);
  background: var(--surface-soft);
}
.ss-nav-icon {
  font-size: 17px;
  color: var(--text-muted);
}
.ss-nav-item[aria-current='page'] .ss-nav-icon {
  color: var(--action-primary);
}
.ss-nav-label {
  flex: 1;
  min-width: 0;
}
.ss-nav-badge {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-onbrand);
  background: var(--action-primary);
  border-radius: var(--radius-pill);
  padding: 1px 8px;
}
.ss-sidebar-foot {
  margin-top: auto;
  padding: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

/* --- Topbar --- */
.ss-topbar {
  height: var(--topbar-height);
  flex: none;
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid var(--border-hairline);
  background: color-mix(in srgb, var(--surface-card) 92%, transparent);
  backdrop-filter: blur(10px);
}
.ss-topbar-model {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* --- Main --- */
.ss-main {
  flex: 1;
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 32px 28px 64px;
}

/* --- Move-detail two-column layout (app/moves/[id]) --- */
.ss-move-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.ss-move-rail {
  display: grid;
  gap: 20px;
  position: sticky;
  top: 88px;
  min-width: 0;
}

/* ---------- Under 900px: icon rail + compact chrome ---------- */
@media (max-width: 900px) {
  .ss-sidebar {
    width: 56px;
    padding: 14px 6px;
    gap: 4px;
  }
  .ss-brand {
    padding: 2px 0 14px;
    text-align: center;
    font-size: 20px;
  }
  .ss-brand-full {
    display: none;
  }
  .ss-brand-mini {
    display: inline;
  }
  .ss-nav-item {
    justify-content: center;
    gap: 0;
    padding: 10px 0;
  }
  .ss-nav-label {
    display: none;
  }
  .ss-nav-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
    overflow: hidden;
    font-size: 0;
    color: transparent;
  }
  .ss-sidebar-foot {
    display: none;
  }
  .ss-topbar {
    padding: 0 14px;
  }
  .ss-topbar-model {
    display: none;
  }
  .ss-main {
    padding: 20px 14px 48px;
  }
  .ss-move-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .ss-move-rail {
    position: static;
  }
}
```

2. **Import it in `apps/web/app/layout.tsx`.** After line 5 (`import './globals.css'`) add:

```ts
import './app-shell.css'
```

Do NOT import it in `AppShell.tsx` or any component — root layout only (see Edge cases #1).

3. **Rewrite `apps/web/components/Sidebar.tsx`'s JSX** (keep lines 1-31 — the `'use client'` directive, imports, `NavItem`, `navItems`, `isActive` — completely unchanged). Replace the `Sidebar` function body (lines 33-119) with:

```tsx
export function Sidebar({ openMoves }: { openMoves: number }) {
  const pathname = usePathname() ?? ''
  return (
    <aside className="ss-sidebar">
      <div>
        <Link href="/app" className="ss-brand" aria-label="Simple Sense">
          <span className="ss-brand-full">Simple Sense</span>
          <span className="ss-brand-mini" aria-hidden="true">
            S
          </span>
        </Link>
      </div>
      <nav className="ss-nav">
        {navItems(openMoves).map((it) => {
          const active = isActive(pathname, it.href)
          return (
            <Link
              key={it.label}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              aria-label={it.label}
              title={it.label}
              className="ss-nav-item"
            >
              <i className={`bi bi-${it.icon} ss-nav-icon`} aria-hidden="true" />
              <span className="ss-nav-label">{it.label}</span>
              {it.badge ? <span className="ss-nav-badge">{it.badge}</span> : null}
            </Link>
          )
        })}
      </nav>
      <div className="ss-sidebar-foot">Operator co-pilot</div>
    </aside>
  )
}
```

Every inline `style={{}}` in the old body is deleted — the classes carry identical values. Note the wrapping `<div>` around the brand `Link` replaces the old padded div (old line 51); the padding moved onto `.ss-brand` itself. The `aria-label=\"Simple Sense\"` on the brand `Link` is REQUIRED, not decorative: under 900px `.ss-brand-full` is `display: none` (removed from the accessibility tree) and `.ss-brand-mini` is `aria-hidden`, so without the label the link would have no accessible name.

4. **Edit `apps/web/components/AppShell.tsx`.** Five surgical replacements, deleting the inline styles being replaced:
   - Root div (line 93): `<div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--surface-page)' }}>` → `<div className="ss-shell">`
   - Inner column div (line 95): `<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>` → `<div className="ss-shell-col">`
   - `<header style={{ ...12 properties... }}>` (lines 28-43 in `Topbar`) → `<header className="ss-topbar">`
   - Model-label span (line 76): `<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>` → `<span className="ss-topbar-model">`
   - `<main style={{ flex: 1, width: '100%', maxWidth: 1500, margin: '0 auto', padding: '32px 28px 64px' }}>` (lines 97-105) → `<main className="ss-main">`

   Leave everything else in the file untouched: the `PILL` map, the store-name span with its `overflow: hidden / textOverflow: ellipsis / whiteSpace: nowrap` inline styles (lines 46-57 — already correct, ellipsizing needs no media query because its parent has `minWidth: 0` at line 44), the pill span, the `UserButton`, and `getShellContext`.

5. **Edit `apps/web/app/app/loading.tsx`** so the skeleton mirrors the responsive shell (currently it duplicates the fixed geometry: aside `width: '16.5rem'` at line 16, topbar `height: '4rem'` at line 32, `maxWidth: 1500` at line 33):
   - Root div (line 11) → `<div className="ss-shell">` (delete its style object).
   - `<aside style={{ ...8 properties... }}>` (lines 14-25) → `<aside className="ss-sidebar" style={{ gap: 12 }}>` (keep only the gap override for skeleton-bar rhythm; width/border/background/padding/flex now come from the class — note the skeleton's old `24px 18px` padding becomes the shell's real `20px 14px`, which is the point: the skeleton must match the shell).
   - Inner div (line 31): `<div style={{ flex: 1, minWidth: 0 }}>` → `<div className="ss-shell-col">`
   - Topbar placeholder (line 32): `<div style={{ height: '4rem', borderBottom: '1px solid var(--border-hairline)' }} />` → `<div className="ss-topbar" />`
   - `<main style={{ maxWidth: 1500, margin: '0 auto', padding: '32px 28px' }}>` (line 33) → `<main className="ss-main">`

   Keep the `bar()` helper, the `ss-pulse` `<style>` tag, and the auto-fit card grid exactly as they are (the `repeat(auto-fit, minmax(220px, 1fr))` grid at line 39 is already responsive).

6. **Edit `apps/web/app/app/moves/[id]/page.tsx`.** Two replacements:
   - The outer grid div (lines 152-159): `<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>` → `<div className="ss-move-grid">`
   - The right-rail div (line 234): `<div style={{ display: 'grid', gap: 20, position: 'sticky', top: 88, minWidth: 0 }}>` → `<div className="ss-move-rail">`

   Do NOT touch the left-column div (line 161, `display: 'grid', gap: 20, minWidth: 0` — no breakpoint needed), the `Ring`, `Panel`, or anything else in the file.

7. **Add `apps/web/lib/app-shell-css.test.ts`** — a contract test (4 tests) that keeps the breakpoint and token usage from silently regressing:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../app/app-shell.css', import.meta.url), 'utf8')

describe('app-shell.css responsive contract', () => {
  it('has exactly one 900px breakpoint block', () => {
    expect(css.match(/@media \(max-width: 900px\)/g)).toHaveLength(1)
  })

  it('references layout tokens instead of hardcoding shell dimensions', () => {
    expect(css).toContain('var(--sidebar-width)')
    expect(css).toContain('var(--topbar-height)')
    expect(css).toContain('var(--container-max)')
    expect(css).not.toContain('16.5rem')
    expect(css).not.toContain('1500')
  })

  it('defines the previously-missing .ss-nav-item hover state', () => {
    expect(css).toContain('.ss-nav-item:hover')
  })

  it('collapses to an icon rail and single-column move grid under the breakpoint', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 900px)'))
    expect(mobile).toContain('width: 56px')
    expect(mobile).toMatch(/\.ss-nav-label\s*\{\s*display: none/)
    expect(mobile).toMatch(/\.ss-move-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/)
    expect(mobile).toMatch(/\.ss-move-rail\s*\{\s*position: static/)
  })
})
```

8. **Run the gate:** `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`. All must pass — 149 tests total (the 145 existing, verified green today across 27 files, plus the 4 new tests above). Note `pnpm format` (prettier) may normalize the CSS quotes (`[aria-current='page']` → `\"page\"`); none of the test assertions depend on quote style.

9. **Visual verification against the built app** (not dev mode): `pnpm --filter @ss/web start` (after the build from step 8), open `http://localhost:3000` in a browser. Check `/` and `/app` with the viewport at 375px and at 1280px per the Acceptance criteria below. Then stop the server.

10. **Commit** with message: `feat: mobile-responsive app shell — 56px icon rail under 900px, single-column move detail (P1 audit)`

## Edge cases & landmines

- **`loading.tsx` renders WITHOUT `AppShell`** (apps/web/app/app/loading.tsx is a self-contained skeleton — it never imports `AppShell`; `AppShell` itself is only mounted per-page, not by any layout). This is why the CSS import goes in `app/layout.tsx` (root), not `AppShell.tsx` as the original seed suggested: root-layout CSS is guaranteed present when the skeleton streams. Correction to the seed; trust this.
- **Inline styles beat class rules.** If the executor adds `className` but forgets to DELETE the corresponding `style={{}}` object, the media query will silently never apply (inline `width: '16.5rem'` outranks any stylesheet). Every replacement in steps 3-6 must remove the inline style, not add alongside it.
- **`globals.css` underlines all links on hover** (`a:hover { text-decoration: underline }`, apps/web/app/globals.css:15-17). Today the nav links' inline `textDecoration: 'none'` suppresses it; once styling moves to classes, `.ss-nav-item:hover` and `.ss-brand:hover` MUST re-declare `text-decoration: none` (they do in the CSS above — `.ss-nav-item:hover` at specificity 0,2,0 beats `a:hover` at 0,1,1). Same for the color: `base.css` sets `a:hover { color: var(--action-primary-active) }` (packages/ui/src/tokens/base.css:37-39), so both hover rules also pin `color` explicitly.
- **`.ss-nav-item` has no existing CSS rule despite the className.** Sidebar.tsx:73 already carries `className="ss-nav-item"` but grep across apps + packages finds zero matching CSS. Do not go hunting for an existing rule to extend — this plan creates it (and gains the missing hover state as a side effect).
- **`display: none` removes the labels from the accessibility tree.** Under 900px `.ss-nav-label` is `display: none`, so the `Link` would have no accessible name from content. That is why step 3 puts `aria-label={it.label}` AND `title={it.label}` on every nav `Link` unconditionally (identical text, so desktop semantics are unchanged — the only visible desktop difference is native `title` tooltips on hover, which is intended).
- **The brand link has the same accessible-name trap.** Under 900px `.ss-brand-full` is `display: none` and `.ss-brand-mini` is `aria-hidden` — without the `aria-label="Simple Sense"` on the brand `Link` (step 3) it would have no accessible name at mobile widths. Do not drop it.
- **Keep `100dvh` + `position: sticky` on the sidebar** (Sidebar.tsx:42-44 → now `.ss-sidebar`). `100dvh` is the correct unit for iOS Safari's collapsing URL bar. Do not "fix" it to `100vh` or `100%`.
- **The layout tokens already exist but were never used:** `--sidebar-width: 16.5rem`, `--topbar-height: 4rem`, `--container-max: 1500px` at packages/ui/src/tokens/spacing.css:34-36. The new CSS references them; do NOT redefine them and do NOT edit spacing.css. (`maxWidth: 1500` in AppShell.tsx:101 was a raw number — it becomes `max-width: var(--container-max)`.)
- **The badge dot trick:** under 900px `.ss-nav-badge` becomes an absolutely-positioned 8px dot with `font-size: 0; color: transparent; overflow: hidden` — the count text stays in the DOM (screen readers ignore it since the Link has an `aria-label`). This requires `position: relative` on `.ss-nav-item`'s BASE rule (it's there), not just inside the media query.
- **Don't touch the store-name ellipsis or the sync pill in `Topbar`** — the span at AppShell.tsx:46-57 already ellipsizes correctly because its flex parent has `minWidth: 0` (line 44). Only the model label (line 76) gets a class, because hiding it needs a media query.
- **`MetricGrid` and the auto-fit card grids need NO changes** — they use `repeat(auto-fit, minmax(...))` (components/detail.tsx:119, app/page.tsx:74, plans/page.tsx:73, audit/[slug]/page.tsx:100, loading.tsx:39). Two page-level grids hardcode fixed columns: the move-detail grid at moves/[id]/page.tsx:152-159 (in scope — its sticky rail breaks on mobile) and the customers Pareto grid at customers/page.tsx:86 (`minmax(0, 1.4fr) minmax(0, 1fr)`). The customers grid is deliberately DEFERRED: it cannot cause horizontal overflow (both tracks are `minmax(0, …)` and `ParetoChart` renders a `width="100%"` viewBox SVG, packages/ui/src/components/ParetoChart.tsx:44-46) — it merely gets cramped, and it sits behind `detailLocked` gating; see Out of scope.
- **Viewport meta tag:** Next.js App Router injects `width=device-width, initial-scale=1` by default — `layout.tsx` correctly has no manual viewport tag. Do not add one.
- **`Sidebar` stays `'use client'`** (Sidebar.tsx:1) — it needs `usePathname` for `aria-current`. The icon-rail collapse itself is pure CSS; add no state, no toggle button, no `useState`.
- **`marketing.css` is untouched.** The `(marketing)` route group has its own stylesheet and its own responsive story; this plan covers only the app chrome.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass — 149 tests green (145 existing + the 4 new tests in `apps/web/lib/app-shell-css.test.ts`).
- [ ] `grep -c 'style={{' apps/web/components/Sidebar.tsx` returns 0 — no inline styles remain in the sidebar.
- [ ] `grep -n '16.5rem\|maxWidth: 1500' apps/web/components/AppShell.tsx apps/web/components/Sidebar.tsx apps/web/app/app/loading.tsx` returns no matches — all hardcoded shell dimensions are gone from the TSX.
- [ ] `grep -n "import './app-shell.css'" apps/web/app/layout.tsx` returns exactly one match, positioned after the `./globals.css` import.
- [ ] `grep -c '@media' apps/web/app/app-shell.css` returns 1 (single 900px block).
- [ ] Built app at **1280px** (`pnpm --filter @ss/web start`, browser at 1280px width): `/` (marketing home) renders unchanged; `/app` shows the full 16.5rem sidebar with text labels, the count badge as a numbered pill, the model label in the topbar, and the sidebar nav items now show a `--surface-soft` background on hover.
- [ ] Built app at **375px**: `/` renders without horizontal scroll; `/app` shows a 56px icon rail (icons only, no text labels), the "S" mini wordmark, the open-moves badge as a small dot at the top-right of the first nav item, NO model label in the topbar, the store name ellipsized, and **no horizontal scrollbar** (`document.documentElement.scrollWidth === document.documentElement.clientWidth` in the console).
- [ ] Built app at **375px**, a move-detail page (`/app/moves/<any-id>` from the demo store): the evidence/impact columns stack in a single column, the right rail is not sticky, no horizontal scroll.
- [ ] At 375px, hovering (or inspecting) a rail icon shows the nav label via the native `title` tooltip, and each nav link exposes `aria-label` (verify in devtools accessibility pane); the brand link exposes `aria-label="Simple Sense"`.
- [ ] Navigate to `/app` with devtools network throttling at 375px: the loading skeleton shows the same 56px rail width as the loaded shell — no width jump when content streams in.
- [ ] `aria-current="page"` still lights the correct nav item at both widths (icon turns `--action-primary` at 375px).

## Out of scope

- **No drawer / hamburger / open-close state.** The icon rail is the chosen pattern; adding JS toggle state is explicitly rejected.
- **No changes to `packages/ui`** — no new tokens, no edits to base.css/spacing.css/colors.css, no new exported components.
- **The customers Pareto grid (customers/page.tsx:86) keeps its fixed two columns for now** — it cannot overflow (`minmax(0, …)` tracks + `width="100%"` SVG chart), only cramps at phone widths, and is gated behind paid `detailLocked` anyway; give it a single-column breakpoint in a follow-up page-polish slice, not in the shell slice.
- **No banner/formatter/toCore/gating dedup** — the duplication catalogued in exploration (DemoBanner clones, `usd`/`pct` re-declarations, three `toCore` copies, FREE top-N query triplication) is real but belongs to separate plans.
- **No PageHeading consolidation, no font-size responsive scaling** of the hand-rolled 32px/40px h1s — typography tuning is a different slice; only the shell geometry and the one move-detail grid change.
- **No `next/font` migration, no error.tsx/not-found.tsx additions, no muted-text contrast fix** — all known issues, all separate plans.
- **No marketing-surface changes** — `(marketing)` pages and `marketing.css` are untouched.
- **No touch-target/gesture work** beyond what the rail gives for free; no e2e/screenshot test infrastructure (manual viewport checks per the AC are the verification).
