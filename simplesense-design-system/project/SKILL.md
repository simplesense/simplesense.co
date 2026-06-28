---
name: simplesense-design
description: Use this skill to generate well-branded interfaces and assets for SimpleSense (the prescriptive operator brain for e-commerce), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Voice:** operator-to-operator, plain and confident. Second person ("your store"). Pattern → Why → Move → Impact. No emoji. See README "Content Fundamentals".
- **Look:** warm editorial — cream paper, signal-blue action, clay accent, Instrument Serif display + Inter UI. See README "Visual Foundations".
- **Tokens:** link `styles.css`; use the `--ss-*` and semantic aliases (`--surface-card`, `--action-primary`, `--text-strong`, …).
- **Components:** React primitives in `components/` (Button, Badge, Card, Input, Avatar, MetricCard, and the signature **MoveCard**). Load `_ds_bundle.js`, read from `window.SimpleSenseDesignSystem_33cb4c`.
- **Full screens:** `ui_kits/marketing/` (landing) and `ui_kits/app/` (operator dashboard). `slides/` has investor-deck-style slide templates.
- **Icons:** Bootstrap Icons, vendored at `assets/vendor/bootstrap-icons/`. Use `<i class="bi bi-…">`.
