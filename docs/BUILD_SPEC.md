# Simple Sense — BUILD_SPEC (design system + analyzer catalog)

> Auto-extracted from `simplesense-design-system/` + `SimpleSense_Insight_Library.md` via a parallel reader pass.
> Canonical port reference for tokens, components, screens, marketing, and the analyzer/signal catalog (§19 + §8). Verify against source before relying on any exact value.

## 1. Design Tokens

### A. Color Tokens

#### Brand: Signal Blue

| Variable | Value |
|---|---|
| `--ss-blue-50` | `#eaf3fd` |
| `--ss-blue-100` | `#cfe3fb` |
| `--ss-blue-300` | `#6fabf1` |
| `--ss-blue-500` | `#0871e7` (primary) |
| `--ss-blue-600` | `#0860c4` (hover) |
| `--ss-blue-700` | `#074fa0` (active / pressed) |

#### Accent: Clay / Terracotta

| Variable | Value |
|---|---|
| `--ss-clay-100` | `#f6e3da` |
| `--ss-clay-300` | `#e0a98f` |
| `--ss-clay-500` | `#c25a3c` |
| `--ss-clay-600` | `#a8492f` |

#### Decorative: Blossom Pink

| Variable | Value |
|---|---|
| `--ss-blossom-100` | `#f7e4ea` |
| `--ss-blossom-300` | `#e8a0b4` |
| `--ss-blossom-500` | `#d46f8c` |

#### Warm Neutrals

| Variable | Value | Role |
|---|---|---|
| `--ss-cream` | `#f4f1ea` | app / page background |
| `--ss-paper` | `#fffdf9` | card / surface |
| `--ss-sand` | `#ece7dc` | soft surface, hover wells |
| `--ss-border` | `#e4ddcf` | hairline borders |
| `--ss-border-2` | `#d8cfbd` | stronger dividers |
| `--ss-ink` | `#211c15` | primary text (warm near-black) |
| `--ss-ink-soft` | `#4a4234` | secondary text |
| `--ss-muted` | `#837a68` | muted text / captions |

#### Semantic

| Variable | Value |
|---|---|
| `--ss-success` | `#1f8a5b` |
| `--ss-success-bg` | `#e2f1e9` |
| `--ss-warning` | `#cd8420` |
| `--ss-warning-bg` | `#f8ecd5` |
| `--ss-danger` | `#c8442e` |
| `--ss-danger-bg` | `#f7e1db` |
| `--ss-info` | `#0871e7` |
| `--ss-info-bg` | `#e3eefc` |

#### Data-Viz Sequence

| Variable | Value | Role |
|---|---|---|
| `--ss-chart-1` | `#0871e7` | blue |
| `--ss-chart-2` | `#1f8a5b` | green |
| `--ss-chart-3` | `#cd8420` | amber |
| `--ss-chart-4` | `#c25a3c` | clay |
| `--ss-chart-5` | `#8a5cc4` | plum |

#### Semantic Aliases (use in components)

| Variable | Resolved Value |
|---|---|
| `--surface-page` | `var(--ss-cream)` → `#f4f1ea` |
| `--surface-card` | `var(--ss-paper)` → `#fffdf9` |
| `--surface-soft` | `var(--ss-sand)` → `#ece7dc` |
| `--surface-inset` | `#f7f4ed` |
| `--text-strong` | `var(--ss-ink)` → `#211c15` |
| `--text-body` | `var(--ss-ink-soft)` → `#4a4234` |
| `--text-muted` | `var(--ss-muted)` → `#837a68` |
| `--text-onbrand` | `#ffffff` |
| `--text-link` | `var(--ss-blue-600)` → `#0860c4` |
| `--border-hairline` | `var(--ss-border)` → `#e4ddcf` |
| `--border-strong` | `var(--ss-border-2)` → `#d8cfbd` |
| `--action-primary` | `var(--ss-blue-500)` → `#0871e7` |
| `--action-primary-hover` | `var(--ss-blue-600)` → `#0860c4` |
| `--action-primary-active` | `var(--ss-blue-700)` → `#074fa0` |
| `--accent` | `var(--ss-clay-500)` → `#c25a3c` |
| `--focus-ring` | `0 0 0 3px color-mix(in srgb, var(--ss-blue-500) 30%, transparent)` |

#### Athena UI Compatibility Layer

| Variable | Resolved Value |
|---|---|
| `--bs-primary` | `var(--ss-blue-500)` → `#0871e7` |
| `--bs-primary-rgb` | `8, 113, 231` |
| `--athena-bg` | `var(--ss-cream)` → `#f4f1ea` |
| `--athena-surface` | `var(--ss-paper)` → `#fffdf9` |
| `--athena-surface-soft` | `var(--ss-sand)` → `#ece7dc` |
| `--athena-border` | `var(--ss-border)` → `#e4ddcf` |
| `--athena-text` | `var(--ss-ink)` → `#211c15` |
| `--athena-muted` | `var(--ss-muted)` → `#837a68` |
| `--athena-nav` | `var(--ss-ink-soft)` → `#4a4234` |

---

### B. Typography Scale

#### Font Families

| Variable | Value |
|---|---|
| `--font-display` | `"Instrument Serif", Georgia, "Times New Roman", serif` |
| `--font-ui-display` | `"Manrope", "Inter", system-ui, sans-serif` |
| `--font-sans` | `"Inter", system-ui, -apple-system, "Segoe UI", sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` |

#### How Each Font Is Loaded

- **Inter** — self-hosted woff2 via `@font-face` from `../assets/fonts/inter/inter-latin-wght-normal.woff2` (weight 100–900, normal) and `inter-latin-wght-italic.woff2` (weight 100–900, italic); `font-display: swap`.
- **Instrument Serif** — Google Fonts CDN: `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap` (roman + italic, no weight axis — uses default 400).
- **Manrope** — Google Fonts CDN: `https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap` (variable weight 400–800).

#### Type Scale

| Variable | rem | px equivalent | Role |
|---|---|---|---|
| `--text-2xs` | `0.6875rem` | 11px | micro labels |
| `--text-xs` | `0.75rem` | 12px | captions, meta |
| `--text-sm` | `0.875rem` | 14px | UI default |
| `--text-base` | `1rem` | 16px | body |
| `--text-md` | `1.125rem` | 18px | lede |
| `--text-lg` | `1.375rem` | 22px | card titles |
| `--text-xl` | `1.75rem` | 28px | section heads |
| `--text-2xl` | `2.25rem` | 36px | page titles |
| `--text-3xl` | `3rem` | 48px | display |
| `--text-4xl` | `4.25rem` | 68px | hero |
| `--text-5xl` | `6rem` | 96px | mega hero |

#### Font Weights

| Variable | Value |
|---|---|
| `--fw-regular` | `400` |
| `--fw-medium` | `500` |
| `--fw-semibold` | `600` |
| `--fw-bold` | `700` |

#### Line Heights

| Variable | Value |
|---|---|
| `--lh-tight` | `1.02` |
| `--lh-snug` | `1.18` |
| `--lh-normal` | `1.5` |
| `--lh-relaxed` | `1.65` |

#### Letter Spacing

| Variable | Value |
|---|---|
| `--tracking-tight` | `-0.02em` |
| `--tracking-normal` | `0` |
| `--tracking-wide` | `0.02em` |
| `--tracking-eyebrow` | `0.16em` |

#### Base Element Styles (from base.css)

- `body`: `font-family: var(--font-sans)`, `font-size: var(--text-base)` (1rem), `line-height: var(--lh-normal)` (1.5), `color: var(--text-body)`, `background: var(--surface-page)`, `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`
- `h1–h6`: `color: var(--text-strong)`, `margin: 0`
- `::selection`: `background: var(--ss-blue-100)` (#cfe3fb), `color: var(--ss-ink)` (#211c15)

#### Reusable Brand Primitives

- `.ss-eyebrow`: `font-family: var(--font-sans)`, `font-size: var(--text-xs)` (0.75rem), `font-weight: var(--fw-semibold)` (600), `letter-spacing: var(--tracking-eyebrow)` (0.16em), `text-transform: uppercase`, `color: var(--accent)` (#c25a3c)
- `.ss-display`: `font-family: var(--font-display)`, `font-weight: 400`, `line-height: var(--lh-tight)` (1.02), `letter-spacing: var(--tracking-tight)` (-0.02em), `color: var(--text-strong)` (#211c15)
- `.ss-prose`: `max-width: 65ch`, `line-height: var(--lh-relaxed)` (1.65)

---

### C. Spacing, Radii, Shadows, Motion, Layout

#### Spacing Scale (4px base)

| Variable | Value |
|---|---|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.5rem` (24px) |
| `--space-6` | `2rem` (32px) |
| `--space-7` | `3rem` (48px) |
| `--space-8` | `4rem` (64px) |
| `--space-9` | `6rem` (96px) |
| `--space-10` | `8rem` (128px) |

#### Radii

| Variable | Value |
|---|---|
| `--radius-xs` | `0.375rem` (6px) |
| `--radius-sm` | `0.5rem` (8px) |
| `--radius-md` | `0.75rem` (12px) |
| `--radius-lg` | `1rem` (16px) |
| `--radius-xl` | `1.5rem` (24px) |
| `--radius-pill` | `999px` |

#### Shadows

| Variable | Exact value |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(53, 42, 24, 0.06)` |
| `--shadow-sm` | `0 2px 6px rgba(53, 42, 24, 0.07)` |
| `--shadow-md` | `0 8px 24px rgba(53, 42, 24, 0.09)` |
| `--shadow-lg` | `0 20px 48px rgba(53, 42, 24, 0.12)` |
| `--shadow-inset-glint` | `inset 0 -3px 4px rgba(255, 255, 255, 0.35)` |

Note: The blue CTA glint is `--shadow-inset-glint: inset 0 -3px 4px rgba(255, 255, 255, 0.35)`. All drop shadows use warm-brown base `rgba(53, 42, 24, …)` — not cool slate.

#### Motion

| Variable | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--dur-fast` | `140ms` |
| `--dur-base` | `240ms` |
| `--dur-slow` | `1200ms` |

#### Layout Constants

| Variable | Value |
|---|---|
| `--sidebar-width` | `16.5rem` |
| `--topbar-height` | `4rem` |
| `--container-max` | `1500px` |

---

### D. Tailwind v3 `theme.extend` Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand: signal blue
        'ss-blue': {
          50:  'var(--ss-blue-50)',   // #eaf3fd
          100: 'var(--ss-blue-100)', // #cfe3fb
          300: 'var(--ss-blue-300)', // #6fabf1
          500: 'var(--ss-blue-500)', // #0871e7
          600: 'var(--ss-blue-600)', // #0860c4
          700: 'var(--ss-blue-700)', // #074fa0
        },
        // Accent: clay / terracotta
        'ss-clay': {
          100: 'var(--ss-clay-100)', // #f6e3da
          300: 'var(--ss-clay-300)', // #e0a98f
          500: 'var(--ss-clay-500)', // #c25a3c
          600: 'var(--ss-clay-600)', // #a8492f
        },
        // Decorative: blossom pink
        'ss-blossom': {
          100: 'var(--ss-blossom-100)', // #f7e4ea
          300: 'var(--ss-blossom-300)', // #e8a0b4
          500: 'var(--ss-blossom-500)', // #d46f8c
        },
        // Warm neutrals
        'ss-cream':    'var(--ss-cream)',    // #f4f1ea
        'ss-paper':    'var(--ss-paper)',    // #fffdf9
        'ss-sand':     'var(--ss-sand)',     // #ece7dc
        'ss-border':   'var(--ss-border)',   // #e4ddcf
        'ss-border-2': 'var(--ss-border-2)', // #d8cfbd
        'ss-ink':      'var(--ss-ink)',      // #211c15
        'ss-ink-soft': 'var(--ss-ink-soft)', // #4a4234
        'ss-muted':    'var(--ss-muted)',    // #837a68
        // Semantic
        'ss-success':    'var(--ss-success)',    // #1f8a5b
        'ss-success-bg': 'var(--ss-success-bg)', // #e2f1e9
        'ss-warning':    'var(--ss-warning)',    // #cd8420
        'ss-warning-bg': 'var(--ss-warning-bg)', // #f8ecd5
        'ss-danger':     'var(--ss-danger)',     // #c8442e
        'ss-danger-bg':  'var(--ss-danger-bg)',  // #f7e1db
        'ss-info':       'var(--ss-info)',       // #0871e7
        'ss-info-bg':    'var(--ss-info-bg)',    // #e3eefc
        // Data-viz
        'ss-chart-1': 'var(--ss-chart-1)', // #0871e7
        'ss-chart-2': 'var(--ss-chart-2)', // #1f8a5b
        'ss-chart-3': 'var(--ss-chart-3)', // #cd8420
        'ss-chart-4': 'var(--ss-chart-4)', // #c25a3c
        'ss-chart-5': 'var(--ss-chart-5)', // #8a5cc4
        // Semantic aliases
        'surface-page':   'var(--surface-page)',   // #f4f1ea
        'surface-card':   'var(--surface-card)',   // #fffdf9
        'surface-soft':   'var(--surface-soft)',   // #ece7dc
        'surface-inset':  'var(--surface-inset)',  // #f7f4ed
        'text-strong':    'var(--text-strong)',    // #211c15
        'text-body':      'var(--text-body)',      // #4a4234
        'text-muted':     'var(--text-muted)',     // #837a68
        'text-onbrand':   'var(--text-onbrand)',   // #ffffff
        'text-link':      'var(--text-link)',      // #0860c4
        'border-hairline':'var(--border-hairline)', // #e4ddcf
        'border-strong':  'var(--border-strong)',  // #d8cfbd
        'action-primary':       'var(--action-primary)',        // #0871e7
        'action-primary-hover': 'var(--action-primary-hover)',  // #0860c4
        'action-primary-active':'var(--action-primary-active)', // #074fa0
        'accent':         'var(--accent)',         // #c25a3c
      },

      spacing: {
        'ss-1':  'var(--space-1)',  // 0.25rem
        'ss-2':  'var(--space-2)',  // 0.5rem
        'ss-3':  'var(--space-3)',  // 0.75rem
        'ss-4':  'var(--space-4)',  // 1rem
        'ss-5':  'var(--space-5)',  // 1.5rem
        'ss-6':  'var(--space-6)',  // 2rem
        'ss-7':  'var(--space-7)',  // 3rem
        'ss-8':  'var(--space-8)',  // 4rem
        'ss-9':  'var(--space-9)',  // 6rem
        'ss-10': 'var(--space-10)', // 8rem
        'sidebar': 'var(--sidebar-width)',   // 16.5rem
        'topbar':  'var(--topbar-height)',   // 4rem
      },

      maxWidth: {
        'ss-container': 'var(--container-max)', // 1500px
      },

      borderRadius: {
        'ss-xs':   'var(--radius-xs)',   // 0.375rem
        'ss-sm':   'var(--radius-sm)',   // 0.5rem
        'ss-md':   'var(--radius-md)',   // 0.75rem
        'ss-lg':   'var(--radius-lg)',   // 1rem
        'ss-xl':   'var(--radius-xl)',   // 1.5rem
        'ss-pill': 'var(--radius-pill)', // 999px
      },

      fontFamily: {
        display:    'var(--font-display)',     // "Instrument Serif", Georgia, "Times New Roman", serif
        'ui-display': 'var(--font-ui-display)', // "Manrope", "Inter", system-ui, sans-serif
        sans:       'var(--font-sans)',        // "Inter", system-ui, -apple-system, "Segoe UI", sans-serif
        mono:       'var(--font-mono)',        // ui-monospace, "SF Mono", Menlo, Consolas, monospace
      },

      fontSize: {
        'ss-2xs':  ['var(--text-2xs)',  { lineHeight: 'var(--lh-normal)' }],  // 0.6875rem
        'ss-xs':   ['var(--text-xs)',   { lineHeight: 'var(--lh-normal)' }],  // 0.75rem
        'ss-sm':   ['var(--text-sm)',   { lineHeight: 'var(--lh-normal)' }],  // 0.875rem
        'ss-base': ['var(--text-base)', { lineHeight: 'var(--lh-normal)' }],  // 1rem
        'ss-md':   ['var(--text-md)',   { lineHeight: 'var(--lh-snug)' }],    // 1.125rem
        'ss-lg':   ['var(--text-lg)',   { lineHeight: 'var(--lh-snug)' }],    // 1.375rem
        'ss-xl':   ['var(--text-xl)',   { lineHeight: 'var(--lh-snug)' }],    // 1.75rem
        'ss-2xl':  ['var(--text-2xl)',  { lineHeight: 'var(--lh-tight)' }],   // 2.25rem
        'ss-3xl':  ['var(--text-3xl)',  { lineHeight: 'var(--lh-tight)' }],   // 3rem
        'ss-4xl':  ['var(--text-4xl)',  { lineHeight: 'var(--lh-tight)' }],   // 4.25rem
        'ss-5xl':  ['var(--text-5xl)',  { lineHeight: 'var(--lh-tight)' }],   // 6rem
      },

      fontWeight: {
        'ss-regular':  'var(--fw-regular)',  // 400
        'ss-medium':   'var(--fw-medium)',   // 500
        'ss-semibold': 'var(--fw-semibold)', // 600
        'ss-bold':     'var(--fw-bold)',     // 700
      },

      letterSpacing: {
        'ss-tight':   'var(--tracking-tight)',   // -0.02em
        'ss-normal':  'var(--tracking-normal)',  // 0
        'ss-wide':    'var(--tracking-wide)',    // 0.02em
        'ss-eyebrow': 'var(--tracking-eyebrow)', // 0.16em
      },

      lineHeight: {
        'ss-tight':   'var(--lh-tight)',   // 1.02
        'ss-snug':    'var(--lh-snug)',    // 1.18
        'ss-normal':  'var(--lh-normal)',  // 1.5
        'ss-relaxed': 'var(--lh-relaxed)', // 1.65
      },

      boxShadow: {
        'ss-xs':           'var(--shadow-xs)',           // 0 1px 2px rgba(53, 42, 24, 0.06)
        'ss-sm':           'var(--shadow-sm)',           // 0 2px 6px rgba(53, 42, 24, 0.07)
        'ss-md':           'var(--shadow-md)',           // 0 8px 24px rgba(53, 42, 24, 0.09)
        'ss-lg':           'var(--shadow-lg)',           // 0 20px 48px rgba(53, 42, 24, 0.12)
        'ss-inset-glint':  'var(--shadow-inset-glint)', // inset 0 -3px 4px rgba(255, 255, 255, 0.35)
        'ss-focus':        '0 0 0 3px color-mix(in srgb, #0871e7 30%, transparent)',
      },

      transitionTimingFunction: {
        'ss-out':     'var(--ease-out)',    // cubic-bezier(0.16, 1, 0.3, 1)
        'ss-in-out':  'var(--ease-in-out)', // cubic-bezier(0.4, 0, 0.2, 1)
      },

      transitionDuration: {
        'ss-fast': 'var(--dur-fast)', // 140ms
        'ss-base': 'var(--dur-base)', // 240ms
        'ss-slow': 'var(--dur-slow)', // 1200ms
      },
    },
  },
};
```

---

## 2. Core Components

---

### Button

**Props**

| Prop | Type | Default | Allowed values / notes |
|---|---|---|---|
| `variant` | `ButtonVariant` | `"primary"` | `"primary"` \| `"clay"` \| `"secondary"` \| `"ghost"` |
| `size` | `ButtonSize` | `"md"` | `"sm"` \| `"md"` \| `"lg"` |
| `pill` | `boolean` | `false` | Fully-rounded shape via `var(--radius-pill)`; used for nav and marketing CTAs |
| `icon` | `string` | — | Bootstrap Icons name without the `bi-` prefix; rendered before the label |
| `iconRight` | `string` | — | Bootstrap Icons name rendered after the label |
| `disabled` | `boolean` | `false` | Sets `opacity: 0.5`, `cursor: not-allowed`, and the native `disabled` attribute |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Forwarded to the native `<button>` |
| `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | — | |
| `style` | `React.CSSProperties` | — | Merged last onto the root element |
| `...rest` | `React.ButtonHTMLAttributes<HTMLButtonElement>` | — | Spread onto `<button>` |

**Size tokens (inline, not class-based)**

| Size | `height` | `padding` | `fontSize` |
|---|---|---|---|
| `sm` | 34 px | `0 14px` | 13 px |
| `md` | 42 px | `0 18px` | 14 px |
| `lg` | 52 px | `0 26px` | 16 px |

**DOM structure**

```
<button type={type} disabled? style={...}>
  <!-- glint span (primary + clay only) -->
  <span aria-hidden="true" style="position:absolute; top:1px; left:10%; width:80%→84%; height:14px; border-radius:12px; background:linear-gradient(to bottom, rgba(255,255,255,0.42), transparent); transition:width ..." />

  <!-- optional left icon -->
  <i class="bi bi-{icon}" aria-hidden="true" style="font-size:1.05em" />

  <!-- label -->
  <span style="position:relative">{children}</span>

  <!-- optional right icon -->
  <i class="bi bi-{iconRight}" aria-hidden="true" style="font-size:1.05em" />
</button>
```

**Base inline styles on `<button>`**

```
position: relative
display: inline-flex
align-items: center
justify-content: center
gap: 8px
border: 1px solid transparent
border-radius: var(--radius-pill)  [if pill]  |  var(--radius-sm)  [default]
font-family: var(--font-sans)
font-weight: 600
line-height: 1
letter-spacing: -0.005em
white-space: nowrap
user-select: none
overflow: hidden
transition: background var(--dur-fast) var(--ease-in-out), color var(--dur-fast), border-color var(--dur-fast)
```

**Variant styles and state shifts**

`primary`
- Rest: `background: var(--ss-blue-500)`, `color: var(--text-onbrand)`, `border-color: var(--ss-blue-500)`, `box-shadow: var(--shadow-inset-glint), var(--shadow-sm)`
- Hover: `background: var(--ss-blue-600)`, `border-color: var(--ss-blue-500)`
- Active/press: `background: var(--ss-blue-700)`, `border-color: var(--ss-blue-700)`
- Glint: present; on hover the glint `width` expands from `80%` to `84%` via `transition: width var(--dur-base) var(--ease-out)`

`clay`
- Rest: `background: var(--ss-clay-500)`, `color: var(--text-onbrand)`, `border-color: var(--ss-clay-500)`, `box-shadow: var(--shadow-inset-glint), var(--shadow-sm)`
- Hover: `background: var(--ss-clay-600)` (same as active; both shift to `-600`)
- Active/press: `background: var(--ss-clay-600)`, `border-color: var(--ss-clay-500)`
- Glint: present; same hover-width expansion as `primary`

`secondary`
- Rest: `background: var(--surface-card)`, `color: var(--text-strong)`, `border-color: var(--border-strong)`, no box-shadow override
- Hover: `background: var(--surface-soft)`
- Active/press: no additional state (active flag not consumed for secondary/ghost)
- Glint: none

`ghost`
- Rest: `background: transparent`, `color: var(--text-strong)`, no border
- Hover: `background: var(--surface-soft)`
- Glint: none

**Key behavioral note:** Press state shifts background color; there is no `transform: scale()` or size change on press.

**TypeScript port signature**

```typescript
import React from "react";

export type ButtonVariant = "primary" | "clay" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;        // default "primary"
  size?: ButtonSize;              // default "md"
  pill?: boolean;                 // default false
  icon?: string;                  // Bootstrap Icons name, no "bi-" prefix
  iconRight?: string;             // Bootstrap Icons name, no "bi-" prefix
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
```

---

### Badge

**Props**

| Prop | Type | Default | Allowed values / notes |
|---|---|---|---|
| `tone` | `BadgeTone` | `"neutral"` | `"neutral"` \| `"primary"` \| `"success"` \| `"warning"` \| `"danger"` \| `"clay"` |
| `variant` | `"soft" \| "outline"` | `"soft"` | `"soft"` = tinted background, no border; `"outline"` = transparent background, visible border |
| `dot` | `boolean` | `false` | Prepends a 6 px filled circle in the tone's fg color |
| `children` | `React.ReactNode` | — | Badge label |
| `style` | `React.CSSProperties` | — | Merged onto root `<span>` |
| `...rest` | `React.HTMLAttributes<HTMLSpanElement>` | — | Spread onto root `<span>` |

**Tone tokens**

| Tone | `color` (fg) | `background` (soft) | `border-color` (outline) |
|---|---|---|---|
| `neutral` | `var(--ss-ink-soft)` | `var(--surface-soft)` | `var(--border-strong)` |
| `primary` | `var(--ss-blue-600)` | `var(--ss-info-bg)` | `var(--ss-blue-300)` |
| `success` | `var(--ss-success)` | `var(--ss-success-bg)` | `var(--ss-success)` |
| `warning` | `var(--ss-warning)` | `var(--ss-warning-bg)` | `var(--ss-warning)` |
| `danger` | `var(--ss-danger)` | `var(--ss-danger-bg)` | `var(--ss-danger)` |
| `clay` | `var(--ss-clay-600)` | `var(--ss-clay-100)` | `var(--ss-clay-300)` |

**DOM structure**

```
<span style="...">
  <!-- dot, if dot=true -->
  <span aria-hidden="true" style="width:6px; height:6px; border-radius:50%; background:{t.fg}" />

  {children}
</span>
```

**Root `<span>` inline styles**

```
display: inline-flex
align-items: center
gap: 6px
padding: 3px 10px
font-family: var(--font-sans)
font-size: 12px
font-weight: 600
line-height: 1.4
border-radius: var(--radius-pill)
color: {t.fg}
background: transparent          [outline]  |  {t.bg}  [soft]
border: 1px solid {t.bd}         [outline]  |  1px solid transparent  [soft]
white-space: nowrap
```

No hover or active states. No transitions. Purely presentational.

**TypeScript port signature**

```typescript
import React from "react";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "clay";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;               // default "neutral"
  variant?: "soft" | "outline";  // default "soft"
  dot?: boolean;                  // default false
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
```

---

### Card

**Props**

| Prop | Type | Default | Allowed values / notes |
|---|---|---|---|
| `padding` | `number` | `24` | Inner padding in px; applied as a single value to all sides |
| `interactive` | `boolean` | `false` | Enables hover lift: `translateY(-2px)` + shadow upgrade to `var(--shadow-md)` |
| `children` | `React.ReactNode` | — | |
| `style` | `React.CSSProperties` | — | Merged onto root `<div>` |
| `...rest` | `React.HTMLAttributes<HTMLDivElement>` | — | Spread onto root `<div>` |

**DOM structure**

```
<div style="...">
  {children}
</div>
```

Single `<div>` — no internal structure imposed.

**Root `<div>` inline styles**

```
background: var(--surface-card)
border: 1px solid var(--border-hairline)
border-radius: var(--radius-md)
padding: {padding}px
transition: box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)
```

**State (interactive only)**

- Rest: `box-shadow: var(--shadow-sm)`, `transform: none`
- Hover: `box-shadow: var(--shadow-md)`, `transform: translateY(-2px)`

When `interactive={false}` (default), `onMouseEnter`/`onMouseLeave` fire but the state setter is guarded (`interactive && setHover(true)`), so `hover` always stays `false` and `box-shadow` stays `var(--shadow-sm)` and transform stays `none`.

No press / active state. No colored left-border variants.

**TypeScript port signature**

```typescript
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number;       // default 24 (px, uniform)
  interactive?: boolean;  // default false
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
```

---

### Input

**Props**

| Prop | Type | Default | Allowed values / notes |
|---|---|---|---|
| `label` | `string` | — | Rendered as a `<span>` above the input; also used to auto-generate `id` when `id` is not provided |
| `id` | `string` | — | Explicit `id`; if absent and `label` is set, auto-derived as `ss-input-{label-lowercased-hyphenated}` |
| `icon` | `string` | — | Bootstrap Icons name (no `bi-` prefix); rendered inside the wrapper span at the leading edge in `var(--text-muted)` |
| `hint` | `string` | — | Helper text below the field; color switches to `var(--ss-danger)` when `invalid` |
| `invalid` | `boolean` | `false` | Switches wrapper border to `var(--ss-danger)` and hint color to `var(--ss-danger)` |
| `style` | `React.CSSProperties` | — | Applied to the inner `<input>` element (not the wrapper) |
| `...rest` | `React.InputHTMLAttributes<HTMLInputElement>` | — | Spread onto the inner `<input>` |

**DOM structure**

```
<label htmlFor={inputId} style="display:block; font-family:var(--font-sans)">

  <!-- label text, if label prop set -->
  <span style="display:block; font-size:13px; font-weight:600; color:var(--text-strong); margin-bottom:6px">
    {label}
  </span>

  <!-- input wrapper -->
  <span style="display:flex; align-items:center; gap:8px; background:var(--surface-card);
               border:1px solid {borderColor}; border-radius:var(--radius-sm);
               padding:0 12px; height:42px;
               box-shadow:{focus ? 'var(--focus-ring)' : 'none'};
               transition:border-color var(--dur-fast), box-shadow var(--dur-fast)">

    <!-- optional leading icon -->
    <i class="bi bi-{icon}" aria-hidden="true" style="color:var(--text-muted)" />

    <!-- native input -->
    <input id={inputId} style="flex:1; border:none; outline:none; background:transparent;
                                font-family:var(--font-sans); font-size:14px;
                                color:var(--text-strong); height:100%; min-width:0; ...style" />
  </span>

  <!-- hint, if hint prop set -->
  <span style="display:block; font-size:12px; color:{invalid ? 'var(--ss-danger)' : 'var(--text-muted)'}; margin-top:6px">
    {hint}
  </span>

</label>
```

**Wrapper border color logic**

```
invalid → var(--ss-danger)
focus   → var(--ss-blue-500)
default → var(--border-strong)
```

**Focus behavior:** wrapper receives `box-shadow: var(--focus-ring)` and border switches to `var(--ss-blue-500)`. The inner `<input>` itself has `outline: none` — focus ring is entirely on the wrapper `<span>`.

No size variants. Height is fixed at 42 px. No `disabled` styling is defined (relies on browser defaults via `...rest`).

**TypeScript port signature**

```typescript
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;    // also drives auto-id generation
  icon?: string;     // Bootstrap Icons name, no "bi-" prefix; leading
  hint?: string;     // helper or error text below field
  invalid?: boolean; // default false; switches border + hint to danger color
}

export function Input(props: InputProps): JSX.Element;
```

---

### Avatar

**Props**

| Prop | Type | Default | Allowed values / notes |
|---|---|---|---|
| `src` | `string` | — | Image URL; when present, renders an `<img>` at 100% width/height with `object-fit: cover`. Falls back to initials when omitted |
| `name` | `string` | `""` | Full name string; used to derive initials (up to 2 words, first char of each, uppercased) and set as the `title` attribute on the root element |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Controls both width and height in px; also scales font-size |
| `style` | `React.CSSProperties` | — | Merged onto root `<span>` |
| `...rest` | `React.HTMLAttributes<HTMLSpanElement>` | — | Spread onto root `<span>` |

**Size tokens**

| Size | `width` / `height` | `font-size` (computed) |
|---|---|---|
| `sm` | 28 px | `28 × 0.36 = ~10.1 px` |
| `md` | 38 px | `38 × 0.36 = ~13.7 px` |
| `lg` | 52 px | `52 × 0.36 = ~18.7 px` |

Font size is inline-calculated as `px * 0.36` (not a token).

**DOM structure — image variant (`src` provided)**

```
<span title={name} style="...">
  <img src={src} alt={name} style="width:100%; height:100%; object-fit:cover" />
</span>
```

**DOM structure — initials fallback (`src` absent)**

```
<span title={name} style="...">
  {initials}   <!-- e.g. "SS" for "Satya Sivunigunta"; "?" if name is empty/blank -->
</span>
```

Initials derivation: split `name` on whitespace, take first 2 non-empty words, uppercase first character of each, join. If the result is empty (name is blank or `""`), renders `"?"`.

**Root `<span>` inline styles**

```
display: inline-grid
place-items: center
width: {px}px
height: {px}px
border-radius: 50%
background: var(--ss-clay-100)
color: var(--ss-clay-600)
border: 1px solid var(--border-hairline)
font-family: var(--font-sans)
font-size: {px * 0.36}px
font-weight: 700
overflow: hidden
flex: none
```

No hover, active, or focus states. No transitions. The `background` and `color` tokens are always `--ss-clay-100` / `--ss-clay-600` regardless of any prop (no tone/color prop exists). When an `<img>` is rendered it covers the background entirely.

**TypeScript port signature**

```typescript
import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;                  // image URL; omit for initials fallback
  name?: string;                 // default ""; drives initials + title attribute
  size?: "sm" | "md" | "lg";    // default "md"
}

export function Avatar(props: AvatarProps): JSX.Element;
```

---

## 3. App Components & Charts

### (a) MetricCard

**Source:** `/Users/satya/simplesense.co/simplesense-design-system/project/components/app/MetricCard.jsx` + `.d.ts`

**Purpose:** A compact KPI tile intended to be composed 3–4 across a grid row on the operator dashboard.

**Props (all from `MetricCardProps extends React.HTMLAttributes<HTMLDivElement>`):**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | yes | — | Metric name, e.g. `"Conversion rate"` |
| `value` | `React.ReactNode` | yes | — | Pre-formatted figure, e.g. `"1.8%"` or `"$248k"` |
| `delta` | `React.ReactNode` | no | — | Change indicator, e.g. `"+0.4pt"` |
| `deltaTone` | `"neutral" \| "primary" \| "success" \| "warning" \| "danger" \| "clay"` | no | `"success"` | Badge tone applied to the delta |
| `icon` | `string` | no | — | Bootstrap Icons name without the `bi-` prefix, e.g. `"graph-up-arrow"` |
| `style` | `CSSProperties` | no | — | Merged onto the root element |
| `...rest` | `HTMLAttributes<HTMLDivElement>` | no | — | Spread onto root `<div>` |

**Exact layout (left-to-right, flex row, `align-items: flex-start`, `justify-content: space-between`):**

```
┌───────────────────────────────────────────────────┐
│ [icon] label                          [delta Badge]│
│                                                    │
│ value (30px bold serif-weight, --text-strong)      │
└───────────────────────────────────────────────────┘
```

- Root: `background: --surface-card`, `border: 1px solid --border-hairline`, `border-radius: --radius-md`, `box-shadow: --shadow-sm`, `padding: 18px 20px`, `display: flex`, `gap: 16`.
- Left column (`minWidth: 0`): top row = optional `<i class="bi bi-{icon}">` (color `--ss-blue-500`, 15px) + `<p>` label (13px, `--text-muted`, weight 500); below = `<strong>` value (30px, lineHeight 1.1, weight 700, `--text-strong`, letterSpacing -0.01em).
- Right: `<Badge tone={deltaTone}>` rendered only when `delta != null`.

**Usage example from `.prompt.md`:**
```jsx
<MetricCard label="Conversion rate" value="1.8%" delta="+0.4pt" icon="graph-up-arrow" />
<MetricCard label="Refund rate"     value="3.1%"  delta="-0.6pt" deltaTone="success" icon="arrow-counterclockwise" />
<MetricCard label="Draft products"  value="148"   delta="Review"  deltaTone="warning"  icon="box-seam" />
```

---

### (b) MoveCard — The Signature Component

**Source:** `/Users/satya/simplesense.co/simplesense-design-system/project/components/app/MoveCard.jsx` + `.d.ts` + `.prompt.md`

**Purpose:** The hero component of the entire product. Delivers a ranked, prescriptive recommendation following the brand's canonical content unit: **Pattern → Why → Move(s) → Impact**. Used everywhere SimpleSense tells an operator what to change next.

**Props (all from `MoveCardProps extends React.HTMLAttributes<HTMLElement>`):**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `rank` | `number \| string` | no | — | Priority rank shown in the blue serif chip (e.g. `1`) |
| `category` | `string` | no | `"Move"` | Eyebrow label, e.g. `"Geographic concentration"` |
| `pattern` | `React.ReactNode` | **yes** | — | The non-obvious finding, grounded in merchant numbers; rendered in display serif (Instrument Serif) |
| `why` | `React.ReactNode` | no | — | One-line reasoning behind the call |
| `moves` | `React.ReactNode[]` | no | `[]` | Array of prescribed actions; each rendered as a green ✓ line |
| `impact` | `React.ReactNode` | no | — | Expected impact range, e.g. `"+$4–7k / mo"`; rendered as a `success` Badge with dot |
| `confidence` | `React.ReactNode` | no | — | Grounding / confidence note in the footer, e.g. `"Grounded in 3.2 yrs of order data"` |
| `ctaLabel` | `string` | no | `"Apply this move"` | Label for the primary CTA button |
| `onApply` | `() => void` | no | — | Handler wired to the CTA button |
| `style` | `CSSProperties` | no | — | Merged onto root `<article>` |
| `...rest` | `HTMLAttributes<HTMLElement>` | no | — | Spread onto root `<article>` |

**Exact visual structure:**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│  [rank chip: 34×34, --ss-blue-500, display serif, white]     │
│  [CATEGORY eyebrow: 11px, 0.16em tracking, --accent]  [impact Badge •] │
├──────────────────────────────────────────────────────────────┤
│ PATTERN (Instrument Serif, 22px, lineHeight 1.18,            │
│          --text-strong, letterSpacing -0.01em)               │
├──────────────────────────────────────────────────────────────┤
│ WHY · <reason text> (14px, --text-body, bold "Why · " prefix) │
├──────────────────────────────────────────────────────────────┤
│ ✓ move one          (bi-check2 icon, --ss-success green,     │
│ ✓ move two           14px, lineHeight 1.45, --text-body)     │
│ ✓ move three                                                  │
├──────────────────────────────────────────────────────────────┤
│ FOOTER (border-top hairline, flex space-between)             │
│  [bullseye icon] confidence text      [Apply this move →]    │
└──────────────────────────────────────────────────────────────┘
```

- Root element: `<article>`, `position: relative`, `background: --surface-card`, `border: 1px solid --border-hairline`, `border-radius: --radius-lg`, `box-shadow: --shadow-md`, `padding: 22px 24px`, `overflow: hidden`.
- Rank chip: `display: grid; place-items: center`, 34×34, `border-radius: --radius-sm`, `background: --ss-blue-500`, white text, `font-family: --font-display`, `font-size: 20px`, `box-shadow: --shadow-inset-glint`.
- Pattern: `font-family: --font-display` (Instrument Serif).
- Why: bold `"Why · "` prefix (weight 700, `--text-strong`), rest is body color.
- Moves list: `<ul>` with `list-style: none`, `gap: 9px`; each `<li>` is `<i class="bi bi-check2">` (color `--ss-success`, 16px) + `<span>`.
- Footer CTA: `<Button size="sm" variant="primary" iconRight="arrow-right">`.
- Confidence note: shown only when truthy; prefixed with `<i class="bi bi-bullseye">`.

**Faithful React + TypeScript port signature:**

```tsx
import React from "react";

export interface MoveCardProps extends React.HTMLAttributes<HTMLElement> {
  rank?: number | string;
  category?: string;
  pattern: React.ReactNode;
  why?: React.ReactNode;
  moves?: React.ReactNode[];
  impact?: React.ReactNode;
  confidence?: React.ReactNode;
  ctaLabel?: string;
  onApply?: () => void;
}

export function MoveCard(props: MoveCardProps): JSX.Element;
```

**MoveCard ↔ Recommendation field mapping** (how a `Recommendation` data record maps to MoveCard props):

| MoveCard prop | Recommendation field |
|---|---|
| `rank` | `rank` (priority order, integer) |
| `category` | `category` (insight type/theme label) |
| `pattern` | `pattern` (the non-obvious finding / headline) |
| `why` | `why` (one-line reasoning) |
| `moves` | `moves[]` (array of prescribed action strings) |
| `impact` | `impact` (expected dollar/pct range, formatted string) |
| `confidence` | `confidence` (grounding note, e.g. data span) |
| `ctaLabel` | UI override, not stored in recommendation data |
| `onApply` | handler wired to recommendation `id` / action trigger |

The `pattern` field is the editorial headline rendered in Instrument Serif; `moves[]` is the action array; `impact` is the dollar/uplift range. These three fields are the core of every SimpleSense recommendation record.

---

### (c) Charts — `charts.jsx`

**Source:** `/Users/satya/simplesense.co/simplesense-design-system/project/ui_kits/app/charts.jsx`

All charts are **pure SVG** (or SVG-in-div for heatmap), zero external dependencies. Colors come exclusively from data-viz CSS tokens aliased as: `--ss-chart-1` (blue), `--ss-chart-2` (green), `--ss-chart-3` (amber), `--ss-chart-4` (clay), `--ss-chart-5` (plum), plus shared tokens `--border-hairline`, `--surface-soft`, `--text-strong`, `--text-muted`. Exposed on `window.SSCharts`.

---

#### Sparkline

Small inline area+line chart.

```ts
Sparkline({
  data?: number[],        // raw values array, default []
  color?: string,         // stroke/fill color, default C.blue (--ss-chart-1)
  width?: number,         // SVG width px, default 120
  height?: number,        // SVG height px, default 34
  fill?: boolean,         // show gradient area fill, default true
})
```

- Renders `<svg width={width} height={height}>`.
- Maps data to (x, y) points; draws a `<path>` line + optional gradient-filled area path.
- Area gradient: 0.18 opacity at top → 0 at bottom (unique random `id` per instance).
- `strokeWidth: 2`, `strokeLinecap/Join: round`.

---

#### TrendLine

Larger line chart with horizontal grid and optional second series.

```ts
TrendLine({
  series?: number[][],    // array of data series, default []
  labels?: string[],      // x-axis labels, default []
  height?: number,        // SVG height, default 220
  colors?: string[],      // per-series colors, default [C.blue, C.clay]
  format?: (v: number) => any,  // y-axis tick formatter, default identity
})
```

- Fixed internal width `W = 720`; renders `width="100%"` responsive SVG.
- Padding: `{ l: 38, r: 14, t: 14, b: 26 }`.
- Draws 5 horizontal grid lines + y-axis tick labels (left-aligned, 11px, `--text-muted`).
- X-axis labels at bottom (11px, `--text-muted`).
- Each series: `<path>` line (`strokeWidth: 2.5`) + `<circle>` dot per point (r=3, card-surface fill + series stroke).
- Y domain: `max = Math.max(...all) * 1.08`, `min = Math.min(0, ...all)`.

---

#### ParetoChart

Revenue bars per decile with cumulative percentage overlay line.

```ts
ParetoChart({
  deciles?: number[],     // revenue share per decile (should sum to 100), default []
  height?: number,        // SVG height, default 260
})
```

- Fixed `W = 720`; padding `{ l: 40, r: 40, t: 18, b: 34 }`.
- Horizontal grid lines at 0, 25, 50, 75, 100%.
- Each bar: width = `bw * 0.68`, `rx: 3`; first two deciles (`i < 2`) use `C.blue`, remainder use `--surface-soft` (hardcoded "top 2 deciles are hot" highlight).
- X labels: `"10%"`, `"20%"`, … per bar.
- Cumulative line overlay in `C.clay` with `strokeWidth: 2.5` + circle dots.
- Hardcoded callout at decile index 1: dashed vertical `C.clay` line + `"71% of revenue"` label (weight 700).

---

#### CohortHeatmap

Cohort retention heatmap rendered as a CSS grid (not pure SVG).

```ts
CohortHeatmap({
  rows?: Array<{ label: string; row: (number | null)[] }>,
  cols?: string[],        // column headers, default ["M0","M1","M2","M3","M4","M5"]
})
```

- `rows[i].label`: cohort row label (e.g. month name).
- `rows[i].row`: array of 0–100 values or `null` for empty cells.
- Cell coloring: `color-mix(in srgb, --ss-blue-500 {8 + t*78}%, --surface-card)` where `t = v/100`; text flips to `#fff` above 42% intensity.
- `null` cells: `transparent` background, dashed border (`1px dashed --border-hairline`).
- Font: `--font-ui-display`, 12px, weight 600.
- Grid: `"48px repeat(N, 1fr)"`, gap 5.

---

#### BarRows

Horizontal bar rows for rankings and distributions.

```ts
BarRows({
  items?: Array<{
    label: string,
    pct: number,          // bar fill width (0-100)
    value?: string,       // display value; falls back to `pct + "%"`
    tone?: "primary" | "success" | "warning" | "danger" | "neutral",
  }>,
  showValue?: boolean,    // show right-side value label, default true
})
```

- Each row: 3-column grid `"150px 1fr auto"`, gap 14.
- Label: 13.5px, `--text-strong`, weight 500, truncated with ellipsis.
- Bar track: 9px height, `border-radius: 5`, background `--surface-soft`; fill uses tone map → `C.blue / C.green / C.amber / C.clay / --ss-ink-soft`; CSS transition `width var(--dur-base) var(--ease-out)`.
- Value: 13px, `--text-muted`, `--font-ui-display`, weight 600, `min-width: 56`, right-aligned.

---

#### Ring

Donut / progress ring.

```ts
Ring({
  score?: number,         // 0-100, default 0
  size?: number,          // SVG size px, default 92
  stroke?: number,        // ring stroke width, default 8
  color?: string,         // override auto-color
  label?: string,         // small label below score number
})
```

- Auto-color logic: `score >= 80` → `C.green`; `score >= 67` → `C.amber`; else `C.clay`.
- Track circle: `C.soft` fill-none stroke.
- Progress arc: `strokeDasharray = circumference`, `strokeDashoffset = c * (1 - score/100)`, rotated -90°; CSS transition `stroke-dashoffset var(--dur-slow) var(--ease-out)`.
- Center score text: `font-family: --font-ui-display`, weight 700, `fontSize: size * 0.28`, `--text-strong`.
- Optional `label`: 9.5px, `--text-muted`, `letter-spacing: 0.08em`, centered below score.

---

#### GeoConcentration

Stylized, painterly geographic concentration plot — abstract concentric ellipse rings with deterministic clustered dots. Not a real map; purely on-brand.

```ts
GeoConcentration({
  height?: number,        // SVG height, default 320
  radiusMiles?: number,   // radius label for the annotation, default 5
  pct?: number,           // percentage of "local" dots (0-100), default 82
})
```

- Fixed `W = 520`; center at `(W/2, height/2)`.
- Radial glow: `<ellipse>` filled with `radialGradient` from `--ss-blue-500` at 0.14 opacity to 0.
- Three concentric ellipses at ring fractions `[0.92, 0.66, 0.4]` of maxR; middle ring (index 1) is `--ss-blue-500` dashed, others are `--border-hairline`.
- 140 deterministic dots (seeded LCG `seed=7`): `pct/100` fraction placed close-in (radius `maxR * 0.36 * sqrt(rnd)`) in `--ss-blue-500`; remainder at outer radii in `--ss-muted`.
- Two hardcoded store markers: `<circle>` in `--ss-clay-500` with white border + faint outer ring, at offsets `[-0.12, -0.04]` and `[0.12, 0.06]` from center.
- Annotation text: `"{radiusMiles}-mile radius · {pct}%"`, 11.5px, weight 700, `--ss-blue-700`.
- Dots use `React.useMemo` keyed on `[height, pct]`.

---

### (d) Shared Helpers — `ui.jsx`

**Source:** `/Users/satya/simplesense.co/simplesense-design-system/project/ui_kits/app/ui.jsx`

Shared view layout primitives for the operator-app. Exposed on `window.SSUI`. All are pure React, no external dependencies.

---

**`ViewHeader({ eyebrow, title, sub, children })`**

Editorial page header. Flex row, space-between, wraps.

- `eyebrow`: 11px, weight 600, 0.16em tracking, uppercase, `--accent` color — the `ss-eyebrow` class.
- `title`: `<h1>` in `--font-display`, weight 400, 38px, letterSpacing -0.015em, lineHeight 1.05.
- `sub`: `<p>` 15px, `--text-body`, maxWidth 64ch.
- `children`: right-side slot (flex row, gap 10) for actions/controls.

---

**`SectionLabel({ children, right })`**

Section heading above a content block.

- `children`: `<h2>` in `--font-ui-display`, weight 700, 16px, letterSpacing -0.01em, `--text-strong`.
- `right`: optional right-side element, 12.5px, `--text-muted`.

---

**`Panel({ title, sub, right, padding, children, style })`**

Titled card panel. `padding` defaults to `22`.

- Root: `background: --surface-card`, `border: 1px solid --border-hairline`, `border-radius: --radius-lg`, `box-shadow: --shadow-xs`.
- Header row (only rendered if `title || right`): title (15.5px, `--font-ui-display`, weight 700, `--text-strong`) + optional `sub` (13px, `--text-muted`, marginTop 3) on left; `right` element on right.
- `style` spread onto root div.

---

**`SegToggle({ options, value, onChange, size })`**

Segmented pill control. `size` is `"sm"` or `"md"` (default `"md"`).

- `options`: `Array<{ id: string; label: string; icon?: string }>` — Bootstrap Icons name via `bi bi-{icon}`.
- `value`: currently selected `id`.
- `onChange(id)`: called on button click.
- Active pill: `background: --surface-card`, weight 600, `--text-strong`, `box-shadow: --shadow-xs`.
- Inactive pill: transparent background, weight 500, `--text-muted`.
- Padding: `sm` → `"5px 12px"` / `"md"` → `"7px 15px"`; font-size: `sm` → 12.5 / `"md"` → 13.5.

---

**`Stat({ label, value, delta, deltaTone, sub })`**

Inline stat — label above a large serif value with optional delta.

- `label`: 12.5px, `--text-muted`, weight 500.
- `value`: `--font-ui-display`, weight 700, 28px, letterSpacing -0.02em, `--text-strong`, lineHeight 1.
- `delta`: 12.5px, weight 600; color from `deltaTone` map → `success / warning / danger / clay / primary / neutral` → respective CSS vars.
- `sub`: 12px, `--text-muted`, marginTop 4.
- `deltaTone` defaults to `"success"`.

---

**`Grounded({ children, icon })`**

Evidence / grounding note line — the brand's "show your working" element. `icon` defaults to `"shield-check"`.

- Flex row, gap 9, 13px, `--text-muted`, lineHeight 1.5.
- Icon: `bi bi-{icon}`, color `--ss-blue-500`, marginTop 2, flexShrink 0.

---

## 4. App Screens

### Shell Layout

The app shell is defined across `App.jsx`, `Sidebar.jsx`, and `index.html`.

**Fixed left sidebar** — `position: fixed; inset: 0 auto 0 0; width: var(--sidebar-width)` (CSS variable resolves to **16.5 rem** / 264 px). Background `var(--surface-card)`, right border `var(--border-hairline)`, z-index 30. Contains: logo lockup (blue `S` glyph + "SimpleSense" in display font), scrollable `<nav>` block, and a pinned account footer (Avatar + store name/plan + chevron-expand icon).

**Sticky blurred topbar** — `position: sticky; top: 0; height: var(--topbar-height)` (**4 rem** / 64 px). Background is `color-mix(in srgb, var(--surface-card) 90%, transparent)` with `backdrop-filter: blur(10px)`, z-index 20. Contains: search input (max-width 420 px, placeholder "Ask about your store…"), "All sources synced" green dot status, bell icon button, and a primary "Connect a source" button that navigates to Connections.

**Content area** — `margin-left: var(--sidebar-width)`. Inner `<main>` has `padding: 26px 28px; max-width: var(--container-max); margin: 0 auto` — the container max resolves to **1500 px**, centered.

---

### Nav Inventory

Three groups, nine items total. Badge background is `var(--ss-clay-500)` (orange), text white.

| Group | Label | `bi` icon | Badge |
|---|---|---|---|
| Operate | This week's moves | `compass` | `3` |
| Operate | Store audit | `clipboard-data` | — |
| Operate | Monitoring | `activity` | — |
| Understand | Customers | `people` | — |
| Understand | Geography | `geo-alt` | — |
| Understand | Products | `box-seam` | — |
| Account | Connections | `plug` | — |
| Account | Plans & billing | `credit-card` | — |
| Account | Settings | `gear` | — |

Active state: `background: var(--ss-blue-50); color: var(--ss-blue-700); font-weight: 600`. Icon color switches to `var(--ss-blue-500)`.

---

### View Descriptions

#### Dashboard — "This week's moves" (Slice 7)

**Purpose.** The primary operator view. Presents the week's ranked AI moves with apply/undo capability and four KPI tiles. Renders on view key `dashboard` and is the default route.

**Components.** `ViewHeader`, `SegToggle` (Digest / Focus / Briefing), `KpiTile` (local, uses `Sparkline` from `SSCharts`), `MoveCard` (design-system component), `MoveRow` (compact inline), `AppliedRow`, `Badge`, `Button`, `Panel`, `SectionLabel`, `Grounded`.

**Layout & sections.**
- Eyebrow: "Monday digest · June 22", title "This week's moves", subtitle with remaining-move count.
- Toggle bar right-aligned: Digest / Focus / Briefing + "Export to Klaviyo" button.
- **KPI row**: 4-column grid. Each tile: label, bi icon, large numeric value, delta chip, `Sparkline` (84 × 32 px).
- **Digest layout**: single-column stack of full `MoveCard` components (or `AppliedRow` if applied). Clicking the card body opens `MoveDetailView`.
- **Focus layout**: 1.4fr / 1fr two-column. Left = hero move (rank 1) as full `MoveCard`. Right = `SectionLabel "Then"` + compact `MoveRow` list for moves 2–3 + `Panel` with `Grounded` blurb.
- **Briefing layout**: 300 px sticky left panel (narrative summary, lift/moves/confidence stats) + right column of `MoveRow` items + `Grounded`.

**Data rendered.** `SS_DATA.moves` (all 3) and `SS_DATA.kpis` (all 4). Local `applied` state (object keyed by move id) shared via `App` state.

**Build-slice.** Slice 7 — "This week's moves".

---

#### Move Detail — `MoveDetailView` (Slice 7 drill-down)

**Purpose.** Full-page deep-dive for a single move. Reached by clicking any move card or row; back-navigates to dashboard.

**Components.** `Badge`, `Button`, `Panel`, `SectionLabel`, `Grounded` (from `SSUI`); `Ring`, `ParetoChart`, `GeoConcentration`, `BarRows` (from `SSCharts`); `EvidenceViz` (local, dispatches on `moveId`).

**Layout & sections.**
- Back button → "Back to this week's moves".
- Rank chip (blue square) + category eyebrow.
- H1 pattern text (display font, 40 px, max 20ch).
- **1.5fr / 1fr two-column grid:**
  - Left column (scrolls): "The evidence" panel (`EvidenceViz` + `Grounded` with verbatim evidence text), "Why this matters" panel, "The move" panel (checklist of steps, each togglable, tracks `doneCount`).
  - Right rail (sticky, top 88 px): Impact panel (`impact` string in display 40 px, ranged note, `Ring` confidence donut at 64 px, "Apply this move" / "Applied" / "Schedule for later" buttons), "How we'd ship it" panel (Shopify Flow / Klaviyo / Meta & Google rows with icons).

**Data rendered.** Single `moves` entry looked up by `moveId`. `EvidenceViz` also reads `customers.paretoDeciles`, `geo.withinRadius`/`radiusMiles`, and `products` filtered to `risk === "danger"`.

**Build-slice.** Slice 7 (detail surface).

---

#### Audit — `AuditView` (Slice 8)

**Purpose.** One-time (or on-demand) health scorecard across five dimensions. Entry point to explain why moves exist. CTA links to Dashboard.

**Components.** `Card`, `Badge`, `Button`; local `Ring` SVG (92 × 92 px); hardcoded `CATS` array (not from `SS_DATA`).

**Layout & sections.**
- Eyebrow "Free audit · complete", H1 "Store audit", subtitle.
- **320 px / 1fr two-column grid:**
  - Left: `Card` with `Ring` (overall score 71), H2 "Operator score", summary blurb, "See this week's moves" CTA.
  - Right: `Card` with five category rows (score number, label, note, progress bar, `Badge`).

**Data rendered.** Five hardcoded audit categories (local `CATS` array — not from `SS_DATA`):

| Category | Score | Tone |
|---|---|---|
| Acquisition efficiency | 72 | warning |
| Retention & repeat | 84 | success |
| Conversion path | 61 | danger |
| Inventory health | 68 | warning |
| Profit visibility | 90 | success |

Overall Operator Score: **71**.

**Build-slice.** Slice 8 — Store Audit.

---

#### Monitoring — `MonitoringView` (Slice 9)

**Purpose.** Live store health pulse with real-time ticking counters, a 24-hour session sparkline, and a ranked alert feed.

**Components.** `Badge`, `Button`; `TrendLine`, `Ring` (120 px, stroke 10, label "HEALTH") from `SSCharts`; `ViewHeader`, `Panel`, `Stat`, `Grounded` from `SSUI`; inline `setInterval` animation.

**Layout & sections.**
- Eyebrow "Operate · Monitoring", title "Store health, live", "Live · all sources synced" badge.
- **300 px / 1fr two-column grid (top section):**
  - Left: `Panel` with `Ring` health score (94), "Strong & steady" label, description.
  - Right: 4-column `Stat` tile row (Orders today / Revenue today / Sessions / Conversion — all animate via interval), then `Panel` with `TrendLine` (24h sessions sampled at 7 points).
- **Alert feed panel** (full width): ranked list of 5 alerts. Each row: tone-colored icon chip, title, source + time, "Act" button for danger-tone alerts (navigates to `inventory` move).

**Data rendered.** `SS_DATA.monitoring` — `health` (94), `pulse` (orders/revenue/sessions/conv), `sessions24h` (24-element hourly array sampled at indices 0/4/8/12/16/20/23), `alerts` (5 items with tone/icon/title/time/source).

**Build-slice.** Slice 9 — Monitoring.

---

#### Customers — `CustomersView` (Slice 4 detail)

**Purpose.** Customer economics explorer: Pareto concentration, RFM-style segments, and cohort retention heatmap.

**Components.** `Badge`, `Button`; `ParetoChart`, `CohortHeatmap`, `BarRows` from `SSCharts`; `ViewHeader`, `Panel`, `SectionLabel`, `Stat`, `Grounded`, `SegToggle` from `SSUI`.

**Layout & sections.**
- Eyebrow "Understand · Customers", title "Customer economics", "Export segments" button.
- **4-column KPI row**: Total customers / VIP segment / Avg LTV / VIP LTV.
- **1.5fr / 1fr two-column grid:**
  - Left: "The Pareto reality" panel — `ParetoChart` (decile bars + cumulative curve, 264 px tall) + `Grounded` with inline CTA to open pareto move.
  - Right: "Segments" panel — 4 named segments each with count badge, revenue-share progress bar, LTV.
- **Full-width cohort panel**: `CohortHeatmap` (6 acquisition months × 6 retention periods) + SegToggle (Retention / Revenue) in header right + `Grounded` insight.

**Data rendered.** `SS_DATA.customers` — `total` (6,204), `vip` (1,240), `avgLtv` ($139), `vipLtv` ($494), `paretoDeciles` (10 values), `cohorts` (6 rows × 6 cols with nulls for future periods), `segments` (4 items: name/count/rev%/ltv/tone).

**Build-slice.** Slice 4 detail — Customer understanding.

---

#### Geography — `GeographyView` (Slice 4 detail)

**Purpose.** Customer concentration map showing how demand clusters around the two physical stores versus national ad spend. Interactive radius slider.

**Components.** `Badge`, `Button`; `GeoConcentration`, `BarRows` from `SSCharts`; `ViewHeader`, `Panel`, `Stat`, `Grounded` from `SSUI`.

**Layout & sections.**
- Eyebrow "Understand · Geography", title "Where your demand actually lives", "See the geo move" primary CTA button.
- **1.3fr / 1fr two-column grid:**
  - Left: "Concentration around your stores" panel — `GeoConcentration` SVG (320 px tall), then interactive radius control: `<input type="range" min=2 max=25>` with derived `pct` display. Pct formula: `min(96, round(58 + log2(r+1) * 14))`, bypassed to exact `82` at r=5.
  - Right: 2-column stat mini-grid (Within 5 miles / National prospecting), "Customers by region" panel with `BarRows` for 5 regions, highlighted blue insight panel with inline CTA to geo move.

**Data rendered.** `SS_DATA.geo` — `withinRadius` (82), `radiusMiles` (5), `localCustomers` (3,452), `nationalSpend` ($6,100), `regions` (5 items: name/pct/customers/tone).

**Build-slice.** Slice 4 detail — Geographic understanding.

---

#### Products — `ProductsView` (Slice 4 detail)

**Purpose.** SKU economics table with margin, velocity, inventory cover and per-SKU reorder actions. Danger banner when at-risk SKUs exist.

**Components.** `Badge`, `Button`; `ViewHeader`, `Panel`, `Stat`, `Grounded`, `SegToggle` from `SSUI`; HTML `<table>`.

**Layout & sections.**
- Eyebrow "Understand · Products", title "SKU economics", "Export CSV" button.
- **4-column KPI row**: Active SKUs / Avg margin / At-risk SKUs / Revenue at risk.
- **Danger banner** (conditional, shown when `atRisk.length > 0`): full-width red-background panel with exclamation icon, "4 hero SKUs stock out in ~11 days" copy, "Open inventory move" CTA.
- **Products table panel**: SegToggle (All / At risk / Healthy) filters rows. Columns: Product (name + SKU), Price, Margin%, Units/day, Days of cover (bar + number), Rev share%, Action (Reorder button or status badge). Cover bar color: red ≤14d, yellow ≤30d, green >30d.

**Data rendered.** `SS_DATA.products` — 8 SKUs, each with: `name`, `sku`, `price`, `margin`, `velocity` (units/day), `stock`, `cover` (days), `revShare` (%), `risk` ("danger" | "watch" | "ok").

**Build-slice.** Slice 4 detail — Product understanding.

---

#### Connections — `ConnectionsView` (Slice 2)

**Purpose.** Data-source management. Shows connected integrations with metadata and allows connecting available sources with an animated "Connecting…" progress state.

**Components.** `Badge`, `Button`; `ViewHeader`, `Panel`, `Grounded` from `SSUI`; local `ConnectionCard`.

**Layout & sections.**
- Eyebrow "Account · Connections", title "Your data sources", connected-count badge.
- **"Connected" section**: 2-column card grid. Each `ConnectionCard`: colored icon chip, name, desc, "Connected" badge + since date + record count row.
- **"Available to add" section** (when any remain unconnected): 2-column card grid. Cards show "Connect [name]" button. On click: transitions to "Connecting…" state with animated progress bar, then "connected" after 2.2 s.
- **Read-only disclaimer**: `Grounded` panel with shield-lock icon.

**Data rendered.** `SS_DATA.connections` — 6 sources: Shopify, GA4, Meta Ads, Klaviyo (status `"connected"`), Google Ads, TikTok Ads (status `"available"`). Each carries: `id`, `name`, `desc`, `status`, `since`, `icon`, `records`, `color`.

**Build-slice.** Slice 2 — Connections / data ingestion.

---

#### Billing — `BillingView` (Slice 10)

**Purpose.** Plan comparison and invoice history. Demonstrates free-audit → paid upgrade path.

**Components.** `Badge`, `Button`; `ViewHeader`, `Panel`, `SegToggle`, `Stat` from `SSUI`; local `PlanCard`; HTML `<table>`.

**Layout & sections.**
- Eyebrow "Account · Billing", title "Plans & billing", Monthly / Yearly toggle (yearly saves 23%).
- **3-column plan grid**: Free ($0, 1 source), Basic ($49mo/$39yr), Pro ($129mo/$99yr, current). Pro card has blue border/shadow. Each `PlanCard`: plan name, blurb, display-font price, feature checklist with checkmarks, CTA button (disabled if current).
- **1fr / 1.3fr two-column bottom section:**
  - Left: "This cycle" panel — Moves applied (14), Est. lift captured ($31k), ROI note ("~240× its cost this month").
  - Right: "Invoices" panel — 3-row table (date, amount, Paid badge, PDF link).

**Data rendered.** Hardcoded `PLANS` array (3 plans) and hardcoded `invoices` array (3 entries). No `SS_DATA` read; current plan is Pro (hard-coded to `p.id === "pro"`).

**Build-slice.** Slice 10 — Billing.

---

#### Settings — `SettingsView` (not a numbered slice — account config)

**Purpose.** Account profile, team management, and digest/alert preferences.

**Components.** `Badge`, `Button`, `Avatar`, `Input`; `ViewHeader`, `Panel`, `SegToggle` from `SSUI`; local `Toggle` (custom toggle switch), local `Row`.

**Layout & sections.**
- Eyebrow "Account · Settings", title "Settings".
- SegToggle tabs: Account / Team / Digest & alerts.
- **Account tab**: 1fr / 1fr grid, max 900 px. Left: "Store profile" panel (Input for name, category, locations list). Right: "Plan" panel (current plan, renewal date, "Manage plan & billing" link).
- **Team tab**: Single panel (max 760 px). List of 3 members (Avatar + name/email + role badge). "Invite" button in header. Roles: Owner / Operator / Viewer.
- **Digest & alerts tab**: max 720 px, two stacked panels. "Weekly digest": toggle for Monday digest, delivery day SegToggle (Mon/Wed/Fri), weekly summary toggle. "Alerts": critical alerts toggle, SMS toggle, auto-apply high-confidence toggle.

**Data rendered.** `SS_DATA.store` (name, category, locations) and `SS_DATA.team` (3 members with name/email/role/you fields).

**Build-slice.** Account configuration — no dedicated build slice; referenced from Settings nav item.

---

### Onboarding — `Onboarding.jsx` / `onboarding.html` (Slice 13)

**Purpose.** First-run flow before the operator app loads. Standalone HTML page (`onboarding.html`), no sidebar or topbar shell.

**Components.** `Button`, `Badge` from design system; local `Stepper`.

**Layout & sections.**
- Centered column, `max-width: 560 px`, `padding: 48px 24px 0`.
- Logo lockup at top.
- **Stepper** (4 nodes): Connect Shopify → Add sources → Read history → Your audit. Completed steps show green check, active step shows blue fill, future steps are muted.
- **Card container** (`border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-md)`, padding 38/34 px) hosts one step pane at a time.
- **Step 0 — Connect Shopify**: Badge "Step 1 · the only required one", H1, copy, Shopify source row (icon + name + desc), "Connect Shopify" primary button → simulates OAuth (2.2 s) → advances to step 1.
- **Step 1 — Add sources**: Badge "Step 2 · optional", H1, source list (GA4 / Meta Ads / Klaviyo each with connect button → 1.6 s connecting animation → done badge). "Read my history" CTA + "Skip" ghost button.
- **Step 2 — Reading history**: Animated SVG progress ring (96 px, blue stroke, percentage text), rolling stage text from `READ_STAGES` array (5 stages: orders → customers → sessions → velocity → patterns), auto-advances to step 3 at 100% after 70 ms ticks.
- **Step 3 — Audit ready**: Green check circle, "Audit complete" badge, H1 with italic clay-colored "$72k a month", three stat chips (82% local / 71% rev from top 20% / 11d to stockout), "Enter SimpleSense" link → `index.html`.
- Decorative footer blossom image (opacity 0.5, mask-fade).

**Data rendered.** No `SS_DATA` read. SOURCES array hardcoded (GA4, Meta, Klaviyo). READ_STAGES hardcoded (5 strings). Step 3 stats hardcoded from the same numbers as `SS_DATA`.

**Build-slice.** Slice 13 — Onboarding.

---

### `appData.jsx` — Seed Data Shape

`window.SS_DATA` exports six top-level objects. Their field shapes inform the Recommendation and Metric models:

**`store`** — `{ name, plan, platform, category, locations: string[], history, sources: string[] }`

**`moves`** (Recommendation model) — array of:
```
{ rank, id, category, pattern, why, moves: string[], impact, impactLow, impactHigh,
  confidence, confidencePct, evidence }
```
- `impact` is a display string ("+$4–7k / mo" or "Protects ~$18k")
- `impactLow`/`impactHigh` are numeric (same units, USD/month)
- `confidencePct` is 0–100
- `moves` is an ordered checklist of action strings
- `evidence` is a verbatim prose paragraph grounding the pattern in data

**`kpis`** (Metric model) — array of `{ label, value, delta, deltaTone, icon, spark: number[] }` where `spark` is an 8-point sparkline series.

**`customers`** — `{ total, vip, avgLtv, vipLtv, paretoDeciles: number[10], cohorts: [{ label, row: (number|null)[6] }], segments: [{ name, count, rev, ltv, tone }] }`

**`geo`** — `{ withinRadius, radiusMiles, localCustomers, nationalSpend, regions: [{ name, pct, customers, tone }] }`

**`products`** (inventory/SKU model) — array of `{ name, sku, price, margin, velocity, stock, cover, revShare, risk }` where `risk` is `"danger" | "watch" | "ok"`

**`monitoring`** — `{ health, pulse: { orders, revenue, sessions, conv }, sessions24h: number[24], alerts: [{ tone, icon, title, time, source }] }`

**`connections`** — array of `{ id, name, desc, status, since, icon, records, color }` where `status` is `"connected" | "available"`

**`team`** — array of `{ name, email, role, you? }`

---

## 5. Marketing Surface

### Shared Chrome (marketing.css)

All three pages share a single `marketing.css` file that defines the floating pill nav, CTA button, hero primitives, blossom footer, and CTA band. Page-specific styles live inline in each file. The shared stylesheet imports `../../styles.css` (the core design-system token sheet) and Bootstrap Icons.

**Layout baseline:** centered `.wrap` at `max-width: 1000–1040px`, `padding: 0 24px`. All inner sections sit within this constraint.

**Fonts/tokens in use:**
- `var(--font-display)` — display face (Instrument Serif) used for brand wordmark, hero H1, section titles, large price numerals, move pattern text
- `var(--font-ui-display)` — UI display face (Switzer Bold/700) used for step headings, card names, plan names, summary text
- `var(--font-sans)` — body/input text
- Color tokens: `var(--ss-blue-500/600)` (CTA buttons, rank badges, active states), `var(--ss-clay-300/500/600)` (italic accents, eyebrow tags, impact badges), `var(--ss-success)` + `var(--ss-success-bg)` (positive delta and impact badges), `var(--ss-ink)` (dark CTA band background), `var(--surface-page)`, `var(--surface-card)`, `var(--surface-soft)` (backgrounds), `var(--border-hairline)`, `var(--border-strong)`

---

### Page 1 — index.html (Landing — Hero & Footer)

**dsCard annotation:** `group="Marketing Site"`, `viewport="1280x900"`, `name="Landing — Hero & Footer"`, `subtitle="Warm editorial hero, floating pill nav, blossom footer"`

#### Section 1: Floating Pill Nav

Fixed to top, centered at `top: 22px`, `max-width: 1040px`, `width: 94%`. The nav container is a pill-shaped bar with `backdrop-filter: blur(14px)`, 80%-opaque `surface-card` background, and `border-radius: var(--radius-pill)`.

- Left: wordmark `SimpleSense` in `var(--font-display)` 24px
- Center: links — Product | How it works | Pricing | Story (14px, `var(--ss-ink-soft)`, hidden below 760px)
- Right: `[Get your free audit]` — blue pill CTA button with a CSS glint overlay (linear gradient highlight band), `var(--ss-blue-500)` fill, white text, 14px 600-weight

#### Section 2: Hero

`min-height: 100vh`, `padding: 150px 24px 60px`, centered column with `text-align: center`.

- **Eyebrow pill:** `NEW` tag (clay-100 background, clay-600 text, all-caps 11px) + "The prescriptive operator brain for e-commerce" (12.5px, ink-soft)
- **H1:** `Stop drowning in data. / Start executing.` — `var(--font-display)` weight 400, `clamp(42px, 8vw, 80px)`, `letter-spacing: -0.025em`, `max-width: 15ch`. "Start executing." is wrapped in `<em>`, colored `var(--ss-clay-500)`
- **Subheadline:** "SimpleSense reads your whole store — Shopify, GA4, Meta, Klaviyo — and tells you the few moves to make this week, and why." (`clamp(16px, 2vw, 19px)`, ink-soft, `max-width: 38ch`)
- **CTA row:** `[Get your free audit →]` (blue pill, 16px, btn-lg) + `[▷ Watch a 2-min tour]` (ghost pill, border-strong, same size)
- **Trust line:** "No credit card · Connect Shopify in one click · Your first 3 moves in 24 hours" (13px, text-muted)

#### Section 3: Product Preview (inline in hero)

A mock browser frame (`max-width: 960px`) with a card border, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-lg)`, padding 16px.

- Browser chrome bar: three colored dots (earth-tone palette — `#e0a98f`, `#dcc98a`, `#a9c4a0`) + title "Monday digest · Maple & Oak Goods"
- Two-column inner body (`surface-page` background, `border-radius: var(--radius-md)`):
  - **Left column — digest panel:** H3 "This week's moves" (`var(--font-ui-display)`, 26px, 700), subline "Generated Monday, 6:00 AM · 3.2 yrs analyzed" (12px, muted). Three mini-metrics separated by hairline borders: `1.8% conversion (+0.4pt)`, `38% repeat revenue (+5pt)`, `$72k est. lift on table (3 moves)` — value at 20px bold, label at 13px muted, delta right-aligned at 12px 600-weight
  - **Right column — move card:** rank badge `1` (`var(--ss-blue-500)` square, Instrument Serif 18px), category label "Geographic concentration" (10.5px, 0.14em letterspacing, `var(--accent)`), impact badge "+$4–7k/mo" (ss-success color + background, pill). Pattern text "82% of your customers live within 5 miles of your stores." (Switzer 600, 19px). Three checklist items with `bi-check2` success-colored icons: "Geo-fence Meta & Google to a 5-mile radius", "Turn on local pickup (BOPIS) via Shopify Flow", "Shift budget from national spray to local high-intent"

#### Section 4: Integrations/Logos Band

`padding: 40px 24px 10px`, centered.

- Caption: "Reads the whole stack" (12px, 0.14em letterspacing, uppercase, text-muted)
- Icon + label row at 70% opacity, centered, gap 40px, flex-wrap: Shopify | GA4 | Meta | Google Ads | Klaviyo (Bootstrap Icons + 17px 600-weight text, ink-soft)

#### Section 5: Blossom Footer

`margin-top: 80px`, `padding: 64px 7vw 40px`. Has an absolute-positioned decorative image panel (`footer-blossom.jpg`) covering the right 46% with a leftward fade gradient overlay (hidden below 860px breakpoint).

Three-column grid (`max-width: 1000px`, `1.5fr 1fr 1fr`):

1. **Brand column:** wordmark "SimpleSense" in `var(--font-display)` 38px; tagline "The co-pilot every $1–15M store has been missing — operator judgment, at software price." (14px, ink-soft, `max-width: 30ch`); email subscription row (input + "Start free" CTA button)
2. **Product column:** links — How it works, Free audit, Pricing, Integrations
3. **Company column:** links — Story, Build in public, Privacy, Terms

Footer base bar (bordered top, `max-width: 1000px`): copyright "© 2026 SimpleSense.co · Made by an operator who has run the stores." (13px, muted) + social icons (Twitter/X, LinkedIn, GitHub) in `var(--ss-clay-500)`

---

### Page 2 — how-it-works.html

**dsCard annotation:** `group="Marketing Site"`, `viewport="1280x900"`, `name="How it works"`, `subtitle="The process + the anatomy of a move (Pattern → Why → Move → Impact)"`

Loads `marketing.css`. Inner `.wrap` at `max-width: 1000px`.

#### Section 1: Floating Pill Nav

Same structure as landing. "How it works" link marked `class="active"` (text-strong, 600-weight). CTA links to `../app/onboarding.html`.

#### Section 2: Hero (m-hero class)

`padding: 150px 24px 40px`, centered column.

- **Eyebrow pill:** `HOW IT WORKS` tag + "From your numbers to your next move"
- **H1:** `Not another dashboard. / A co-pilot.` — `var(--font-display)` weight 400, `clamp(40px, 7vw, 70px)`. "A co-pilot." in `<em>`, `var(--ss-clay-500)`
- **Subheadline:** "Everyone else sells a better rear-view mirror. SimpleSense reads your whole store and tells you where to turn next — ranked, grounded, and ready to ship." (`clamp(16px, 2vw, 19px)`, ink-soft, `max-width: 42ch`)
- **Single CTA:** `[Read my store free →]` (blue pill, btn-lg)

#### Section 3: Process Steps (3 cards)

Grid of three stacked step cards. Each card: `background: surface-card`, 1px hairline border, `border-radius: var(--radius-xl)`, `shadow-xs`, `padding: 30px 32px`. Two-column layout `84px 1fr` — large italic step number left (Instrument Serif, 56px, `var(--ss-clay-300)`), content right.

- **Step 01 — "Connect once. It reads everything."** Body: "Link Shopify in a click and add GA4, Meta, Klaviyo and the rest. SimpleSense reads your full history — every order, customer, session and dollar of spend — so nothing it tells you is a guess." Pills: Shopify, GA4, Meta, Klaviyo, Read-only
- **Step 02 — "It finds the patterns that matter."** Body: "SimpleSense connects spend to revenue across sources and surfaces the non-obvious — the geographic concentration, the under-served VIPs, the SKU about to run dry. Only what crosses a threshold worth your time." Pills: Concentration, Pareto economics, Inventory risk
- **Step 03 — "You get a ranked list of moves — and why."** Body: "Every Monday, the few highest-ROI moves land in one read, ranked by expected impact. Each one is a complete unit: the pattern, why it matters, exactly what to do, and what it's worth. Apply, and SimpleSense ships the segments and Flows for you." Pills: Ranked by impact, One-click apply, Every Monday 6 AM

#### Section 4: Anatomy of a Move

Section eyebrow: "The content unit" | H2: "The anatomy of a move" (sec-title class, `var(--font-display)`, `clamp(30px, 4.5vw, 46px)`) | subtext: "Every recommendation follows the same honest structure. No black box — you can see the working behind each call."

Two-column anatomy grid (`1.05fr 0.95fr`), collapses to single column below 820px:

**Left — live move card example:**
- Rank badge `1` (38x38, ss-blue-500), category "Geographic concentration"
- Pattern text (Instrument Serif 400, 27px): "82% of your customers live within 5 miles of your two stores."
- Why block (bordered top/bottom): "You're paying **national ad rates** to reach an audience that is effectively local — and never offering them pickup."
- Checklist (3 items, ss-success check icons): geo-fence, BOPIS, budget shift
- Footer row: impact badge "+$4–7k / mo" (clay-100 bg, clay-600 text, Switzer 700, 14px) + grounded note "3.2 yrs of order data" (ss-blue-500 shield icon)

**Right — annotation rail (4 numbered dots):**
1. Blue dot — **Pattern:** "The non-obvious finding, pulled straight from your own numbers. Specific, never generic."
2. Clay dot — **Why it matters:** "One plain-spoken line on the cost of the gap — so the move is a decision, not a mystery."
3. Success-green dot — **The move:** "The exact actions to take, in order. Apply once and SimpleSense ships the segments and Flows."
4. Ink-dark dot — **Expected impact:** "A ranged estimate — never falsely precise — modeled on your trailing-12-month figures, with its confidence."

#### Section 5: What It Reads (4-column card grid)

Section eyebrow: "Grounded, not guessed" | H2: "It only speaks from your data"

Four source cards (`grid-template-columns: repeat(4, 1fr)`, collapses 2-col below 760px), each `surface-card`, hairline border, `border-radius: var(--radius-lg)`, `shadow-xs`, `padding: 20px`:
- Shopify (green icon) — "Orders, products, customers, inventory velocity."
- GA4 (amber icon) — "Sessions, funnels and where conversion leaks."
- Meta & Google (blue icon) — "Spend, CAC and which audiences actually pay back."
- Klaviyo (burnt-orange icon) — "Flows and segments — and the channel behind your VIPs."

#### Section 6: CTA Band

Dark `var(--ss-ink)` background band, `border-radius: var(--radius-xl)`, centered text:
- **H2:** "See your first three moves in 24 hours." ("in 24 hours." in `<em>`, clay-300)
- **Body:** "Connect Shopify and get a free store audit — the gaps, your operator score, and the moves worth making this week."
- **Button:** `[Get your free audit →]` — inverted white pill button (white bg, `var(--ss-ink)` text)

#### Section 7: Blossom Footer

Identical structure to landing page footer.

---

### Page 3 — pricing.html

**dsCard annotation:** `group="Marketing Site"`, `viewport="1280x900"`, `name="Pricing"`, `subtitle="Free / Basic / Pro · monthly–yearly toggle · FAQ"`

Loads `marketing.css`. Inner `.wrap` at `max-width: 1040px`.

#### Section 1: Floating Pill Nav

Same structure. "Pricing" marked `class="active"`.

#### Section 2: Hero (m-hero class)

`padding-bottom: 8px` (tighter than other pages — plans appear immediately below).

- **Eyebrow pill:** `PRICING` tag + "Start free · pay when the moves pay off"
- **H1:** `Priced like software. / Worth like an operator.` — Instrument Serif 400, `clamp(40px, 7vw, 70px)`. "Worth like an operator." in `<em>`, clay-500
- **Subheadline:** "Begin with a free audit — no card. Upgrade when the weekly moves are already making you money." (ink-soft, `max-width: 42ch`)
- **Billing toggle:** pill-shaped toggle (surface-soft background, radius-pill): `[Monthly]` / `[Yearly · save 23%]` — "Monthly" active by default (surface-card raised state, 600-weight). "save 23%" badge in ss-success color, 11px 700-weight

#### Section 3: Pricing Plans (3-column grid)

`grid-template-columns: repeat(3, 1fr)`, gap 18px, collapses to single column (max-width 440px) below 860px. All three plans are `flex-direction: column` so CTAs pin to the bottom with `margin-top: auto`.

**Plan 1 — Free audit** (plain card, no highlight border)
- Name: "Free audit" (Switzer 700, 20px)
- Blurb: "See the gaps. No card required."
- Price: `$0`
- Billing note: "One-time, yours to keep"
- Features (4): Full store audit, Operator score, Top 3 gaps identified, 1 data source
- CTA: `[Get the free audit]` — secondary ghost button (surface-card, border-strong)

**Plan 2 — Basic** (plain card)
- Name: "Basic"
- Blurb: "Weekly moves for a focused store."
- Price: `$49/mo` monthly / `$39/mo` yearly (JS-toggled via `data-mo="49"` `data-yr="39"`)
- Billing note: "billed monthly" / "billed yearly" (toggled)
- Features (5): Everything in Free, Weekly ranked moves, 2 data sources, Email digest, 12 months of history
- CTA: `[Start Basic]` — secondary ghost button

**Plan 3 — Pro** (featured card, `class="plan feat"`)
- Border: `1.5px solid var(--ss-blue-500)`, `shadow-md` — visually elevated
- Ribbon badge: "Most popular" (top-right, ss-blue-700 text, ss-blue-50 background, pill)
- Name: "Pro"
- Blurb: "The full co-pilot, all sources."
- Price: `$129/mo` monthly / `$99/mo` yearly (JS-toggled via `data-mo="129"` `data-yr="99"`)
- Billing note: toggled same as Basic
- Features (6): Everything in Basic, All data sources, Unlimited history, Real-time alerts + SMS, Auto-apply moves, Priority support
- CTA: `[Start Pro]` — full blue `cta` class button (not secondary), `padding: 13px 20px`, 15px font, with glint overlay

**Trust line below plans** (centered, 13.5px, text-muted, shield icon in ss-blue-500): "30-day money-back. Cancel anytime. Read-only access — we never write to your store without you applying a move."

**Pricing toggle behavior (JS):** Clicking "Yearly" switches `.on` class, updates `.amt[data-mo]` elements from `data-mo` to `data-yr` values, and updates `[data-billed]` strings. Net effect: Basic drops from $49 to $39, Pro drops from $129 to $99.

#### Section 4: Value Justification Band

Inline-styled light card band (`surface-card` bg, hairline border, `shadow-sm` — not dark like the `cta-band` default):
- **H2:** "One applied move usually covers a year of Pro." ("a year of Pro." in `<em>`, `var(--ss-clay-500)`)
- **Body:** "The average store finds **$72k/mo** of lift on the table in its first audit. Pro is $129."
- **Button:** `[See your number free →]` (blue pill, btn-lg)

#### Section 5: FAQ (5 items, `<details>`/`<summary>`)

Centered column, `max-width: 760px`. Each item: hairline-bordered bottom, `padding: 20px 4px`. Summary is Switzer 600 17px, `+` icon rotates 45deg on open.

1. **"Is the audit really free?"** (open by default) — "Yes. Connect Shopify and SimpleSense reads your history and returns your operator score, the top three gaps, and what they're worth — no card, no trial clock. You only pay if you want the weekly moves."
2. **"Do you write to my store?"** — "Never without you. SimpleSense is read-only by default. It only pushes changes — Klaviyo segments, Shopify Flows, ad audiences — at the moment you apply a specific move, and you can undo any of them."
3. **"What size store is this for?"** — "Stores doing roughly $1–15M a year get the most out of it — enough history for the patterns to be real, small enough that a few right moves move the whole business."
4. **"How is impact estimated?"** — "Each move carries a ranged estimate modeled on your own trailing-12-month figures, plus a confidence score. We show the working behind every number — and we'd rather be honestly ranged than falsely precise."
5. **"Can I switch plans or cancel?"** — "Anytime, from Settings. Upgrades take effect immediately; downgrades at the end of the cycle. There's a 30-day money-back guarantee on every paid plan."

#### Section 6: CTA Band (dark)

Standard dark `var(--ss-ink)` CTA band:
- **H2:** "Your free audit is one click away." ("one click away." in `<em>`, clay-300)
- **Body:** "Connect Shopify and see the moves worth making this week — before you pay a cent."
- **Button:** `[Get your free audit →]` (inverted white pill)

#### Section 7: Blossom Footer

Identical to landing and how-it-works pages.

---

### Pricing Logic Summary

The free Audit is the primary acquisition wedge: zero friction ($0, no card, one Shopify click, result in 24 hours), permanently free and "yours to keep." It delivers operator score + top 3 gaps — enough value to demonstrate the product but gated at 1 data source. The upgrade path is:

- **Basic — $49/mo** (or $39/mo annually): adds weekly ranked moves, 2 data sources, email digest, 12-month history. Plain card, no badge.
- **Pro — $129/mo** (or $99/mo annually): "Most popular" ribbon, blue-border elevated card. Full data sources, unlimited history, real-time SMS alerts, auto-apply moves, priority support.

The annual discount is 23% across both paid tiers (Basic $49→$39, Pro $129→$99). The value-justification band below the plans anchors ROI: "$72k/mo average lift, Pro is $129" — making the software price feel trivially cheap against one applied move.

---

## 6. Analyzer & Signal Catalog

*Canonical check catalog for `packages/core`. Maps every insight in `SimpleSense_Insight_Library.md` to its analyzer, required inputs, emitted metrics, Stage-2 signal rules, and MVP status. Read in conjunction with §8.1–8.2 of `SIMPLE_SENSE_BUILD_PROMPT.md`.*

---

### Legend

| Column | Meaning |
|---|---|
| **Analyzer** | Function name in `packages/core/analyzers/` |
| **Shopify inputs** | Shopify Admin API resources required |
| **Metric key(s)** | `Metric.key` strings stored in the `Metric` table; format `<group>.<name>` |
| **Unit / Window** | Value unit and time window recorded on the metric |
| **Stage-2 signal rule** | Threshold expression that fires a `Signal`; thresholds are config in `packages/config` |
| **MVP status** | `MVP` = Shopify-data-only, ships now; `Fast-follow` = requires external data, stub behind flag |

---

### 6.1 Geography & Omnichannel

**Geo Analyzer** — `analyzeGeo(orders, customers, locations)`

This is the engine's most differentiated analyzer. It always runs (every store has ship-to addresses) but **branches on `has_physical_locations`**:

- **Branch A — `has_physical_locations = true` (omnichannel/BOPIS path):** detected by querying Shopify Locations API (`fulfillment_service = "manual"` and location type is a retail location) or by the presence of a `local pickup` delivery method on any order. In this branch the analyzer additionally computes per-store radius share and trade-area overlap between stores and sets `geo.has_physical_locations = true` on every geo metric so Stages 2–3 select the BOPIS / foot-traffic action tier.
- **Branch B — `has_physical_locations = false` (online-only path):** analyzer sets `geo.has_physical_locations = false`; Stage 3 is hard-prohibited from recommending foot-traffic or BOPIS plays; action tier becomes regional ad targeting, 3PL placement, and regional free-ship offers.

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#1** "82% of customers live within 5 mi of stores" | `analyzeGeo` — Branch A | Orders (ship-to address), Customers (address), Locations | `geo.primary_trade_area_share` (per store) | `fraction` / trailing 24m | `geo.primary_trade_area_share > 0.50` AND `has_physical_locations = true` AND ad-waste proxy (`geo.statewide_order_fraction` significantly exceeds `geo.local_order_fraction`) → severity HIGH | MVP [Omni] |
| **#2** "Two stores' trade areas overlap by ~30%" | `analyzeGeo` — Branch A | Orders (ship-to), Customers (address), Locations (2+ stores) | `geo.trade_area_overlap_fraction` (store-pair) | `fraction` / trailing 24m | `geo.trade_area_overlap_fraction > 0.20` AND `has_physical_locations = true` AND store count ≥ 2 → severity MED | MVP [Omni] |
| **#3** "1 in 6 online orders ships within 10 min of a store but no pickup offered" | `analyzeGeo` — Branch A | Orders (ship-to, delivery method), Customers (address), Locations | `geo.near_store_no_pickup_fraction` | `fraction` / trailing 24m | `geo.near_store_no_pickup_fraction > 0.10` AND `has_physical_locations = true` AND `local_pickup_enabled = false` → severity HIGH | MVP [Omni] |
| **#4** "40% of online revenue ships to 3 zip clusters — no local inventory" | `analyzeGeo` — Branch B | Orders (ship-to, revenue), Customers (address) | `geo.top_zip_cluster_revenue_share` (top 3 clusters) | `fraction` / trailing 24m | `geo.top_zip_cluster_revenue_share > 0.35` AND `has_physical_locations = false` → severity MED | MVP [Online-OK] |

**Geo analyzer supporting metrics always emitted (both branches):**

| Metric Key | Unit / Window | Notes |
|---|---|---|
| `geo.has_physical_locations` | `boolean` | Branch flag propagated to all downstream stages |
| `geo.revenue_by_region` | `USD map` / trailing 24m | Top regions by order revenue |
| `geo.customer_count_by_zip_cluster` | `count map` / trailing 24m | Zip-cluster groupings via centroid distance |
| `geo.local_pickup_enabled` | `boolean` | Derived from Shopify delivery methods |
| `geo.statewide_order_fraction` | `fraction` / trailing 24m | Orders outside top-local zip clusters |

---

### 6.2 Customer Concentration & VIPs (Pareto / RFM)

**Analyzers:** `analyzePareto(orders, customers)`, `analyzeRfm(orders, customers)`

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#5** "Top 20% of customers drive 71% of revenue — from one channel" | `analyzePareto` | Orders, Customers, Order `source_name` / UTM tags | `pareto.top20_revenue_share` | `fraction` / trailing 24m | `pareto.top20_revenue_share > 0.65` → severity HIGH | MVP [Both] |
| **#5** (channel sub-signal) | `analyzePareto` | Orders (source), Customers | `pareto.top20_primary_channel` | `string` / trailing 24m | Emitted alongside top20 signal as context for Stage 3 | MVP [Both] |
| **#6** "Top 5% of customers worth ~9x average — no VIP flow" | `analyzePareto` | Orders, Customers | `pareto.top5_revenue_share`, `pareto.top5_avg_ltv_ratio` | `fraction`, `ratio` / trailing 24m | `pareto.top5_revenue_share > 0.30` AND `pareto.top5_avg_ltv_ratio > 5.0` → severity HIGH | MVP [Both] |
| **#7** "65% revenue from repeat buyers — 80% ad spend chases new ones" | `analyzePareto` + `analyzeRfm` | Orders (is_first_order flag derivable from customer.orders_count) | `retention.repeat_revenue_share`, `retention.new_customer_revenue_share` | `fraction` / trailing 24m | `retention.repeat_revenue_share > 0.55` (high repeat) paired with channel-spend imbalance (fast-follow for spend data) → severity MED standalone, HIGH when channel data added | MVP (partial) [Both] |

**Supporting metrics:**

| Metric Key | Unit / Window |
|---|---|
| `pareto.top1_revenue_share` | `fraction` / trailing 24m |
| `pareto.top10_revenue_share` | `fraction` / trailing 24m |
| `rfm.segment_sizes` | `count map` (Champions/Loyalists/At-Risk/Lost) / trailing 24m |
| `rfm.segment_revenue_shares` | `fraction map` / trailing 24m |
| `rfm.champion_avg_order_value` | `USD` / trailing 24m |

---

### 6.3 Channel Profitability

**Analyzers:** `analyzeAcquisitionMix(orders)` (MVP, Shopify-native); `analyzeChannelLtv(orders, customers, adSpend)` (fast-follow, requires ad-spend input)

| Insight (Library #) | Analyzer | Shopify Inputs | External Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|---|
| **#8** "Most profitable customers from email/SMS; least from paid social — scaling the wrong one" | `analyzeChannelLtv` | Orders (source), Customers | Meta/Google ad spend (read API) | `channel.ltv_by_source`, `channel.cac_by_source`, `channel.ltv_cac_ratio_by_source` | `USD`, `USD`, `ratio` / trailing 24m | `channel.ltv_cac_ratio_by_source[top_spend_channel] < 3.0` AND a lower-spend channel has ratio `> 3.0` → severity HIGH | **Fast-follow** (needs ad spend) [Both] |
| **#9** "Email+SMS drives only ~9% revenue — benchmark 25–35%" | `analyzeOwnedChannel` | Orders (source/UTM) | Klaviyo revenue attribution | `owned_channel.email_sms_revenue_share` | `fraction` / trailing 24m | `owned_channel.email_sms_revenue_share < 0.15` → severity HIGH | **Fast-follow** (Klaviyo read) [Both] |
| **#10** "You have 4 flows — top stores cover 12–16" | `analyzeOwnedChannel` | None (Klaviyo only) | Klaviyo flow inventory | `owned_channel.active_flow_count`, `owned_channel.missing_flow_types` | `count`, `string[]` / point-in-time | `owned_channel.active_flow_count < 8` → severity MED; `< 5` → HIGH | **Fast-follow** (Klaviyo read) [Both] |
| **#19** "Lowest CAC channel has worst 12-month LTV" | `analyzeChannelLtv` | Orders (source), Customers | Meta/Google ad spend | `channel.min_cac_source`, `channel.min_cac_source_12m_ltv`, `channel.ltv_cac_ratio_by_source` | `string`, `USD`, `ratio map` / trailing 12m | `channel.ltv_cac_ratio_by_source[min_cac_source] < channel.ltv_cac_ratio_by_source[median_source] * 0.6` → severity HIGH | **Fast-follow** (needs ad spend) [Both] |

**MVP proxy (Shopify-native only, no external data):**

| Metric Key | Unit / Window | Notes |
|---|---|---|
| `acq_mix.revenue_by_source` | `USD map` / trailing 24m | `source_name` field on orders; approximates channel mix without spend data |
| `acq_mix.order_count_by_source` | `count map` / trailing 24m | |
| `acq_mix.first_order_aov_by_source` | `USD map` / trailing 24m | Proxy quality signal before LTV data available |

Stage-2 flags `acq_mix.*` metrics with a `CHANNEL_DATA_INCOMPLETE` severity tag so Stage 3 explicitly qualifies channel prescriptions as requiring spend verification.

---

### 6.4 Retention & Lifecycle Timing

**Analyzers:** `analyzeCohortRetention(orders, customers)`, `analyzeReplenishmentCadence(orders, lineItems, products)`

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#11** "73% of buyers never return — 2nd purchase → 54% chance of 3rd" | `analyzeCohortRetention` | Orders, Customers | `retention.one_time_buyer_rate`, `retention.p3_given_p2` | `fraction` / trailing 24m | `retention.one_time_buyer_rate > 0.65` → severity HIGH; `retention.p3_given_p2 > 0.50` is surfaced as the "unlock" context for Stage 3 | MVP [Both] |
| **#12** "Repeat rate 18% — benchmark 25%+" | `analyzeCohortRetention` | Orders, Customers | `retention.repeat_purchase_rate`, `retention.category_benchmark_repeat_rate` | `fraction` / trailing 24m | `retention.repeat_purchase_rate < retention.category_benchmark_repeat_rate * 0.85` → severity HIGH | MVP [Both] |
| **#13** "Customers reorder every 47 days — first reminder at 90" | `analyzeReplenishmentCadence` | Orders, LineItems, Products | `replenishment.median_reorder_interval_days` (per SKU), `replenishment.store_reminder_lag_days` | `days` / trailing 24m | `replenishment.store_reminder_lag_days > replenishment.median_reorder_interval_days * 1.25` → severity HIGH | MVP [Both] |

**Supporting metrics:**

| Metric Key | Unit / Window |
|---|---|
| `retention.time_to_second_order_p50_days` | `days` / trailing 24m |
| `retention.time_to_second_order_p75_days` | `days` / trailing 24m |
| `retention.cohort_retention_by_month` | `fraction map` (month 1–12) / per acquisition cohort |
| `retention.p2_given_p1` | `fraction` / trailing 24m |
| `replenishment.repeat_sku_list` | `string[]` / trailing 24m |
| `replenishment.median_reorder_interval_by_sku` | `days map` / trailing 24m |

**Note on `retention.category_benchmark_repeat_rate`:** this is a config constant in `packages/config/benchmarks.ts` (apparel ≈ 0.23, beauty ≈ 0.40, etc.) keyed on Shopify product type. It is a hardcoded benchmark value, not computed from store data — the engine must make this explicit in Stage 3 rationale copy.

---

### 6.5 AOV, Shipping & Cart

**Analyzer:** `analyzeAovShipping(orders, store_settings)`

`store_settings` here means the free-shipping threshold configured on the Shopify store, retrievable via the `ShippingZone` / carrier service settings or a stored config value set during onboarding.

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#14** "Free-ship threshold below AOV — costing margin without lifting baskets" | `analyzeAovShipping` | Orders (total, subtotal, shipping), Store shipping settings | `aov.trailing_aov`, `aov.freeship_threshold`, `aov.freeship_threshold_gap` | `USD` / trailing 24m | `aov.freeship_threshold < aov.trailing_aov` (threshold is below AOV — merchants should target 15–30% above) → severity HIGH; `aov.freeship_threshold_gap < 0` means threshold is below AOV | MVP [Both] |
| **#15** "Shipping cost is #1 reason 7 in 10 carts abandoned — revealed only at checkout" | `analyzeAovShipping` | Orders (total, shipping revealed timing — proxy via cart abandonment rate if Shopify Checkout Analytics available) | `aov.freeship_threshold_display_timing`, `aov.cart_abandonment_proxy` | `enum(product/cart/checkout)`, `fraction` / trailing 24m | `aov.freeship_threshold_display_timing = checkout` (not shown early) AND `aov.cart_abandonment_proxy > 0.60` → severity HIGH | MVP [Both] |

**Supporting metrics:**

| Metric Key | Unit / Window |
|---|---|
| `aov.trailing_aov` | `USD` / trailing 24m |
| `aov.aov_trend_90d` | `USD` / trailing 90d (for trend line) |
| `aov.orders_with_free_shipping_fraction` | `fraction` / trailing 24m |
| `aov.avg_shipping_revenue_per_order` | `USD` / trailing 24m |

**Note:** `aov.freeship_threshold_display_timing` requires a heuristic or onboarding question (does the store show the free-ship threshold on the product page?). Default to `checkout` (conservative) if unknown; record as an open question.

---

### 6.6 Margin, Returns & Product Mix

**Analyzers:** `analyzeSkuMargin(orders, lineItems, products, returns)`, `analyzeReturns(orders, returns, lineItems, products)`

Shopify `Refund` / `Return` objects are the source for return data. The analyzer must handle stores without any return records gracefully (emit `"insufficient_data"` for return-specific sub-metrics).

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#16** "Shoe return rate 31% — 53% are fit issues" | `analyzeReturns` | Orders, LineItems, Products (type/tags), Refunds/Returns | `returns.return_rate_overall`, `returns.return_rate_by_category`, `returns.return_reason_distribution` | `fraction`, `fraction map`, `fraction map` / trailing 24m | `returns.return_rate_by_category[highest] > 0.25` → severity MED; `> 0.30` → HIGH | MVP [Online-OK] |
| **#17** "20% of SKUs drive 80% of profit — 15% lose money after returns and discounts" | `analyzeSkuMargin` | Orders, LineItems, Products, Discounts (on orders/line items), Refunds | `sku_margin.top20_profit_share`, `sku_margin.negative_margin_sku_fraction`, `sku_margin.negative_margin_sku_list` | `fraction`, `fraction`, `string[]` / trailing 24m | `sku_margin.negative_margin_sku_fraction > 0.10` → severity HIGH; `sku_margin.top20_profit_share > 0.75` → severity MED (concentration) | MVP [Both] |

**Supporting metrics:**

| Metric Key | Unit / Window |
|---|---|
| `sku_margin.net_margin_by_sku` | `USD map` / trailing 24m |
| `sku_margin.discount_drag_by_sku` | `USD map` / trailing 24m |
| `sku_margin.return_drag_by_sku` | `USD map` / trailing 24m |
| `returns.return_rate_by_sku` | `fraction map` / trailing 24m |
| `returns.top_return_reason_by_category` | `string map` / trailing 24m |
| `returns.estimated_return_processing_cost` | `USD` / trailing 24m (uses config cost-per-return estimate, not real COGS — document this) |

**True margin caveat:** Simple Sense does not have COGS data from Shopify unless the merchant has entered cost-per-item in Shopify admin. The `sku_margin` analyzer must check for `cost` field on `InventoryItem`; if absent, emit margin as revenue-net-of-discounts-and-returns only and explicitly label it `gross_revenue_contribution`, not `true_margin`. Stage 3 must surface this caveat in rationale copy.

---

### 6.7 Discounting & Pricing

**Analyzer:** `analyzeDiscounting(orders, lineItems)`

| Insight (Library #) | Analyzer | Shopify Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|
| **#18** "62% of orders use a discount code — trained customers to wait for a sale" | `analyzeDiscounting` | Orders (discount codes, discount applications), LineItems | `discounting.discount_order_rate`, `discounting.discount_revenue_share`, `discounting.avg_discount_depth` | `fraction`, `fraction`, `fraction` / trailing 24m | `discounting.discount_order_rate > 0.40` → severity MED; `> 0.55` → HIGH | MVP [Both] |

**Supporting metrics:**

| Metric Key | Unit / Window |
|---|---|
| `discounting.top_discount_codes` | `string[]` / trailing 24m |
| `discounting.discount_revenue_by_customer_segment` | `USD map` (new vs repeat) / trailing 24m |
| `discounting.full_price_revenue_share` | `fraction` / trailing 24m |
| `discounting.vip_discount_rate` | `fraction` (top 20% of customers) / trailing 24m |

---

### 6.8 Acquisition Quality & Cohort Quality

**Analyzers:** `analyzeCohortRetention` (reused), `analyzeAcquisitionMix` (reused), `analyzeChannelLtv` (fast-follow)

| Insight (Library #) | Analyzer | Shopify Inputs | External Inputs | Metric Key | Unit / Window | Stage-2 Signal Rule | MVP? |
|---|---|---|---|---|---|---|---|
| **#19** "Lowest CAC channel — worst 12m LTV" | `analyzeChannelLtv` | Orders (source), Customers | Meta/Google ad spend | `channel.ltv_cac_ratio_by_source` | `ratio map` / trailing 12m | See §6.3 above | **Fast-follow** [Both] |
| **#20** "Holiday cohort returns 17% above baseline — gift-buyers not customers" | `analyzeCohortRetention` | Orders (created_at), Customers, Refunds | — | `cohort.holiday_cohort_return_rate`, `cohort.holiday_cohort_repeat_rate`, `cohort.baseline_repeat_rate` | `fraction` / per cohort | `cohort.holiday_cohort_return_rate > cohort.baseline_return_rate * 1.10` OR `cohort.holiday_cohort_repeat_rate < cohort.baseline_repeat_rate * 0.70` → severity MED | MVP [Both] |

**Holiday cohort definition:** orders placed in November–December window; `cohort.holiday_window_months = [11, 12]` is a config constant.

---

### 6.9 New vs Returning Revenue Mix

**Analyzer:** `analyzePareto` / `analyzeCohortRetention` (derived sub-metric)

| Metric Key | Unit / Window | Signal Rule |
|---|---|---|
| `retention.new_customer_revenue_share` | `fraction` / trailing 24m | If `> 0.60` and `retention.repeat_purchase_rate < 0.25` → imbalance signal (new-acquisition dependency) → MED |
| `retention.returning_customer_revenue_share` | `fraction` / trailing 24m | Complement of above |

This sub-metric is also used as context in the discount-dependency and VIP signals.

---

### 6.10 Geo Analyzer — Full Branch Detail

```
analyzeGeo(orders, customers, locations)
│
├─ ALWAYS compute (both branches):
│   geo.revenue_by_region (country/state/DMA)
│   geo.customer_count_by_zip_cluster
│   geo.top_zip_cluster_revenue_share
│   geo.statewide_order_fraction
│   geo.has_physical_locations ← query Shopify Locations API
│   geo.local_pickup_enabled   ← scan order.delivery_method == "local"
│
├─ IF has_physical_locations = TRUE (Branch A — BOPIS path):
│   │
│   ├─ For each physical location L:
│   │   geo.primary_trade_area_share[L]     ← fraction of customers within 5mi radius
│   │   geo.near_store_no_pickup_fraction   ← online orders shipping within 10min drive
│   │                                          of any store where local_pickup_enabled=false
│   │
│   ├─ For each pair of locations (L1, L2):
│   │   geo.trade_area_overlap_fraction[L1,L2] ← customer overlap between trade areas
│   │
│   └─ Signal outputs:
│       PRIMARY_TRADE_AREA   → BOPIS/geo-fence action
│       TRADE_AREA_OVERLAP   → de-dupe targeting action
│       NEAR_STORE_NO_PICKUP → enable local pickup action
│
└─ IF has_physical_locations = FALSE (Branch B — online-only path):
    │
    ├─ geo.top_zip_cluster_revenue_share (top 3 clusters)
    │   geo.top_zip_clusters               ← list of zip codes
    │   geo.estimated_shipping_zone_cost_delta ← proxy: orders to distant zones
    │
    └─ Signal outputs:
        GEO_CLUSTER_CONCENTRATION → regional ad targeting + 3PL placement action
        (Stage 3 system prompt hard-prohibits BOPIS/foot-traffic language when
         has_physical_locations = false)
```

---

### 6.11 Complete Metric Key Reference

| Metric Key | Unit | Window | Analyzer | MVP? |
|---|---|---|---|---|
| `geo.has_physical_locations` | boolean | point-in-time | `analyzeGeo` | MVP |
| `geo.local_pickup_enabled` | boolean | point-in-time | `analyzeGeo` | MVP |
| `geo.primary_trade_area_share` | fraction | trailing 24m | `analyzeGeo` Branch A | MVP [Omni] |
| `geo.near_store_no_pickup_fraction` | fraction | trailing 24m | `analyzeGeo` Branch A | MVP [Omni] |
| `geo.trade_area_overlap_fraction` | fraction | trailing 24m | `analyzeGeo` Branch A | MVP [Omni] |
| `geo.top_zip_cluster_revenue_share` | fraction | trailing 24m | `analyzeGeo` Branch B | MVP [Online-OK] |
| `geo.revenue_by_region` | USD map | trailing 24m | `analyzeGeo` | MVP |
| `geo.statewide_order_fraction` | fraction | trailing 24m | `analyzeGeo` | MVP |
| `pareto.top1_revenue_share` | fraction | trailing 24m | `analyzePareto` | MVP |
| `pareto.top5_revenue_share` | fraction | trailing 24m | `analyzePareto` | MVP |
| `pareto.top5_avg_ltv_ratio` | ratio | trailing 24m | `analyzePareto` | MVP |
| `pareto.top10_revenue_share` | fraction | trailing 24m | `analyzePareto` | MVP |
| `pareto.top20_revenue_share` | fraction | trailing 24m | `analyzePareto` | MVP |
| `pareto.top20_primary_channel` | string | trailing 24m | `analyzePareto` | MVP |
| `rfm.segment_sizes` | count map | trailing 24m | `analyzeRfm` | MVP |
| `rfm.segment_revenue_shares` | fraction map | trailing 24m | `analyzeRfm` | MVP |
| `rfm.champion_avg_order_value` | USD | trailing 24m | `analyzeRfm` | MVP |
| `retention.repeat_purchase_rate` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.one_time_buyer_rate` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.repeat_revenue_share` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.new_customer_revenue_share` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.returning_customer_revenue_share` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.time_to_second_order_p50_days` | days | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.p2_given_p1` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.p3_given_p2` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `retention.cohort_retention_by_month` | fraction map | per cohort | `analyzeCohortRetention` | MVP |
| `retention.category_benchmark_repeat_rate` | fraction | config constant | config | MVP |
| `cohort.holiday_cohort_return_rate` | fraction | Nov–Dec cohort | `analyzeCohortRetention` | MVP |
| `cohort.holiday_cohort_repeat_rate` | fraction | Nov–Dec cohort | `analyzeCohortRetention` | MVP |
| `cohort.baseline_repeat_rate` | fraction | trailing 24m | `analyzeCohortRetention` | MVP |
| `cohort.baseline_return_rate` | fraction | trailing 24m | `analyzeReturns` | MVP |
| `replenishment.median_reorder_interval_days` | days | trailing 24m | `analyzeReplenishmentCadence` | MVP |
| `replenishment.median_reorder_interval_by_sku` | days map | trailing 24m | `analyzeReplenishmentCadence` | MVP |
| `replenishment.store_reminder_lag_days` | days | point-in-time | `analyzeReplenishmentCadence` | MVP |
| `replenishment.repeat_sku_list` | string[] | trailing 24m | `analyzeReplenishmentCadence` | MVP |
| `aov.trailing_aov` | USD | trailing 24m | `analyzeAovShipping` | MVP |
| `aov.aov_trend_90d` | USD | trailing 90d | `analyzeAovShipping` | MVP |
| `aov.freeship_threshold` | USD | point-in-time | `analyzeAovShipping` | MVP |
| `aov.freeship_threshold_gap` | USD | point-in-time | `analyzeAovShipping` | MVP |
| `aov.freeship_threshold_display_timing` | enum | point-in-time | `analyzeAovShipping` | MVP |
| `aov.cart_abandonment_proxy` | fraction | trailing 24m | `analyzeAovShipping` | MVP |
| `aov.orders_with_free_shipping_fraction` | fraction | trailing 24m | `analyzeAovShipping` | MVP |
| `sku_margin.net_margin_by_sku` | USD map | trailing 24m | `analyzeSkuMargin` | MVP |
| `sku_margin.top20_profit_share` | fraction | trailing 24m | `analyzeSkuMargin` | MVP |
| `sku_margin.negative_margin_sku_fraction` | fraction | trailing 24m | `analyzeSkuMargin` | MVP |
| `sku_margin.negative_margin_sku_list` | string[] | trailing 24m | `analyzeSkuMargin` | MVP |
| `sku_margin.discount_drag_by_sku` | USD map | trailing 24m | `analyzeSkuMargin` | MVP |
| `sku_margin.return_drag_by_sku` | USD map | trailing 24m | `analyzeSkuMargin` | MVP |
| `returns.return_rate_overall` | fraction | trailing 24m | `analyzeReturns` | MVP |
| `returns.return_rate_by_category` | fraction map | trailing 24m | `analyzeReturns` | MVP |
| `returns.return_rate_by_sku` | fraction map | trailing 24m | `analyzeReturns` | MVP |
| `returns.return_reason_distribution` | fraction map | trailing 24m | `analyzeReturns` | MVP |
| `discounting.discount_order_rate` | fraction | trailing 24m | `analyzeDiscounting` | MVP |
| `discounting.discount_revenue_share` | fraction | trailing 24m | `analyzeDiscounting` | MVP |
| `discounting.avg_discount_depth` | fraction | trailing 24m | `analyzeDiscounting` | MVP |
| `discounting.full_price_revenue_share` | fraction | trailing 24m | `analyzeDiscounting` | MVP |
| `discounting.vip_discount_rate` | fraction | trailing 24m | `analyzeDiscounting` | MVP |
| `acq_mix.revenue_by_source` | USD map | trailing 24m | `analyzeAcquisitionMix` | MVP |
| `acq_mix.order_count_by_source` | count map | trailing 24m | `analyzeAcquisitionMix` | MVP |
| `acq_mix.first_order_aov_by_source` | USD map | trailing 24m | `analyzeAcquisitionMix` | MVP |
| `channel.ltv_by_source` | USD map | trailing 24m | `analyzeChannelLtv` | **Fast-follow** |
| `channel.cac_by_source` | USD map | trailing 24m | `analyzeChannelLtv` | **Fast-follow** |
| `channel.ltv_cac_ratio_by_source` | ratio map | trailing 24m | `analyzeChannelLtv` | **Fast-follow** |
| `channel.min_cac_source` | string | trailing 24m | `analyzeChannelLtv` | **Fast-follow** |
| `owned_channel.email_sms_revenue_share` | fraction | trailing 24m | `analyzeOwnedChannel` | **Fast-follow** |
| `owned_channel.active_flow_count` | count | point-in-time | `analyzeOwnedChannel` | **Fast-follow** |
| `owned_channel.missing_flow_types` | string[] | point-in-time | `analyzeOwnedChannel` | **Fast-follow** |

---

### 6.12 Stage-2 Signal Threshold Reference

All thresholds live in `packages/config/thresholds.ts` and are never hardcoded in analyzer logic.

| Signal Type | Condition | Severity | Geo branch constraint |
|---|---|---|---|
| `VIP_OPPORTUNITY` | `pareto.top20_revenue_share > 0.65` | HIGH | none |
| `VIP_CRITICAL` | `pareto.top5_revenue_share > 0.30` AND `pareto.top5_avg_ltv_ratio > 5.0` | HIGH | none |
| `GEO_TRADE_AREA_BOPIS` | `geo.primary_trade_area_share > 0.50` AND `has_physical_locations = true` | HIGH | Branch A only |
| `GEO_NEAR_STORE_NO_PICKUP` | `geo.near_store_no_pickup_fraction > 0.10` AND `has_physical_locations = true` AND `local_pickup_enabled = false` | HIGH | Branch A only |
| `GEO_TRADE_AREA_OVERLAP` | `geo.trade_area_overlap_fraction > 0.20` AND store count ≥ 2 | MED | Branch A only |
| `GEO_CLUSTER_CONCENTRATION` | `geo.top_zip_cluster_revenue_share > 0.35` AND `has_physical_locations = false` | MED | Branch B only |
| `RETENTION_GAP` | `retention.repeat_purchase_rate < retention.category_benchmark_repeat_rate * 0.85` | HIGH | none |
| `ONE_TIME_BUYER_MASS` | `retention.one_time_buyer_rate > 0.65` | HIGH | none |
| `REPLENISHMENT_MISTIMED` | `replenishment.store_reminder_lag_days > replenishment.median_reorder_interval_days * 1.25` | HIGH | none |
| `FREESHIP_BELOW_AOV` | `aov.freeship_threshold_gap < 0` | HIGH | none |
| `FREESHIP_DISPLAY_LATE` | `aov.freeship_threshold_display_timing = checkout` AND `aov.cart_abandonment_proxy > 0.60` | HIGH | none |
| `SKU_MARGIN_NEGATIVE` | `sku_margin.negative_margin_sku_fraction > 0.10` | HIGH | none |
| `SKU_CONCENTRATION` | `sku_margin.top20_profit_share > 0.75` | MED | none |
| `RETURN_RATE_HIGH` | `returns.return_rate_by_category[highest] > 0.30` | HIGH | none |
| `RETURN_RATE_ELEVATED` | `returns.return_rate_by_category[highest] > 0.25` | MED | none |
| `DISCOUNT_DEPENDENCY` | `discounting.discount_order_rate > 0.55` | HIGH | none |
| `DISCOUNT_ELEVATED` | `discounting.discount_order_rate > 0.40` | MED | none |
| `HOLIDAY_COHORT_WEAK` | `cohort.holiday_cohort_repeat_rate < cohort.baseline_repeat_rate * 0.70` | MED | none |
| `CHANNEL_SPEND_MISMATCH` | `channel.ltv_cac_ratio_by_source[top_spend_channel] < 3.0` | HIGH | Fast-follow only |
| `OWNED_CHANNEL_UNDERWEIGHT` | `owned_channel.email_sms_revenue_share < 0.15` | HIGH | Fast-follow only |
| `FLOW_COVERAGE_LOW` | `owned_channel.active_flow_count < 8` | MED | Fast-follow only |
| `FLOW_COVERAGE_CRITICAL` | `owned_channel.active_flow_count < 5` | HIGH | Fast-follow only |

---

### 6.13 Fast-Follow Dependencies Summary

| Insight # | Analyzer | External Data Required | Integration | Status |
|---|---|---|---|---|
| #8 | `analyzeChannelLtv` | Ad spend by campaign/channel | Meta Ads API + Google Ads API (read scope) | Fast-follow: stub behind `FEATURE_CHANNEL_LTV` flag |
| #9 | `analyzeOwnedChannel` | Email/SMS revenue attribution | Klaviyo API (revenue attribution) | Fast-follow: stub behind `FEATURE_OWNED_CHANNEL` flag |
| #10 | `analyzeOwnedChannel` | Flow inventory | Klaviyo API (flows list) | Fast-follow: stub behind `FEATURE_OWNED_CHANNEL` flag |
| #19 | `analyzeChannelLtv` | Ad spend + cohort LTV join | Meta Ads API + Google Ads API (read scope) | Fast-follow: stub behind `FEATURE_CHANNEL_LTV` flag |

All four fast-follow analyzers must: (a) be present in `packages/core` as typed stubs that return `{ status: "insufficient_data", reason: "requires_external_integration" }`, (b) have their feature flags documented in `packages/config/features.ts`, and (c) never be called live in MVP builds. Stage 3 must never fabricate channel-profitability or owned-channel metrics from Shopify order data alone — if these metrics are absent, the LLM is not given those signal types.