# Compound Engineering Plan — SimpleSense Intelligence Audits

**Prepared:** Thursday 2026-07-23, Phoenix time · **For:** Claude Code, in the simplesense.co monorepo
**Companion docs (in the Startups? project):** `COMPANY_BRIEFING.md` (2026-07-21) · `simplesense-product-review-2026-07-23.md` (the A-Z review; its P0 list and do-not-touch rules still apply)
**Source of the ideas:** Problem Atlas V5 "The Commerce Sprint" (founder's document, compiled 2026-07-21)

---

## 0. Decisions locked by the founder (2026-07-23)

These answers were given explicitly. Do not re-litigate them; build to them.

1. **Scope:** Atlas ideas **01 AnswerShelf, 02 AgentReady, 03 ReviewProof, 05 ReturnLens, 08 Retention X-Ray** become **paid capabilities under simplesense.co**. Atlas ideas 04, 06, 07, 09, 10 are explicitly out.
2. **Monetization at first:** **paid concierge audits** — Stripe payment links, founder-fulfilled, $500–1,500 per audit. Subscription add-ons come later, after the core launch. **No new entitlement/billing code in this phase.**
3. **Sequencing:** **parallel tracks.** The founder still executes the P0 launch runbook (Shopify `read_all_orders` + Protected Customer Data applications, Stripe live keys, Clerk prod, demo-store fix). Module work never blocks or replaces those clicks. All five modules were chosen partly *because* they are approval-free: crawlers, CSV exports, customer-owned API keys, and public LLM APIs — nothing here waits in Shopify's queue.

**Evidence tags used throughout:**
`[LIVE]` observed on live surfaces · `[BRIEF]` company briefing · `[ATLAS]` founder's Problem Atlas V5, with its cited links · `[PLATFORM]` platform-rule source verified 2026-07-23 · `[INFER]` reviewer recommendation · `[VERIFY]` check the codebase before acting

**Standing invariants (from the A-Z review; they extend to every module):**

- **Grounding:** no number shown to a customer that wasn't computed from their data or from captured observations; missing data renders as "insufficient," never a guess. Every module's report generator runs through the existing validation layer or an equivalent. `[BRIEF §12]`
- **Honesty:** no fabricated testimonials, no overclaimed capability, no fake urgency — in product, marketing, and these audits.
- **Not-legal-advice:** ReviewProof surfaces risk patterns with citations; judgment calls route to licensed counsel, and every report footer says so. `[ATLAS]` risk notes, kept verbatim in spirit.

---

## 1. The thesis: one chassis, many rulebooks

The Atlas's own conclusion `[ATLAS §chassis]`: most of its ideas are the same machine — **ingest → normalize → judge against a rulebook → branded report → alert loop → Stripe**. SimpleSense already *is* most of that machine `[BRIEF §11A, §12]`:

| Chassis stage | Exists in SimpleSense today | Gap to build (Wave 0) |
|---|---|---|
| Ingest | Shopify OAuth streaming backfill | **S1** crawler adapter · **S2** CSV ingest kit · **S3** LLM-battery runner · Klaviyo read-only client |
| Normalize | Prisma models, org-scoped tenancy | Per-adapter normalized schemas + schema-drift detection |
| Judge | Deterministic analyzer core (pure, no I/O) | **Rulebook package format** (rules as data + detection functions) |
| Synthesize | LLM layer constrained to computed numbers + validation/grounding layer | Reuse as-is; extend prompt sets per module |
| Report | App UI (Moves) | **S4** standalone branded report engine (HTML→PDF) for audits |
| Bill | Stripe tier-gated billing (coded) | **S5** payment-link + intake form only (no entitlement work — Decision 2) |
| Alert loop | Outcome scheduler (cron-registered) | Reuse pattern for monitoring phases (later) |
| Compound | 145+ tests, wave process, security reviews | **§2 protocol below** — the formal loop |

The five modules are therefore **rulebooks + adapters + report templates**, not new products from scratch. That is the entire economic argument: each additional module should cost days, not weeks, and each delivered audit should make the next one cheaper and sharper.

---

## 2. The compounding protocol (the "CE" in this document)

The loop, per the compound-engineering method the Atlas cites ([Every — Compound Engineering](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)) `[ATLAS]`: **Plan → Work → Review → Compound.** The first three are normal engineering. The fourth is the discipline that makes month six defensible: every unit of work must leave behind an artifact that makes future work better. Concretely:

### 2.1 Repo conventions `[INFER — adapt names to the codebase's existing patterns; [VERIFY] first]`

```
packages/rulebooks/<module>/        # rules as data
  rules/<rule-id>.ts                # id, title, detection fn, severity,
                                    # citation (statute/guide/benchmark),
                                    # remediation template, version, addedBecause
  rulebook.version                  # semver — bump on any rule change
packages/adapters/<source>/         # crawler | csv | klaviyo | llm-battery
  schema-fingerprint.ts             # drift detection: expected shape hash
packages/reports/<module>/          # branded audit template + findings schema
fixtures/<module>/                  # eval corpus
  cases/<case-id>/input + golden    # golden outputs reviewed by founder
LEDGER.md                           # the compound log (see 2.4)
```

Every rule carries `addedBecause:` — the delivery, mis-parse, or complaint that created it. A rulebook is a memory, not a config file.

### 2.2 Failure → fixture, same day

Any mis-parse, false positive, wrong dollar figure, or founder-corrected finding becomes a fixture case with a golden output **before the fix is written**. This is the single non-negotiable habit. The existing test culture (145+ tests, grounding validation) `[BRIEF §13]` makes this cheap.

### 2.3 Eval gates

A module may be sold when: (a) its fixture set runs green; (b) zero grounding violations on fixtures; (c) the founder has approved one golden report end-to-end ("would I put my name on this?"). A module may be *automated further* only when three paid deliveries have been reviewed.

### 2.4 The weekly compound review (founder + Claude Code, 30 min)

Every delivery appends to `LEDGER.md`: what was delivered, hours spent, findings that landed/flopped with the buyer, rules added/retired, fixtures added, price/pitch adjustments. **The compounding metric is delivery hours per audit** — target: each module ≤4 hours/audit by its third delivery. If hours aren't falling, the compounding isn't happening; stop and fix the system, not the audit.

### 2.5 CLAUDE.md contract (append this section to the repo's CLAUDE.md)

```md
## Intelligence audit modules — working agreement
- Rulebooks are data. New detection = new rule file with citation + addedBecause.
- Every failure becomes a fixture with a golden output BEFORE the fix.
- Reports run through the grounding validator. "Insufficient" beats a guess.
- Report voice: operator-to-operator, findings → dollar frame → exact next
  step. No adjectives doing the work numbers should do.
- Never edit a golden output to make a test pass; regenerate via founder review.
- Cost: every LLM call logs tokens+$ per run-id. Batteries respect daily caps.
```

### 2.6 Cost + drift guardrails

Per-run LLM cost logging and daily caps (A-Z review item P0-C7) apply to every module — especially M1's nightly battery. Every adapter ships with a schema-fingerprint check; on drift, quarantine the run and open a fixture, don't silently mis-parse. Crawler selectors get canary fixtures (a saved page that must always parse).

---

## 3. Wave 0 — shared builds (do these once, days 1–3)

- [x] **S1 Crawler service** — `@ss/crawler`, 2026-07-29. Playwright, robots-aware (reuses `@ss/safe-fetch`'s robots.txt parser), per-domain rate limiter, retry/backoff, SSRF-safe (reuses `@ss/safe-fetch`'s IP-blocklist against Playwright's own navigation), refuses login-walled/CAPTCHA-gated pages. Serves M3 today (M2 shipped complete on static fetch alone, per PARKING_LOT.md).
- [x] **S2 CSV ingest kit** — schema sniffing for Shopify order/return exports, versioned parsers, quarantine-on-drift. Serves M5.
- [ ] **S3 LLM battery runner** — still blocked: no OpenAI/Gemini/Perplexity API keys exist in this environment, and the actual point of the module (cross-provider comparison) needs them. See PARKING_LOT.md.
- [x] **S4 Report engine** — `packages/reports/src/render-pdf.ts`, 2026-07-29. `renderReportPdf()` via headless Chromium printing `renderReportHtml`'s own output, completing the "print dialog" stopgap.
- [x] **S5 Audit intake** — landing pages + Stripe payment links live for M8/M1/M2/M5 (`/audits/<module>`); M3 ReviewProof's page is a deliberate founder pricing/positioning call, not a gap (see PARKING_LOT.md — still true even with 3 of 5 signals now real).
- [x] **S6 Capture archive** — `@ss/capture-archive`, 2026-07-29. SHA-256 re-hashed independently at archive time (never trusts a caller-supplied hash), append-only, retention-policy expiry, in-memory + JSON-file backends.
- [x] **S7 Entity registry** — `@ss/entities`, 2026-07-29. Brand/domain/marketplace/competitor registry, symmetric competitor linking, in-memory backend. Not yet wired into any module's actual run pipeline — that integration is a follow-up, see PARKING_LOT.md.

---

## 4. The five modules

Prices are the founder's Atlas figures `[ATLAS]`, editorial and adjustable. "First $" dates assume Day 1 = Thursday 2026-07-23. Kill gates are commitments, not decoration `[ATLAS §verdict]`.

### M8 · Retention X-Ray — build FIRST (the cash engine)

| Who pays | Price | First $ target | Kill gate |
|---|---|---|---|
| DTC brands $2–20M on Klaviyo | $750–1,500/audit | Sat Jul 25 | **Tue Aug 4** if 10 pitches → 0 paid audits |

**Why first:** fastest honest dollar; no market-shift bet — it monetizes the founder's 25 years of retention judgment through a repeatable engine `[ATLAS #8]`. It funds the rest of the sprint.
**Data in:** customer-created **read-only Klaviyo API key** (no OAuth review, no app store) — intake form explains key creation in 5 steps with screenshots.
**Rulebook v0 (deterministic metrics first, judgment encoded second):**
- Flow coverage vs. canonical set: welcome, abandoned checkout, abandoned browse, post-purchase, winback, sunset — present/absent/dormant.
- Revenue per recipient by flow and campaign vs. account baseline; flows underperforming their own 90-day trend.
- Cadence & fatigue: sends/subscriber/week, spam-complaint and unsubscribe trends, quiet-hours violations.
- List health: sunset policy present?, inactive share, growth vs. churn of subscribed profiles.
- Segment architecture: VIP/top-20% segment exists? at-risk segment? predicted-LTV usage?
- Discount dependency: share of campaign revenue sent with a discount code.
**Output:** ranked money-map (finding → measured evidence → $ frame → the exact fix, in the founder's operator voice), 30-day fix plan. Grounding: every $ from their Klaviyo metrics; benchmarks labeled as editorial where external.
**Compound loop:** each delivered audit → new rules (the ten misconfigurations the founder keeps seeing become rules 11–20), tightened $-frame heuristics, and one anonymized before/after stat (with client consent) for the landing page.
**Risk `[ATLAS]`:** it can quietly become consulting. Timebox: audits fund the sprint; they are not the startup.

### M1 · AnswerShelf — AI shelf-of-voice monitor

| Who pays | Price | First $ target | Kill gate |
|---|---|---|---|
| DTC brands $1–20M; agencies | $500 audit → $299–799/mo later | Mon Jul 27 | **Tue Aug 4** if <2 paid audits from 15 pitches |

**Why now `[ATLAS #1 links]`:** commerce is moving into the answer box — OpenAI's Instant Checkout (Etsy live, Shopify merchants next) on the open Agentic Commerce Protocol with Stripe; 700M+ weekly ChatGPT users. Brands can't answer "do the machines recommend us?"
**Build on S3:** 50 buying-intent prompts per niche × models (GPT/Claude/Gemini/Perplexity via API) × n≥5 samples, nightly.
**Rulebook v0:** share-of-voice per brand per prompt-cluster; first-mention rate; recommendation sentiment; cited-source domains (which pages earn the mention — feeds M2 fix sprints); competitor deltas; week-over-week trend.
**Statistical honesty (this is the grounding invariant applied to stochastic data):** report **aggregates with sample counts and week-over-week trendlines only** — never single-shot claims `[ATLAS risk]`. Small samples render as "insufficient."
**Output:** branded weekly/one-time report: "You appear in 12% of high-intent answers in your category; Competitor X in 41%; here are the 6 pages the models cite when they recommend them."
**Moat:** longitudinal share-of-voice history a new entrant can't backfill — the archive appreciates daily, so **start the nightly battery for the first 3 pitch niches immediately, before the first sale.**
**Compound loop:** every audit adds a niche prompt-set to the library; mis-attributed brand mentions become fixtures.

### M2 · AgentReady — agentic-commerce readiness audit

| Who pays | Price | First $ target | Kill gate |
|---|---|---|---|
| Shopify DTC brands; devshops white-label | Free scan → $1.5–5k fix sprint | Wed Jul 29 | **Tue Aug 11** if free scans convert 0 sprints |

**Why now `[ATLAS #2 links]`:** ACP is an open standard (Stripe: enable agentic payments "in as little as one line of code"); most SMB storefronts have broken structured data and policies buried in images. Someone gets to be the inspector.
**Build on S1:** crawl PDP/collection/policy pages → rubric score 0–100.
**Rubric v0:** schema.org `Product`/`Offer`/`AggregateRating` validity + coverage; price/availability machine-readability; variant parseability; shipping/returns policies as text (not images) and structured where possible; feed presence (Merchant Center); agent-hostile signals (login-walled PDPs, CAPTCHA on product pages, JS-only price rendering); ACP-readiness checklist `[ATLAS]`.
**Output:** free public scanner at `/audits/agent-ready` (URL → score + top 5 gaps) as lead magnet; paid deliverable = full gap report + **fix sprint** (JSON-LD templates, feed corrections, policy pages) delivered as PRs or a change doc.
**Pairing (one pitch, two products):** AnswerShelf measures → AgentReady fixes → re-measure in 4 weeks. The before/after dataset of what actually moves agent visibility is the compounding asset `[ATLAS]`.
**Risk `[ATLAS]`:** protocol churn — position as "agent-readiness," never one spec.

### M3 · ReviewProof — review-compliance radar

| Who pays | Price | First $ target | Kill gate |
|---|---|---|---|
| DTC brands, marketplaces, agencies | $750 audit → $199/mo monitoring later | Fri Jul 31 | **Tue Aug 11** if compliance fear doesn't convert (it may not — that's why the gate exists `[ATLAS]`) |

**Why now `[ATLAS #3 links]`:** the FTC's Rule on Consumer Reviews and Testimonials (16 CFR Part 465, effective Oct 21 2024) authorizes civil penalties up to **$51,744 per violating review** — AI-generated reviews, bought sentiment, undisclosed insider reviews, review suppression ([eCFR Part 465](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465), [Goodwin analysis](https://www.goodwinlaw.com/en/insights/publications/2024/09/alerts-practices-cldr-ftc-finalizes-rule-on-consumer-reviews)). Note: the penalty ceiling adjusts periodically — re-verify the current figure before printing it in a report. `[INFER]`
**Build on S1 + S6:** crawl PDPs, review widgets, and review-request emails the client forwards; capture with hashes (tamper-evident findings age well).
**Rulebook v0 (each rule cites its Part 465 section):** incentivized reviews without disclosed material connection ("5 stars for a coupon" language in emails/inserts); review suppression / negative-review gating patterns; undisclosed insider/employee reviews; review reuse across substantially different products ("review hijacking"); purchased-review indicators (burst timing, template similarity) — flagged as *indicators*, never accusations.
**Output:** exposure report — per finding: the rule section, the observed evidence, remediation checklist. Footer: "risk surfacing, not legal advice; judgment calls go to counsel" `[ATLAS risk, kept verbatim]`.
**Compound loop:** every scan grows the detector corpus; monitoring subscription (monthly re-scan + alert) is the phase-2 annuity.

### M5 · ReturnLens — returns-abuse intelligence

| Who pays | Price | First $ target | Kill gate |
|---|---|---|---|
| Apparel/footwear DTC $2–50M | $1,000 audit → $299/mo scoring feed later | Wk of Aug 3 | **Tue Aug 18** if audits don't find ≥5× their cost in addressable abuse |

**Why now `[ATLAS #5 links]`:** NRF/Happy Returns project $849.9B of 2025 returns, 19.3% of online sales returned, ~9% of returns fraudulent; Appriss/Deloitte put 2024 return-and-claims fraud at $103B. Enterprise has tooling; the $2–50M brand has a spreadsheet and a hunch.
**Data in (S2):** 12 months of Shopify order + return CSV exports — no API approvals, works today regardless of Shopify review queues.
**Rulebook v0:** entity resolution across emails/addresses (+payment fingerprints if present in exports); serial-refunder scoring vs. cohort baseline; bracketing detection (multi-size same-style orders with systematic returns); wardrobing signals (return-timing distributions around events/weekends, wear-window patterns); high-return SKU clustering from return-reason text (sizing? quality? photography mismatch?); policy-tier recommendation (who keeps instant refunds, who gets inspection).
**Grounding + fairness:** outputs are "review cohorts," never auto-deny lists — false positives punish good customers `[ATLAS risk]`. Where evidence is thin (e.g., no weight data for empty-box detection), render "insufficient."
**Privacy:** process under a simple DPA; **delete raw exports after scoring** (configurable retention, default 30 days) — consistent with the SimpleSense trust posture and the A-Z review's retention rule.
**Compound loop:** cross-brand abuse-pattern library (aggregated patterns only, never one merchant's raw data exposed to another — same covenant as the SimpleSense flywheel `[BRIEF §3]`). Post-launch, the same heuristics become a native SimpleSense Move for connected stores.

---

## 5. Calendar — two tracks, one founder (Day 1 = Thu Jul 23, 2026)

**Rule that outranks everything:** the founder P0 launch runbook (Shopify `read_all_orders` + PCD applications, Stripe live, Clerk prod, secrets rotation, demo fix — per the A-Z review) is executed *this week* regardless of module progress. Modules are what Claude Code does while Shopify's review clock runs.

### Track F — founder actions (mostly clicks and pitches, ≤1–2 hrs/day)

| When | Action |
|---|---|
| Thu Jul 23 – Fri Jul 24 | Execute P0 runbook items; **file both Shopify applications** (external clocks start). Create Stripe payment links for M8 + M1 audits. |
| Fri Jul 24 – Sat Jul 25 | M8 pitch list (10 Klaviyo brands from network/communities); send first 5 pitches with a one-line teaser. Approve M8 golden report. |
| Sun Jul 26 – Mon Jul 27 | M1: pick 3 niches + 15 target brands; approve prompt batteries; send teaser-report pitches. |
| Wk of Jul 27 | Approve M2 rubric + free-scanner copy; M3 target list (brands with visible incentivized-review language). |
| Wk of Aug 3 | M5 pitch list (3 apparel brands). |
| Ongoing | Weekly 30-min compound review (§2.4). Kill-gate decisions on the dates in §4 — honored, not renegotiated. |

### Track C — Claude Code build order

| Days | Build |
|---|---|
| D1–3 (Jul 23–25) | Wave 0 shared builds S1–S7 (minimal viable versions) · **M8 end-to-end** (Klaviyo pull → rulebook → golden report) · start M1 nightly batteries for the 3 pitch niches |
| D4–6 (Jul 26–28) | M1 scoring + report → 15 teaser reports · M2 crawler rubric + free scanner page |
| D7–9 (Jul 29–31) | M2 fix-sprint playbook templates · M3 rulebook + capture-backed exposure report |
| D10–13 (Aug 1–4) | M5 CSV ingest + entity resolution + abuse heuristics + report · fixture backfill from every delivery so far · **Tue Aug 4: kill-gate review #1 (M8, M1)** |
| Wk of Aug 10 | Fixture backfill continues · monitoring-subscription design for early survivors · **Tue Aug 11: kill-gate review #2 (M2, M3)** |
| Wk of Aug 17+ | Survivors get depth (monitoring subscriptions, M2 re-scan loop) · **Tue Aug 18: M5 gate** · begin add-on/subscription billing design *only* for modules with ≥3 paid audits (Decision 2 phase 2) |

---

## 6. Cross-module compounding map (why this is one system, not five side quests)

- **S1 crawler** serves M2 + M3; every parser fix strengthens both.
- **M1 ⇄ M2** are one pitch: measure the AI shelf → sell the fix → re-measure. The before/after corpus (what changes actually move agent visibility) is the defensible dataset `[ATLAS §verdict]`.
- **M5 → SimpleSense core:** once Shopify approvals land and real stores connect, ReturnLens heuristics become native Moves (returns-abuse analyzer on connected data) — the audit business seeds the SaaS.
- **M8 → SimpleSense core:** retention findings become Klaviyo-execution Moves; audit clients are warm upgrade candidates for Pro's one-click execution.
- **M1 dogfood:** run the AnswerShelf battery on "Shopify analytics" prompts monthly — SimpleSense's own AI-shelf report is both product QA and a build-in-public marketing asset.
- **Every audit** (with consent) feeds the case-study engine the A-Z review parked at P2 — GTM ammunition manufactured by delivery work.

---

## 7. Scoreboard

Per module, tracked in `LEDGER.md` weekly: pitches sent → audits sold → delivery hours (target ≤4h by 3rd delivery) → findings-$ surfaced → buyer reaction (which findings landed) → refunds/complaints (target 0).

**August revenue hypothesis (editorial, a target to validate — not a forecast):** M8 3–5 audits ($2.3–7.5k) · M1 2–4 audits ($1–2k) · M2 0–1 sprint ($0–5k) · M3 1–2 audits ($0.8–1.5k) · M5 0–1 audit ($0–1k) ≈ **$4–17k total**, against near-zero marginal infrastructure cost. The real August prize isn't the dollars; it's ≥10 delivered audits generating rules, fixtures, testimonials, and warm upgrade candidates for the core product.

---

## 8. Do-not-build firewall (unchanged in spirit from the A-Z review)

- Atlas ideas 04 DisputeKit, 06 TariffSentry, 07 FeeForensics, 09 Mira, 10 StockLocal: **out** (Decision 1). Their rulebooks can be revisited only after the five in-scope modules pass or fail their gates.
- No self-serve SaaS for any module until it has ≥3 paid concierge deliveries (Decision 2).
- No new entitlement/billing code in this phase; Stripe payment links only.
- No Shopify App Store work, no embedded app, no new data-source ingests into SimpleSense core — the A-Z review's P0/P1 items and do-not-touch list stand.
- If any module work would delay a founder P0 click by even a day, the module waits.

---

## 9. Sources

**Verified 2026-07-23:** [eCFR — 16 CFR Part 465 (Rule on Consumer Reviews and Testimonials)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465) · [Goodwin — FTC finalizes rule on consumer reviews](https://www.goodwinlaw.com/en/insights/publications/2024/09/alerts-practices-cldr-ftc-finalizes-rule-on-consumer-reviews)

**Atlas-provided links `[ATLAS]` (relied on as the founder's own sourced document; spot-check before external use):** OpenAI Instant Checkout, Stripe ACP posts, Salesforce ACP release (M1/M2) · NRF/Happy Returns 2025, Appriss/Deloitte (M5) · [Every — Compound Engineering](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents) (method).

**Company context:** `COMPANY_BRIEFING.md` (2026-07-21) · `simplesense-product-review-2026-07-23.md` (A-Z review) — both in the Startups? project.

*Nothing in this document is legal advice. ReviewProof surfaces patterns against published standards; legal conclusions belong to licensed counsel. Statutory figures (e.g., the $51,744 penalty ceiling) adjust over time — re-verify before printing them in customer-facing reports.*
