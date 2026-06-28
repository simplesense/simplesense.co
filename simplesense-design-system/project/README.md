# SimpleSense Design System

> **The prescriptive operator brain for e‑commerce.**
> SimpleSense reads a store's full Shopify history — plus email, GA4, Meta and
> more — and tells the merchant exactly what to change next, and why. Not another
> dashboard: a ranked, weekly to‑do list that makes the owner money.

This repository is the brand & UI source of truth for **SimpleSense.co**. It
contains the color, type, spacing and motion tokens, reusable React components,
and full‑screen UI kits for the two surfaces of the product: the **marketing
site** and the **operator app** (dashboard).

---

## Sources (for the reader, in case you have access)

The system was synthesized from materials supplied by the founder:

- **Investor deck** — `Simple_Sense_Investor_Deck.pdf` (June 2026, 24 slides).
  The primary source for voice, positioning and product narrative. Key assets
  and copy were extracted to `brand/deck-content.md`.
- **Reference UI kit** — [github.com/0xe25f/athena-ui](https://github.com/0xe25f/athena-ui)
  (live: https://0xe25f.github.io/athena-ui/index.html). A polished Bootstrap
  5 admin template. We adopted its layout DNA (sidebar + topbar shell, card
  grids, metric tiles) but **warmed the palette** — Athena's cool slate/blue
  neutrals were shifted to cream/taupe per the founder's note: *"the colors are
  a bit stiff and clinical, need them to be a bit more warm."* Inter and
  Bootstrap Icons are reused directly from this repo. Explore it to build deeper
  app screens.
- **Marketing reference** — a landing spec (Instrument Serif + Inter, cream
  `#F3F4ED` hero, blue `#0871E7` CTA, full‑bleed hero video of a phone) and two
  footer screenshots with cherry‑blossom / lantern imagery (`assets/img/
  footer-*.jpeg`). These set the editorial, warm, slightly poetic tone of the
  marketing surface.

> Substitution flag: **Instrument Serif** loads from Google Fonts (no binary was
> supplied). **Inter** ships locally. If you have licensed display‑font files
> you'd prefer, drop them in `assets/fonts/` and update `tokens/fonts.css`.

---

## CONTENT FUNDAMENTALS

How SimpleSense writes. The voice is an **operator talking to another operator** —
a seasoned shopkeeper sitting next to you on Monday morning. Plain, confident,
specific, never corporate.

**Person & address.** Second person, always. *"your store," "tell you what to
change," "the 3 highest‑ROI moves I'm making this week."* The product often
speaks in first person as the co‑pilot ("Here's what I'd do"). The reader is
"you / the owner / the operator," never "users."

**Tone.** Direct and plain‑spoken to the point of bluntness. Short declaratives.
It names the pain in the merchant's own words, then answers it. Examples from the
deck:
- *"Stop drowning in data. Start executing high‑confidence moves."*
- *"Merchants aren't missing data. They're drowning in it."*
- *"Everyone else sells a better rear‑view mirror. SimpleSense is the co‑pilot
  telling you where to turn next."*
- *"You don't need more reports — you need a co‑pilot who tells you what to do
  next."*

**Structure of a recommendation** (the core content unit): **Pattern → Why →
Move → Expected impact.** Every claim is grounded in the merchant's own numbers.
e.g. *"82% of your customers come from within 5 miles of your stores → geo‑fence
Meta & Google to a 5‑mile radius → turn on local pickup."*

**Casing.** Sentence case for everything UI and headline. The one signature
exception: the wordmark and section eyebrows are rendered as **letter‑spaced
all‑caps** — `S I M P L E   S E N S E`, `T H E   P R O B L E M`. Use the
`.ss-eyebrow` class. Numbers are concrete and ranged, never falsely precise
("$1.1–1.5M", "10–15 hrs/week", "75–82% margin").

**Vocabulary.** prescriptive · moves · the next move · operator · co‑pilot ·
rear‑view mirror · flywheel · ranked · why · impact range · Monday morning.
Avoid: synergy, leverage (as verb), revolutionary, seamless, AI‑powered (we say
what it *does*, not that it uses AI).

**Emoji.** None in product or marketing copy. The deck uses a plain checkmark
(✓) to list prescribed actions and that is the only "icon glyph" allowed in
running text. No emoji anywhere.

**Numbers & evidence.** Always show the working. Pair a metric with its source or
its "so what." Confidence comes from specificity, not adjectives.

---

## VISUAL FOUNDATIONS

The look is **warm editorial confidence** — the structural rigor of a good admin
dashboard, softened with cream paper, serif display type and the occasional
hand‑painted blossom. Trustworthy like fintech, but it breathes.

**Color.** A warm‑neutral foundation (cream `#f4f1ea` page, warm‑white `#fffdf9`
cards, taupe borders `#e4ddcf`, warm near‑black ink `#211c15`) replaces Athena's
cool slate. One confident **signal blue `#0871e7`** carries all primary action,
links and brand. A **clay/terracotta `#c25a3c`** accent adds warmth to eyebrows,
highlights and the data sequence. **Blossom pink `#e8a0b4`** appears *only* as
soft decoration (illustration, gentle fills), never as UI chrome. Semantics are
warmed: green `#1f8a5b`, amber `#cd8420`, red `#c8442e`. See `tokens/colors.css`.

**Type.** Two families. **Instrument Serif** (400, + italic) for editorial
display — hero headlines, big numbers, pull quotes — set tight (`line-height
1.02`, `letter‑spacing −0.02em`) and large. **Inter** (variable 100–900) for
everything functional: UI, body, tables, captions. Italic serif is used for a
single emphasized word inside a headline. No third family in core (the landing
spec's pixel "Nokia" font is a one‑off gimmick, intentionally excluded).

**Backgrounds.** Mostly flat warm cream — calm, lots of negative space. Marketing
hero uses a **full‑bleed video/image** of the product with a faint white tint
(`bg-white/5`) overlay; the app uses flat cream. **Cherry‑blossom / lantern
photography** anchors footers and the occasional marketing band (warm, painterly,
ink‑wash aesthetic — see the supplied footer images). No mesh gradients, no
glassmorphism, no purple‑blue tech gradients.

**Spacing & layout.** 4px base scale. Generous: marketing sections breathe with
`--space-9/10` vertical rhythm; the app is denser but never cramped. App shell is
a **fixed left sidebar (16.5rem) + sticky blurred topbar (4rem)**, content capped
at 1500px and centered. Marketing is centered, max‑width ~1024–1152px, with a
fixed floating pill nav (`top‑6`, centered, backdrop blur).

**Corner radii.** Soft but not bubbly: `0.5rem` (controls), `0.75rem` (cards),
`1rem` (large cards / auth), and full **pills** for nav and marketing CTAs.

**Cards.** Warm‑white surface, 1px taupe hairline border, soft warm‑tinted
shadow (`0 8px 24px rgba(53,42,24,.09)`) — never a hard slate shadow. No
colored‑left‑border cards. No heavy outlines.

**Shadows.** Warm‑tinted and soft (`rgba(53,42,24,…)`), layered xs→lg. The blue
CTA carries a signature **inner top glint** (`inset 0 -3px 4px rgba(255,255,255,
.35)`) plus a subtle outline — lifted from the landing spec's button.

**Borders.** 1px hairlines in warm taupe (`#e4ddcf`); stronger dividers at
`#d8cfbd`. Used sparingly to separate, not to box everything in.

**Motion.** Calm and confident. Entrances fade + rise (`opacity 0→1`, `y 20→0`)
or fade + settle (`scale .95→1`) over ~1.2–1.5s on the easing
`cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out`). UI transitions are quick
(140–240ms). No bounce, no infinite decorative loops on content. Respect
`prefers-reduced-motion`.

**Hover / press.** Primary buttons darken (`blue‑500 → 600`) on hover, darken
further and don't shrink on press (`→ 700`); the glint widens slightly. Ghost /
nav items fill with a soft taupe well (`--surface-soft`) on hover. Links shift to
the darker blue. Text links and quiet actions fade in opacity. Press states use
color shift, not scale, except marketing CTAs which may nudge `scale 0.99`.

**Transparency & blur.** Reserved: the topbar and floating nav use
`backdrop-filter: blur(10px)` over a 92%‑opaque surface; the hero video gets a
5% white tint. Otherwise surfaces are opaque.

**Imagery vibe.** Warm, painterly, calm — ink‑wash blossoms, soft daylight,
muted naturals. Never cold, never neon, never heavy grain. Product imagery
(phone, app) sits in warm light.

---

## ICONOGRAPHY

**System: Bootstrap Icons** (v1, the set Athena UI ships). Outline‑first,
1.5px‑ish stroke, rounded joins, geometric — calm and legible at small sizes,
which suits the operator app. The full icon **webfont is vendored locally** at
`assets/vendor/bootstrap-icons/font/` (`bootstrap-icons.min.css` + woff/woff2);
link the CSS and use `<i class="bi bi-graph-up-arrow"></i>`. No CDN needed.

- **Stroke & fill.** Use the outline variants by default; reserve filled
  variants (`bi-*-fill`) for active/selected states and tiny status dots.
- **Sizing.** Match the text it sits with; nav/topbar icons ~1rem–1.4rem.
  Icons inherit `currentColor` — tint with text/brand tokens, never hard‑code.
- **Common glyphs in the app:** `bi-graph-up-arrow`, `bi-bag-check`,
  `bi-lightning-charge`, `bi-compass`, `bi-bullseye`, `bi-geo-alt`,
  `bi-people`, `bi-cash-coin`, `bi-arrow-right`, `bi-check2`, `bi-stars`
  (the "prescription / move" motif leans on `bi-lightning-charge` &
  `bi-compass`).
- **In running text:** a plain checkmark `✓` (U+2713) lists prescribed actions —
  the only unicode‑as‑icon usage. **No emoji** anywhere.
- **Logo / mark:** see `assets/img/` — the wordmark is set in Instrument Serif;
  avatars and an empty‑state illustration are vendored as SVG from Athena.
- **Don't:** hand‑roll one‑off SVG icons, mix in a second icon family, or use
  emoji as iconography. If a glyph is missing from Bootstrap Icons, pick the
  closest `bi-*` rather than drawing your own.

---

*(Index of files, components and UI kits is at the bottom of this README — see
"Repository index".)*

---

## Repository index

**Root**
- `styles.css` — the single entry point consumers link (a manifest of `@import`s).
- `README.md` — this guide. `SKILL.md` — Agent-Skills wrapper.
- `brand/deck-content.md` — extracted investor-deck copy & positioning lines.

**Tokens** (`tokens/`)
- `fonts.css` (Inter local + Instrument Serif via Google), `colors.css`,
  `typography.css`, `spacing.css` (radius / shadow / motion), `base.css`.

**Foundations — Design System tab** (`guidelines/`)
- Colors: brand, neutrals, semantic, data-viz · Type: display, body, scale ·
  Spacing: scale, radii, shadows · Brand: wordmark, imagery.

**Components** (`components/`) — `window.SimpleSenseDesignSystem_33cb4c`
- `core/`: Button, Badge, Card, Input, Avatar
- `app/`: MetricCard, **MoveCard** (the signature prescriptive-recommendation unit)
- Each has `.jsx` + `.d.ts` + `.prompt.md`; one `@dsCard` demo HTML per folder.

**UI kits** (`ui_kits/`)
- `marketing/index.html` — warm editorial landing: floating pill nav, serif hero,
  product preview, integrations band, blossom footer.
- `app/index.html` — operator dashboard: sidebar + topbar shell, interactive
  "This week's moves" (apply/undo) and "Store audit" views.

**Slides** (`slides/`) — investor-deck-style templates at 1280×720: title, stat,
product-in-action, closing.

**Assets** (`assets/`)
- `fonts/inter/…` · `vendor/bootstrap-icons/…` · `img/` (avatars, empty-state,
  `footer-blossom.jpg` cropped blossom art, original footer references).

> Source repos to explore for deeper app screens:
> [github.com/0xe25f/athena-ui](https://github.com/0xe25f/athena-ui) (the Bootstrap
> admin template this app surface is warmed from).
