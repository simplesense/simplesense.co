# Simple Sense — OPEN_QUESTIONS.md

**Living decision ledger.** Source: `SIMPLE_SENSE_BUILD_PROMPT.md` §17 (open questions) plus decisions resolved during planning. The build agent must read this file before scaffolding, treat every **PROPOSED DEFAULT** as the answer unless Satya changes it, and update the **Status** line when a decision is confirmed, changed, or newly discovered.

**Last updated:** June 27, 2026 (Phoenix)
**How to read Status:** `RESOLVED` = decided, build to it · `PROPOSED DEFAULT — proceed` = build to it now, flagged for a quick confirm, no need to wait · `CONFIRM` = build to the default but surface the exact choice to Satya early, because reversing it later is costly.

---

## A. Resolved — build to these

### 1. Brand & visual system — which brand is canonical?
- **Decision:** The warm **Simple Sense product design system** (cream `#f4f1ea` / signal-blue `#0871e7` / clay `#c25a3c`, Instrument Serif display + Inter body) is the single canonical brand. The earlier navy/teal investor deck has been **re-skinned to match** it (done this session).
- **Why:** Two competing palettes across deck + app would read as an unfinished brand to investors and early merchants. The design system is the newer, more complete artifact and governs the live product, so it wins. Build prompt §19 carries the tokens verbatim.
- **Status:** ✅ **RESOLVED.** Deck re-skinned. App/marketing must consume `packages/ui` tokens — no second palette.

### 2. Product naming & positioning
- **Decision:** Product is **"Simple Sense"**, domain **SimpleSense.co**. Recommendations are surfaced as **"Moves."** **No faith-based or cause-based positioning** in any product, marketing, or investor material.
- **Why:** Founder credibility is a trust/distribution wedge, not the pitch; faith framing stays a private anchor, out of commercial surfaces (consistent across all deliverables).
- **Status:** ✅ **RESOLVED.**

### 3. Prime directive — never fabricate data
- **Decision:** The LLM only **ranks and explains numbers that the deterministic analyzers computed**. A grounding validator rejects any recommendation containing a number not present in the computed feature set.
- **Why:** A single hallucinated "$/impact" figure shown to a merchant destroys the product's entire trust premise. This is non-negotiable (build prompt Prime Directive #1).
- **Status:** ✅ **RESOLVED.**

---

## B. Proposed defaults — proceed now, confirm at leisure

### 4. Authentication
- **Proposed default:** **Clerk** (hosted auth — organizations, sessions, social login out of the box). Fallback: **Auth.js (NextAuth)** if you'd rather avoid a paid dependency at $0 revenue.
- **Why default:** Fastest path to a secure multi-tenant boundary so engineering time goes to the prescription engine, not auth plumbing. Clerk's org model maps cleanly to "one login → one or more stores."
- **Trade-off to weigh later:** Clerk adds per-MAU cost and a vendor; Auth.js is free but more wiring and you own more security surface.
- **Status:** 🟡 **PROPOSED DEFAULT — proceed.** Reversible behind an auth interface; not worth blocking on.

### 5. Store connection model (MVP)
- **Proposed default:** **Standalone "connect your store"** (merchant authorizes via OAuth from our own web app), **not** an embedded Shopify-admin (App Bridge) app for MVP.
- **Why default:** The wedge is the free **Simple Sense Audit**, which a merchant runs before installing anything — standalone lets them connect read-only and see value first. Embedded App Bridge is heavier and better suited to a later App Store listing.
- **Trade-off to weigh later:** App Store distribution eventually wants an embedded experience; plan a migration path, but it isn't the MVP.
- **Status:** 🟡 **PROPOSED DEFAULT — proceed.**

### 6. Analytics datastore (MVP)
- **Proposed default:** **Postgres only** (via Prisma) for the analyzers. Introduce **DuckDB** later only if per-store query latency on multi-year history demands it.
- **Why default:** Postgres covers 3–5 yrs of a single SMB store's orders comfortably; adding a second engine now is premature optimization.
- **Trade-off to weigh later:** Very large stores or heavy cohort scans may justify columnar (DuckDB) — revisit on real data, not in advance.
- **Status:** 🟡 **PROPOSED DEFAULT — proceed.**

### 7. Provider keys Satya must supply
- **Decision (action item for Satya, not the agent):** The build needs these provisioned (the agent will read them from env, never hardcode):
  - Shopify **dev/partner store** + API credentials
  - **Anthropic** API key
  - **Stripe** (test mode) keys
  - **Inngest** (background jobs) keys
  - **Neon** or **Supabase** (Postgres) connection string
  - **Clerk** keys (per #4)
  - **Resend** (transactional email) key
- **Why:** These gate the first end-to-end run (ingest → analyze → prescribe → bill). Everything else can scaffold without them.
- **Status:** 🟡 **ACTION — Satya to provision.** Agent proceeds with mocked env until supplied; flags any blocked slice.

### 8. Display-font licensing (Instrument Serif)
- **Decision:** Instrument Serif is **Google Fonts (SIL Open Font License)** — free for commercial/web/embedding use. The design-system bundle references it via Google Fonts and does **not** ship a licensed binary.
- **Why it's flagged:** For self-hosting (offline builds, the investor PDF, or embedding in PowerPoint), add the actual `.ttf`/`.woff2` to the repo so production doesn't silently fall back to a default serif. (For this session's deck render, the OFL TTFs were installed locally so the PDF renders true.)
- **Status:** 🟡 **PROPOSED DEFAULT — proceed.** Confirm: self-host the OFL files in `packages/ui/fonts/` for production rather than relying on the Google CDN. Same check applies to Inter (already local woff2) and Manrope (app-UI only).

---

## C. Confirm early — building to the default, but tell me before it's expensive to change

### 9. Pricing tier split — Basic $49 / Pro $99
- **Proposed default:** Two tiers (deliberately under Triple Whale ~$99–219+ and Polar ~$300–750+), with a **free Simple Sense Audit** as the front door:

  | | **Basic — $49/mo** | **Pro — $99/mo** |
  |---|---|---|
  | Ranked **Moves** (core engine) | ✅ | ✅ |
  | Free store Audit | ✅ | ✅ |
  | Stores included | 1 | Multi-store |
  | Cohort / LTV / retention depth | basic | ✅ full |
  | Integration **exports** + one-click actions (Klaviyo, Shopify Flow, ads) | export only | ✅ one-click |
  | Outcome-tracking depth (the flywheel loop) | summary | ✅ full |
  | Re-analysis frequency | standard | more frequent |
  | API access | — | ✅ |
  | Priority support | — | ✅ |

- **Why confirm:** The exact feature line between Basic and Pro drives blended ARPU (~$68→$82/mo in the model), the upgrade narrative, and what gets gated in the UI — changing it after build means re-touching billing, entitlements, and several screens.
- **Status:** 🟠 **CONFIRM exact split.** Default above is buildable today; flag for Satya's sign-off before wiring Stripe entitlements.

### 10. Attribution / outcome window
- **Proposed default:** **30-day** window to attribute a measured lift to an implemented Move.
- **Why confirm:** This is the unit of truth for the outcome-data flywheel and for "stores like yours saw Y from X" claims. Too short understates slow-burn moves (e.g., VIP flows); too long muddies causality. 30 days is a defensible commerce default but is a real modeling choice.
- **Status:** 🟠 **CONFIRM.** Build to 30 days, make it a config constant, surface for Satya's call.

### 11. LLM model + token budget
- **Proposed default:** Use the **current production Claude model** at build time, with model name and a per-analysis **token budget set via env** (not hardcoded), so it can be swapped without code changes.
- **Why confirm:** Model choice affects synthesis quality and per-store inference cost (the variable-cost swing factor in unit economics). Pin the exact model string at build start.
- **Status:** 🟠 **CONFIRM model string at build start.** Architecture is model-agnostic; just needs the current name.

---

## D. Newly discovered during build (agent appends below)

_The build agent adds any decision it hits that isn't covered above — with its chosen default, a one-line rationale, and a Status — so this stays the single decision record._

- **D.1 — Local/test database engine.** Host has no Docker/Postgres/`psql`, and §5
  assumed managed Postgres. **Default chosen:** PGlite (embedded WASM Postgres) when
  `DATABASE_URL` is empty; Neon/Supabase via `DATABASE_URL` in prod. Prisma schema is
  the single source of truth. Risk: **low** (real PG semantics; reversible). See ADR-002.
- **D.2 — Package manager.** No global `pnpm`; global npm install lacked perms. **Default:**
  pnpm via corepack, pinned `pnpm@9.15.0` in `packageManager`. Risk: **low**. See ADR-003.
- **D.3 — Default `LLM_MODEL`.** Set `claude-sonnet-4-6` as the cost-balanced default for
  Stage-3 synthesis (env-overridable; Opus tier available for higher quality). Aligns with
  the "prefer lowest-cost workable tier" preference. Risk: **low** (model-agnostic engine).
  Confirm the exact current model string at launch (ties to §11). See ADR-004.
- **D.4 — Linter.** oxlint (not ESLint) for speed and to host the bundle's
  `_adherence.oxlintrc.json` brand-adherence rules. Risk: **low**. See ADR-005.
