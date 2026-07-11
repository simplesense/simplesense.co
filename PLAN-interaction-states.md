# PLAN: Interaction states + visual baseline — shared button/nav classes, focus-visible, next/font, contrast

**Rank rationale:** The entire app layer is styled with inline `style={{}}` objects, which physically cannot express `:hover`/`:active`/`:focus` — so a LIVE SaaS currently has zero hover feedback on its sidebar nav, upgrade CTAs, export buttons, and move-list actions (P1 audit finding). At the same time fonts render-block via three Google `<link>` tags (layout.tsx:37-42) and the muted-text token fails WCAG AA (~3.9:1). All four fixes share one mechanism — a tiny CSS class layer in @ss/ui plus token edits — so one slice removes the biggest perceived-quality gap per line of code changed, touches no business logic, and creates the class vocabulary every later UI slice will reuse.

## Goal

Every high-traffic interactive element (sidebar nav items, UpgradeLink, ExportButton, MovesList \"See the evidence\"/\"Not now\") has visible hover/active feedback driven by existing design tokens; keyboard focus shows a consistent 2px blue outline app-wide; the three Google Fonts load through `next/font/google` (self-hosted, no render-blocking third-party request) while every existing `var(--font-*)` consumer keeps working unchanged; muted text passes WCAG AA 4.5:1; and animations respect `prefers-reduced-motion`. No behavior, routing, gating, or data change.

## Files to touch

- `packages/ui/src/components.css` — NEW: `.ss-btn-primary`, `.ss-btn-ghost`, `.ss-nav-item`, `.ss-link`, `.ss-link--muted` component classes with hover/active states built from existing tokens.
- `packages/ui/src/styles.css` — add `@import './components.css';` after the token imports; update the now-stale header comment (fonts move from Google Fonts links to next/font).
- `packages/ui/src/tokens/base.css` — replace the existing box-shadow `:focus-visible` rule (lines 41-45) with the 2px outline ring; add a global `prefers-reduced-motion` guard.
- `packages/ui/src/tokens/colors.css` — darken `--ss-muted` from `#837a68` to `#6d6455` (line 37 only; aliases at lines 64 and 87 inherit).
- `packages/ui/src/tokens/typography.css` — rewrite `--font-display` / `--font-ui-display` / `--font-sans` (lines 9-12) to consume next/font variables with the current families as `var()` fallbacks.
- `apps/web/app/layout.tsx` — replace the three Google Fonts `<link>` tags with `next/font/google` (Instrument_Serif 400 normal+italic, Manrope variable, Inter variable); keep the Bootstrap Icons `<link>`.
- `apps/web/components/Sidebar.tsx` — remove the inline `background` from nav-item styles so the new `.ss-nav-item` hover/active CSS can take effect.
- `apps/web/components/locked.tsx` — migrate `UpgradeLink` (lines 8-29) to `className=\"ss-btn-primary\"`.
- `apps/web/components/detail.tsx` — migrate `ExportButton` (lines 80-112) to `className=\"ss-btn-ghost\"` keeping only locked-variant overrides inline.
- `apps/web/components/MovesList.tsx` — migrate \"See the evidence\" anchor and \"Not now\" button to `.ss-link` / `.ss-link ss-link--muted`.
- `apps/web/lib/visual-baseline.test.ts` — NEW vitest file asserting the CSS layer and layout.tsx font migration (root `vitest run` discovers `{packages,apps}/**/*.{test,spec}.{ts,tsx}`; there is no per-app vitest config).

## Implementation order

1. **Create `packages/ui/src/components.css`** with exactly this content (values transcribed from the current inline styles in locked.tsx:8-29, detail.tsx:80-112, Sidebar.tsx:74-85, MovesList.tsx:142-165 — do not invent new visuals):

   ```css
   /* ============================================================
      SimpleSense — shared component classes for interactive elements.
      Inline style objects cannot express :hover/:active/:focus states,
      so stateful interactive elements get classes here. Tokens only.
      ============================================================ */

   /* Solid pill CTA (UpgradeLink, primary actions) */
   .ss-btn-primary {
     display: inline-flex;
     align-items: center;
     gap: 8px;
     background: var(--action-primary);
     color: var(--text-onbrand);
     border-radius: var(--radius-pill);
     padding: 9px 18px;
     font-size: 13.5px;
     font-weight: var(--fw-semibold);
     text-decoration: none;
     cursor: pointer;
     box-shadow: var(--shadow-inset-glint), var(--shadow-sm);
     transition: background var(--dur-fast) var(--ease-out);
   }
   .ss-btn-primary:hover {
     background: var(--action-primary-hover);
     color: var(--text-onbrand);
     text-decoration: none;
   }
   .ss-btn-primary:active {
     background: var(--action-primary-active);
   }

   /* Outlined pill secondary (ExportButton) */
   .ss-btn-ghost {
     display: inline-flex;
     align-items: center;
     gap: 8px;
     font-size: 13.5px;
     font-weight: var(--fw-semibold);
     color: var(--text-strong);
     background: var(--surface-card);
     border: 1px solid var(--border-strong);
     border-radius: var(--radius-pill);
     padding: 9px 16px;
     text-decoration: none;
     cursor: pointer;
     transition: background var(--dur-fast) var(--ease-out);
   }
   .ss-btn-ghost:hover {
     background: var(--surface-soft);
     color: var(--text-strong);
     text-decoration: none;
   }

   /* Sidebar nav rows — Sidebar.tsx already emits className=\"ss-nav-item\"
      and aria-current=\"page\" on the active row; no rule existed until now. */
   .ss-nav-item {
     transition: background var(--dur-fast) var(--ease-out);
   }
   .ss-nav-item:hover {
     background: var(--surface-soft);
     text-decoration: none;
   }
   .ss-nav-item[aria-current='page'] {
     background: var(--surface-soft);
   }

   /* Inline text links / quiet text buttons */
   .ss-link {
     color: var(--text-link);
     text-decoration: none;
   }
   .ss-link:hover {
     color: var(--action-primary-active);
     text-decoration: underline;
   }
   /* Muted modifier MUST come after .ss-link:hover (equal specificity — order decides). */
   .ss-link--muted {
     color: var(--text-muted);
   }
   .ss-link--muted:hover {
     color: var(--text-strong);
   }
   ```

   Notes: (a) there is deliberately no `.ss-btn-ghost:active` / no `--surface-hover` — colors.css defines no secondary-active or surface-hover token (verified negative), and inventing colors is out of scope. (b) `.ss-btn-primary` has NO border — the current UpgradeLink inline styles have none, and adding even a transparent 1px border would grow the pill 2px per axis. (c) Both button `:hover` rules re-declare `color` on purpose — see the anchor-hover landmine below.

2. **Register the file** in `packages/ui/src/styles.css` — after line 10 (`@import './tokens/base.css';`) add:

   ```css
   @import './components.css';
   ```

   Also fix the header comment (lines 2-5): it currently says \"Fonts are loaded by the app shell (Google Fonts) rather than the bundle's local-Inter fonts.css\" — after step 6 that is false. Change the parenthetical to \"(next/font, self-hosted)\".

3. **Fix `:focus-visible` in `packages/ui/src/tokens/base.css`.** A rule ALREADY exists at lines 41-45 (seed said \"add a global ring\" — correction: replace the existing one). Change:

   ```css
   :focus-visible {
     outline: none;
     box-shadow: var(--focus-ring);
     border-radius: var(--radius-xs);
   }
   ```

   to:

   ```css
   :focus-visible {
     outline: 2px solid var(--ss-blue-500);
     outline-offset: 2px;
   }
   ```

   This also removes the `border-radius: var(--radius-xs)` line, which was mutating element geometry on focus (a pill button snapped to 6px radius when tabbed to). Leave the `--focus-ring` token defined in colors.css:76 — do not delete tokens.

4. **Add the reduced-motion guard** at the end of `packages/ui/src/tokens/base.css`:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

   The `!important` is required: SyncingBanner's spin (apps/web/components/SyncingBanner.tsx:28) and loading.tsx's `ss-pulse` (apps/web/app/app/loading.tsx:8,52,66) are inline `style` animations, and only `!important` stylesheet declarations beat inline styles. Do not edit SyncingBanner or loading.tsx themselves.

5. **Contrast bump** in `packages/ui/src/tokens/colors.css` line 37 — change:

   ```css
   --ss-muted: #837a68; /* muted text / captions */
   ```

   to:

   ```css
   --ss-muted: #6d6455; /* muted text / captions — AA: 5.7:1 on paper, 5.1:1 on cream */
   ```

   Touch ONLY line 37. `--text-muted` (line 64) and `--athena-muted` (line 87) are `var(--ss-muted)` aliases and update automatically. Do not change `--ss-ink-soft` or `--ss-ink`.

6. **next/font in `apps/web/app/layout.tsx`.** Above the existing imports add:

   ```tsx
   import { Instrument_Serif, Manrope, Inter } from 'next/font/google'

   const instrumentSerif = Instrument_Serif({
     weight: '400', // Instrument Serif is NOT a variable font — weight is required
     style: ['normal', 'italic'],
     subsets: ['latin'],
     variable: '--font-instrument-serif',
     display: 'swap',
   })
   const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
   const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
   ```

   Change line 34 from `<html lang=\"en\">` to:

   ```tsx
   <html lang=\"en\" className={`${instrumentSerif.variable} ${manrope.variable} ${inter.variable}`}>
   ```

   Delete lines 36-42 (the fonts comment, the two `<link rel=\"preconnect\">` tags, and the fonts.googleapis.com stylesheet `<link>`). KEEP lines 43-44 — the Bootstrap Icons comment and `<link rel=\"stylesheet\" href=\"/vendor/bootstrap-icons/font/bootstrap-icons.min.css\" />` — untouched. If the `<head>` becomes otherwise empty it still must remain to host the icons link.

7. **Wire the font variables into the tokens** — `packages/ui/src/tokens/typography.css` lines 9-12, replace:

   ```css
   --font-display: 'Instrument Serif', Georgia, 'Times New Roman', serif;
   --font-ui-display:
     'Manrope', 'Inter', system-ui, sans-serif; /* in-product display & labels (CRM / app UI) — never marketing display */
   --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
   ```

   with:

   ```css
   --font-display: var(--font-instrument-serif, 'Instrument Serif'), Georgia, 'Times New Roman', serif;
   --font-ui-display:
     var(--font-manrope, 'Manrope'), var(--font-inter, 'Inter'), system-ui,
     sans-serif; /* in-product display & labels (CRM / app UI) — never marketing display */
   --font-sans: var(--font-inter, 'Inter'), system-ui, -apple-system, 'Segoe UI', sans-serif;
   ```

   Leave `--font-mono` (line 13) alone. This is a deliberate correction to the seed (see landmines): next/font gets its OWN variable names and the existing token names consume them, so every `var(--font-display)` / `var(--font-sans)` / `var(--font-ui-display)` consumer across the repo keeps working with zero further edits.

8. **Migrate Sidebar** (`apps/web/components/Sidebar.tsx`). In the nav-item `<Link>` style object (lines 74-85), delete the line `background: active ? 'var(--surface-soft)' : 'transparent',`. That is the whole edit — the `className=\"ss-nav-item\"` and `aria-current` already exist (lines 72-73) and now match the new CSS. Keep `fontWeight`, `color`, `borderRadius`, and everything else inline as-is.

9. **Migrate UpgradeLink** (`apps/web/components/locked.tsx` lines 8-29). Replace the whole `<a href=\"/plans\" style={{...}}>` with:

   ```tsx
   <a href=\"/plans\" className=\"ss-btn-primary\">
     {children}
   </a>
   ```

   No inline style remains on this element. Do not touch `LockedPanel`/`LockedMovesCard` markup otherwise.

10. **Migrate ExportButton** (`apps/web/components/detail.tsx` lines 80-112). Replace the `<a>` with:

    ```tsx
    <a
      href={locked ? '/plans' : href}
      download={locked ? undefined : true}
      title={locked ? 'Segment exports are a Basic feature' : undefined}
      className=\"ss-btn-ghost\"
      style={locked ? { color: 'var(--text-muted)', borderStyle: 'dashed' } : undefined}
    >
    ```

    Body (`<i className={...} />` and label ternary) unchanged. The class supplies layout/hover; only the locked-variant deltas stay inline (inline beats class, which is exactly what the locked look needs — including on hover, where the inline `color` outranks every stylesheet `:hover` color).

11. **Migrate MovesList actions** (`apps/web/components/MovesList.tsx` lines 142-165). \"See the evidence\" anchor: add `className=\"ss-link\"` and remove `color: 'var(--text-link)'` and `textDecoration: 'none'` from its style object (keep `fontSize: 12.5` and `padding: '4px 6px'`). \"Not now\" button: add `className=\"ss-link ss-link--muted\"` and remove `color: 'var(--text-muted)'` from its style object (keep `background: 'none'`, `border: 'none'`, `cursor: 'pointer'`, `fontSize: 12.5`, `padding: '4px 6px'` — these are button-appearance resets, not stateful styles). Do not touch the notice banner (lines 82-104) or `MoveCard`.

12. **Add the new test file** `apps/web/lib/visual-baseline.test.ts`:

    ```ts
    import { describe, expect, it } from 'vitest'
    import { readFileSync } from 'node:fs'
    import { fileURLToPath } from 'node:url'

    const read = (rel: string) =>
      readFileSync(fileURLToPath(new URL(`../../../${rel}`, import.meta.url)), 'utf8')

    describe('visual baseline: component classes, focus ring, fonts, contrast', () => {
      it('components.css defines the shared interactive classes with hover states', () => {
        const css = read('packages/ui/src/components.css')
        for (const sel of [
          '.ss-btn-primary:hover',
          '.ss-btn-primary:active',
          '.ss-btn-ghost:hover',
          '.ss-nav-item:hover',
          '.ss-link:hover',
          '.ss-link--muted',
        ])
          expect(css).toContain(sel)
        expect(read('packages/ui/src/styles.css')).toContain(\"@import './components.css'\")
      })

      it('base.css uses an outline focus ring and guards reduced motion', () => {
        const css = read('packages/ui/src/tokens/base.css')
        expect(css).toContain('outline: 2px solid var(--ss-blue-500)')
        expect(css).toContain('outline-offset: 2px')
        expect(css).toContain('prefers-reduced-motion')
        expect(css).not.toContain('box-shadow: var(--focus-ring)')
      })

      it('muted token passes AA (darkened) and aliases are untouched', () => {
        const css = read('packages/ui/src/tokens/colors.css')
        expect(css).toContain('--ss-muted: #6d6455')
        expect(css).toContain('--text-muted: var(--ss-muted)')
      })

      it('layout.tsx uses next/font and no Google Fonts <link>', () => {
        const layout = read('apps/web/app/layout.tsx')
        expect(layout).toContain(\"from 'next/font/google'\")
        expect(layout).not.toContain('fonts.googleapis.com')
        expect(layout).toContain('bootstrap-icons.min.css') // icon font must survive
      })

      it('typography tokens consume the next/font variables with fallbacks', () => {
        const css = read('packages/ui/src/tokens/typography.css')
        expect(css).toContain(\"var(--font-instrument-serif, 'Instrument Serif')\")
        expect(css).toContain(\"var(--font-inter, 'Inter')\")
        expect(css).toContain(\"var(--font-manrope, 'Manrope')\")
      })
    })
    ```

13. **Verification gate** (run from repo root; all must pass):

    ```sh
    pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
    ```

    `pnpm test` should now report 150 tests (145 existing + 5 new). The `@ss/web build` step downloads the three Google font families at build time (network required once; cached afterward).

14. **Manual smoke check** (dev server, `/app` route): hover a sidebar item → background turns `--surface-soft`; hover \"Unlock with Basic\" → darker blue; hover an export button → soft background, NO underline, text stays `--text-strong` (not blue); Tab through the page → 2px blue outline with 2px offset on every focused element; DevTools Network tab → zero requests to `fonts.googleapis.com`/`fonts.gstatic.com`; headings still render in Instrument Serif (view `/app` and one marketing page `/`).

15. **Commit** with message:

    ```
    feat: interaction states + visual baseline — shared button/nav classes, focus-visible ring, next/font, AA contrast
    ```

## Edge cases & landmines

- **Inline styles silently defeat class hover rules.** Sidebar.tsx:83 sets `background:` inline; MovesList.tsx:146 and 160 set `color:` inline. A `:hover` rule in a stylesheet can NEVER override an inline declaration of the same property. If you add the classes but skip removing those inline properties (steps 8 and 11), everything compiles, nothing errors, and hover still does nothing. The property removals are the load-bearing part of the migration.
- **`:focus-visible` already exists — replace, don't duplicate.** The seed says \"add a GLOBAL :focus-visible ring\", but `packages/ui/src/tokens/base.css:41-45` already has one (box-shadow based, plus a `border-radius: var(--radius-xs)` that visibly reshapes pill buttons on focus). Adding a second rule creates an order-dependent conflict. Edit the existing rule in place (step 3).
- **next/font var names must NOT be the existing token names (correction to the seed).** typography.css:9-12 defines `--font-display`/`--font-sans`/`--font-ui-display` on `:root`. If next/font's `variable:` option reused those exact names, the injected font class on `<html>` and the `:root` declaration would fight (equal-ish specificity, winner decided by unstable injection order between framework CSS and the `@ss/ui/styles.css` import) — on a loss, the whole app silently falls back to Georgia/system-ui. Instead next/font exposes `--font-instrument-serif`/`--font-manrope`/`--font-inter` and typography.css consumes them via `var(--x, 'Family')` fallbacks (step 7). Token names seen by all consumers stay identical; nothing else in the repo needs editing (grep confirms zero prior `next/font` usage).
- **`Instrument_Serif` is a static font** — `next/font/google` throws at build time unless `weight: '400'` is passed explicitly. Manrope and Inter are variable fonts; omit `weight` for them.
- **Do NOT touch the Bootstrap Icons `<link>`** (layout.tsx:44). It is a locally vendored icon webfont under `/public`; next/font cannot serve it and every `bi bi-*` glyph in the app dies if it's removed.
- **TWO global anchor-hover rules restyle every `<a>` — the button classes must re-declare both properties in their `:hover` rules.** `apps/web/app/globals.css:15-17` sets `a:hover { text-decoration: underline }`, and `packages/ui/src/tokens/base.css:37-39` sets `a:hover { color: var(--action-primary-active) }`. Both are `a:hover` (0,1,1), which beats a bare class declaration (0,1,0) while hovered — so without `text-decoration: none` AND an explicit `color` inside `.ss-btn-primary:hover`/`.ss-btn-ghost:hover` (already in the step-1 snippet), CTA text would underline and the export button's text would flash blue-700 on hover. `.ss-nav-item` is safe on color only because Sidebar keeps `color` inline (step 8). Do not \"fix\" this by editing globals.css or base.css's anchor rules.
- **`.ss-link--muted` must be declared after `.ss-link:hover`** — `.ss-link--muted` (0,1,0) loses to `.ss-link:hover` (0,2,0) on hover, which is why the muted variant needs its own `:hover` rule, and `.ss-link--muted:hover` vs `.ss-link:hover` tie at (0,2,0) so source order decides. Keep the file order exactly as in step 1.
- **ExportButton's locked variant relies on inline-beats-class**: `borderStyle: 'dashed'` and muted color stay inline (step 10) so they win over the class while hover (background only) still animates underneath. Don't move them into a CSS modifier — that adds a class for one call-site.
- **Reduced motion needs `!important`** because the spin/pulse animations are inline `style` props (SyncingBanner.tsx:28, loading.tsx:8/52/66). A non-`!important` media-query rule would be a no-op. Do not rewrite those components to use classes in this slice.
- **Contrast fix goes on the raw token, not the alias** — edit `--ss-muted` (colors.css:37); `--text-muted` (:64) and `--athena-muted` (:87) are `var()` aliases. `#6d6455` computes to ≈5.7:1 on `--ss-paper #fffdf9` and ≈5.1:1 on `--ss-cream #f4f1ea` — both clear AA 4.5:1. Do not go darker \"for safety\"; it drifts toward `--ss-ink-soft #4a4234` and kills the muted/body hierarchy.
- **Marketing is already correct — leave it alone.** `apps/web/app/(marketing)/marketing.css` `.cta:hover` (line 74) and `.btn-ghost-lg:hover` (line 200) exist. Marketing pages also render display type via the same `--font-display` token, so step 7 covers them with no marketing.css edits.
- **Keep the @ss/ui `Button` component untouched** (exported from packages/ui/src/index.ts:5) — it implements hover in JS and MoveCard depends on it; rewriting it is explicitly out of scope.
- **First `pnpm --filter @ss/web build` after this change needs network access** to download the Google font files (next/font self-hosts at build time). Offline builds will fail with a fetch error — that is an environment issue, not a code bug.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all exit 0.
- [ ] All 145 pre-existing vitest tests still pass, plus the 5 new assertions in `apps/web/lib/visual-baseline.test.ts` (total 150).
- [ ] `grep -c 'fonts.googleapis.com' apps/web/app/layout.tsx` returns 0 matches (exit 1); `grep -c \"next/font/google\" apps/web/app/layout.tsx` returns ≥1.
- [ ] `grep -n 'bootstrap-icons.min.css' apps/web/app/layout.tsx` still returns a hit.
- [ ] `grep -n \"@import './components.css'\" packages/ui/src/styles.css` returns a hit, and `packages/ui/src/components.css` contains `.ss-btn-primary:hover`, `.ss-btn-ghost:hover`, `.ss-nav-item:hover`, `.ss-link:hover`.
- [ ] `grep -n 'outline: 2px solid var(--ss-blue-500)' packages/ui/src/tokens/base.css` returns a hit and `grep -n 'box-shadow: var(--focus-ring)' packages/ui/src/tokens/base.css` returns none.
- [ ] `grep -n 'prefers-reduced-motion' packages/ui/src/tokens/base.css` returns a hit.
- [ ] `grep -n -- '--ss-muted: #6d6455' packages/ui/src/tokens/colors.css` returns a hit; lines 64 (`--text-muted`) and 87 (`--athena-muted`) are unchanged.
- [ ] `grep -n 'background' apps/web/components/Sidebar.tsx` shows NO `background:` inside the nav-item `<Link>` style object (the badge's `background: 'var(--action-primary)'` and the `<aside>`'s `background: 'var(--surface-card)'` remain).
- [ ] Screen check on `/app` (dev server): hovering each sidebar item shows a `--surface-soft` background; the active item keeps it; hovering \"See plans\"/\"Unlock with Basic\" darkens to `#0860c4`; hovering an export pill shows a soft background without underline and without the text turning blue; hovering \"Not now\" darkens the text.
- [ ] Keyboard check: pressing Tab from the top of `/app` shows a 2px blue outline (offset 2px) on the logo link, each nav item, and each button/link — verified visually or via DevTools \"toggle element state → :focus-visible\".
- [ ] Network check (DevTools, hard reload on `/` and `/app`): zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`; font files served from `/_next/static/media/`; h1s still render serif (Instrument Serif), UI text still Inter.
- [ ] With DevTools \"Emulate CSS prefers-reduced-motion: reduce\" enabled, the SyncingBanner arrow icon does not spin (visible whenever a first sync is running, e.g. right after connecting a store; alternatively verify the `ss-pulse` skeleton in `/app` loading state freezes).
- [ ] `apps/web/app/(marketing)/marketing.css` has zero diff (`git diff --stat` does not list it), and `packages/ui/src/components/` (the Button/MoveCard components) has zero diff.

## Out of scope

- Rewriting or CSS-ifying the @ss/ui `Button`/`MoveCard` components (they do JS hover and work) — keep them byte-identical.
- Consolidating the five banner components or the duplicated banners in `apps/web/app/app/page.tsx:25-68` (that's the banner-dedup slice; facts recorded, not this slice).
- Deduplicating `usd`/`pct`/`n`/`fmt` formatters (7 files), the three `toCore()` copies, or the three FREE top-N query sites — separate refactor slices.
- Responsive/mobile work: Sidebar collapse, media queries, replacing hardcoded `16.5rem`/`4rem`/`1500` with the existing spacing tokens — separate slice.
- Adding `error.tsx`/`not-found.tsx`/route-level `loading.tsx` files.
- Adopting `PageHeading` on the 7 screens that hand-roll eyebrow+h1.
- Any change to marketing pages or `marketing.css` (`.cta` already has hover states).
- Deleting or importing `packages/ui/src/tokens/fonts.css` (unused, unimported — leave it exactly as is).
- New color tokens (`--surface-hover`, secondary/danger hover variants, disabled states) — only existing tokens may be referenced.
- Touching gating, tenancy, grounding, Stripe, Shopify, or any server logic — this slice is CSS, one layout file, and four component-class migrations only.
