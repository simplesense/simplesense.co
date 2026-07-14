# GO_LIVE.md — SimpleSense.co go-live runbook (hands-free execution)

> **Executor model: Claude Sonnet 5** (`/model claude-sonnet-5`). The 10 PLAN files were
> written by Opus specifically so a mid-tier model can execute them without questions.
> Do NOT use Haiku for the WAVE work — it under-reads multi-file slices. Haiku 4.5 is fine
> for the VERIFY-ONLY loop at the bottom.
>
> **Kickoff prompt (paste into a fresh `claude` session in this repo):**
> ```
> Read GO_LIVE.md and execute THE LOOP starting at the first unchecked [ ] item.
> Work hands-free: do not ask me questions unless a HARD RAIL forces escalation.
> ```

---

## 0 · Mission and definition of "live"

SimpleSense is already deployed at https://simplesense.co (Fly app `simplesense-co`).
"Go live" here means **ready for the first REAL paying merchant**, which decomposes into:

- **G1** — A merchant can connect a real Shopify store and the funnel carries them to
  moves with zero manual intervention (auto-sync, onboarding completes, no OOM on
  large stores).
- **G2** — The flywheel is real: applied moves get measured, stores get re-analyzed on
  a schedule (not only on click).
- **G3** — Money paths are hardened BEFORE live Stripe keys are pasted (portal, grace
  period, checkout confirmation, customer-id capture).
- **G4** — Honesty invariants hold on real stores (scope-derived history labeling, real
  acquisition source, no truncated line items).
- **G5** — Quality floor: usable on a phone, hover/focus states, error boundaries, fast
  dashboard.
- **G6 (human-only)** — Satya completes the HUMAN GATE checklist (§4). The loop can
  never do these; it must never attempt them.

---

## 1 · THE LOOP (read this before touching anything)

Each iteration = **one slice**. Repeat until every checkbox in §3 is `[x]` or blocked.

1. **Re-orient.** Read `CLAUDE.md` (auto-loads `EXECUTION_PROTOCOL.md`), this file, and
   `git log --oneline -5`. If a `TASK.md` exists from an interrupted run, resume it
   instead of starting fresh.
2. **Pick** the FIRST unchecked `[ ]` item in §3 that is not marked `BLOCKED(...)`.
3. **Execute** its PLAN file end-to-end under `EXECUTION_PROTOCOL.md` (TASK.md, gates,
   test-first, minimal diff). The plan's own acceptance criteria are the contract.
4. **Gate** (must be 100% green, paste real output into TASK.md):
   `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`
5. **Commit** on `main`, one commit per slice, message explains WHY, then `git push`.
   (Docs-only commits append `[skip ci]`.)
6. **Record**: flip the §3 checkbox to `[x]` (edit THIS file), add one line to
   `PROGRESS.md`, update `STATUS.md` checklist + `updated:` date. Commit those doc
   edits with the slice or as a `[skip ci]` follow-up. Delete `TASK.md`.
7. **Deploy policy** — deploy ONLY at wave boundaries (marked 🚀 in §3), not per slice:
   ```
   fly deploy --app simplesense-co --ha=false \
     --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$(curl -s https://simplesense.co | grep -oE 'pk_(test|live)_[A-Za-z0-9]+' | head -1)
   ```
   Standing authorization: this command is PRE-APPROVED by Satya for wave-boundary
   deploys **only when** the full gate passed on the exact commit being deployed.
   NOTE (learned at W2.3): the session's auto-mode permission classifier may still deny
   the raw `fly deploy` call even with the gate green, since it does not treat this
   written clause as sufficient on its own for a production deploy — it wants Satya's
   own real-time, explicitly-named approval. If denied, do not retry the same call or
   try to route around it; ask Satya directly (AskUserQuestion) with the exact command
   and gate evidence, then proceed once approved.
   After every deploy run §5 LIVE VERIFICATION and paste the output into PROGRESS.md.
   If verification fails: `fly releases --app simplesense-co` → note the failure in
   BLOCKERS.md → STOP the loop (do not retry-deploy, do not keep working on top of a
   broken prod).
8. **Continue** to the next unchecked item WITHOUT asking. If the context window is
   getting long (you've done ≥1 full slice), finish the record step, then instruct the
   human-visible transcript: start the next slice in a fresh session with the same
   kickoff prompt. Never start a new slice with a half-spent context.

### HARD RAILS (violating any of these = stop immediately)
- **Never** fabricate a number, testimonial, or capability in any user-visible surface
  (grounding invariant). Missing data renders as "insufficient"/blank.
- **Never** read, print, or commit `.env*` contents; never log secrets. (guard.sh +
  settings deny-rules enforce this — do not try to work around a denial.)
- **Never** run destructive DB commands. Schema changes are `prisma db push`
  (additive only), sourcing env from `apps/web/.env.local`.
- **Never** delete/skip a failing test or loosen an assertion to get green.
- **Two failed fixes for the same error** → write a diagnosis block in TASK.md, mark
  the §3 item `BLOCKED(reason, date)` in this file, append details to `BLOCKERS.md`
  (create if missing), commit `[skip ci]`, and move to the NEXT item. Never burn a
  session grinding one bug.
- **Anything in §4 (HUMAN GATE)** is Satya-only. If a slice truly cannot proceed
  without one (e.g. billing E2E needs live keys), do every part that IS possible
  (code + unit tests), mark the remainder `BLOCKED(human: <item>)`, and continue.
- The gate command, not memory, decides "done". No output pasted = not done.

---

## 2 · Session setup (once per fresh session)

- Repo: `/Users/satya/simplesense.co`, branch `main`, work directly on `main`
  (repo convention — no PR flow here).
- `pnpm install` only if `node_modules` is missing. No new dependencies without a
  written justification in TASK.md (D5 still applies to deps).
- The dev server (only when a slice needs visual verification):
  launch config `web` (port 3000) via the preview tools — never `pnpm dev` in Bash.

---

## 3 · WORK QUEUE (the loop's state — edit checkboxes in place)

Execute top-to-bottom. Each item names its PLAN file — the plan contains exact files,
step order, edge cases, and acceptance criteria. Do not improvise beyond the plan;
log tempting extras under "Follow-ups" in TASK.md.

### WAVE 1 — First-merchant critical path (G1)
- [x] **W1.1 First-run funnel** — `PLAN-first-run-funnel.md`
      Auto-sync on OAuth callback, onboarding step-3 completion, connect-form
      validation. The first real merchant hits this within days.
- [x] **W1.2 Sync scale** — `PLAN-sync-scale.md`
      Streaming ingest (no full-store RAM materialization → no OOM on 1GB machine),
      nested line-item pagination (>20 items), real `firstOrderAt`.
- [x] **W1.3 Scope-grant tracking** — `PLAN-scope-grant-tracking.md`
      Persist granted scopes from the token exchange; derive `historyLimited` from
      reality; one-click re-consent path. (abb2014; screen checks pending migrate deploy)
- [x] **W1.4 Acquisition source** — `PLAN-acquisition-source.md`
      Request `Order.sourceName` in the reader (one field, zero cost) so the
      acquisition metric works on real stores.
- [x] 🚀 **W1.5 Deploy + §5 verification** — wave boundary deploy per §1.7.
      Migration `20260706000001_store_granted_scopes` applied to Supabase (additive,
      confirmed via `prisma migrate status`: "Database schema is up to date!"). Deployed
      version 26→27; §5 LIVE VERIFICATION all pass (health ok, 5/5 pages 200, machine
      started 1/1 checks, no app stack traces in logs). Visual screen checks of the
      re-grant banner are BLOCKED(human: §4.2 — no connected non-demo store exists yet
      to toggle); substituted an isolated DB round-trip check proving the new column
      persists correctly against the live schema. See BLOCKERS.md.

### WAVE 2 — Flywheel + revenue hardening (G2, G3)
- [x] **W2.1 Outcome scheduler** — `PLAN-outcome-scheduler.md`
      Secret-guarded `/api/cron/tick` + GitHub Actions schedule: stale-store refresh
      and due-outcome measurement against a genuinely post-window run. runTick shipped in
      @ss/jobs, route rate-limited (1/5min) + constant-time secret check, cron.yml
      registered on GitHub (`gh workflow list` confirms). Adversarial review fixed 2
      should-fix gaps (defaultRefresh test coverage, missing rate limit) before commit.
      BLOCKED(human) — `CRON_SECRET` must be set on Fly + as a GH repo secret before the
      schedule actually measures/refreshes anything in production (item logged in
      STATUS.md and BLOCKERS.md).
- [x] **W2.2 Billing go-live hardening** — `PLAN-billing-go-live.md`
      Stripe customer-id capture, `current_period_end` grace logic, checkout
      confirmation page, billing portal route. All buildable + unit-testable in test
      mode TODAY; the E2E-with-live-keys part is `BLOCKED(human)` until §4.3. Adversarial
      review fixed 2 should-fix money-path gaps (stale-webhook currentPeriodEnd regression,
      missing demo-org guard) before commit. `/plans` screen check BLOCKED(human: no
      authenticated session); Stripe portal default-configuration dashboard step also
      BLOCKED(human). See BLOCKERS.md.
- [x] 🚀 **W2.3 Deploy + §5 verification.**
      Deployed v27→v28 (machine 0800019c076918, sjc). §5 LIVE VERIFICATION all pass (health
      ok, 5/5 pages 200, machine started 1/1 checks, no app stack traces — a mid-deploy Fly
      tooling warning about "not listening" was investigated and confirmed a false positive
      by the live checks). Deploy itself required Satya's explicit real-time approval —
      this session's auto-mode classifier does not treat GO_LIVE.md's written §1.7
      pre-approval as sufficient on its own for a production deploy.

### WAVE 3 — Quality floor (G5)
- [ ] **W3.1 Interaction states + fonts + contrast** — `PLAN-interaction-states.md`
      Shared button/nav classes (hover/active/focus-visible), `next/font`, fix the
      muted-text AA contrast token (this also closes the known site-wide
      `--text-muted` 4.18:1 finding from the pricing review).
- [ ] **W3.2 Mobile app shell** — `PLAN-mobile-app-shell.md`
      Icon rail / top bar under 900px; kills the fixed-264px sidebar on phones.
- [ ] **W3.3 Dashboard query batching** — `PLAN-dashboard-query-batching.md`
      ~14–16 sequential queries → ~5–6; audit page 22 → ~3.
- [ ] **W3.4 Consolidation** — `PLAN-consolidation.md`
      Shared formatters/Notice/PageHeading/toCore/entitled-set helper + `error.tsx`
      boundaries. Pure refactor; 145+ tests must stay green.
- [ ] **W3.5 Micro-fix:** promote the `/how-it-works` hero `<h2 className="sec-title">`
      to `<h1>` (same one-line pattern as the pricing page). No plan file needed.
- [ ] 🚀 **W3.6 Deploy + §5 verification.**

### WAVE 4 — Launch readiness sweep
- [ ] **W4.1 Full-repo regression sweep**: run the gate, then `git grep -n "TODO\|FIXME\|HACK"
      apps packages` and triage each hit — fix trivial ones, log the rest in
      `OPEN_QUESTIONS.md`.
- [ ] **W4.2 Ledger truth-up**: `STATUS.md`, `PROGRESS.md`, `DECISIONS.md` reflect
      reality; every `BLOCKED(...)` item in this file has a matching BLOCKERS.md entry
      with exactly what Satya must do.
- [ ] 🚀 **W4.3 Final deploy + §5 verification + write `LAUNCH_REPORT.md`** summarizing:
      what shipped, live-verification evidence, and the §4 items still waiting on Satya.

---

## 4 · HUMAN GATE — Satya only (the loop must NEVER attempt these)

- [ ] **4.1 Shopify Partner dashboard**: add allowed redirect URL
      `https://simplesense.co/api/stores/connect/callback`; enable protected customer
      data (name/email/address) for dev stores; later: request `read_all_orders` +
      protected-data approvals for real stores.
- [ ] **4.2 First dev-store E2E**: create a dev store, seed ~15 orders, connect from
      simplesense.co/connections, confirm moves render. (The loop's W1 work makes this
      smooth; the click-through is human.)
- [ ] **4.3 Stripe**: switch to live keys; set `STRIPE_SECRET_KEY`,
      `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO` in Fly secrets
      (`fly secrets set ... --app simplesense-co`); create the live webhook endpoint.
- [ ] **4.4 Clerk**: create the production instance, swap publishable/secret keys,
      configure the prod domain.
- [ ] **4.5 Rotate the four secrets that passed through chat**: Anthropic API key,
      Supabase DB password, Shopify API secret, Clerk secret key. Update Fly secrets +
      `.env.local` afterward.
- [ ] **4.6 Life OS**: paste the fine-grained `GITHUB_PROJECTS_PAT` (Contents:read on
      the six venture repos) into Vercel so the Ventures card reads STATUS.md.

---

## 5 · LIVE VERIFICATION (run after every deploy — paste output)

```bash
# 1. health
curl -s https://simplesense.co/api/health          # expect {"status":"ok",...}
# 2. key pages return 200
for p in / /pricing /how-it-works /audit/demo /sign-up; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://simplesense.co$p)"; done
# 3. machine state
fly status --app simplesense-co                     # expect started, health checks passing
# 4. no error spike
fly logs --app simplesense-co --no-tail | tail -40  # scan for stack traces
```
Any failure → §1.7 failure path (note, BLOCKERS.md, stop).

---

## 6 · Verify-only loop (optional, Haiku-friendly)

A cheap watchdog to run between work sessions:
```
Read GO_LIVE.md §5. Run the LIVE VERIFICATION block against production. If anything
fails, append the evidence to BLOCKERS.md and say BLOCKED loudly; otherwise reply OK.
Do not modify any other file. Do not deploy.
```

---

## 7 · Progress log (loop appends one line per completed item)

| date | item | commit | notes |
|------|------|--------|-------|
| 2026-07-13 | W1.3 scope-grant tracking | abb2014 | 165 tests green; migrate deploy needed before W1.5 |
| 2026-07-13 | W1.1 First-run funnel | 3b337c5 | Auto-sync on OAuth callback (`lib/sync-runner.ts` shared by action+route), onboarding step-3 completion (any rec status != NEW), labeled+validated ConnectForm with bare-name normalization, SyncButton READY state is a real /app link. Gate green: typecheck 8/8, test 154/154 (+9 new), lint 0/0, build 16/16 routes. Screen checks deferred — no dev-server launch tool available this session (see TASK.md). |
| 2026-07-13 | W1.2 Sync scale | 41dc812 | backfillStore streams orders page-by-page (no more whole-store RAM materialization → no OOM on the 1GB Fly machine); ingest.ts split into ingestCatalog/ingestOrdersPage; orders with >20 line items fetched via per-order nested pagination instead of truncated; Customer.firstOrderAt derived from real order rows (VIP CSV export column now populates for real stores); syncStartedAt heartbeats per orders page. No schema changes. Gate green: typecheck 8/8, test 158/158 (+4 new), lint 0/0, build 16/16 routes. |
| 2026-07-13 | W1.4 Acquisition source | f182588 | `RealShopifyReader.orders()` now requests `sourceName` scalar (0 added query cost), normalizes (trim+lowercase, empty→null) via new `normalizeSource()` helper, maps it onto `Order.sourceName` instead of hard-coded null. `acquisitionAnalyzer` doc comment clarified (Shopify channel ≠ marketing attribution). No schema/ingest/demo-fixture changes — column and plumbing already existed. Gate green: typecheck 8/8, test 166/166 (+2 new), lint 0/0, build 16/16 routes. |
| 2026-07-13 | W1.5 Deploy + §5 verification | (docs-only, no code commit) | Gate re-confirmed green on 3e53abe (typecheck 8/8, test 166/166, lint 0/0, build 16/16) before touching anything. Applied migration `20260706000001_store_granted_scopes` to Supabase (`prisma migrate deploy`; `migrate status` before/after confirmed clean). Deployed v26→v27 via `fly deploy --app simplesense-co --ha=false`. §5 LIVE VERIFICATION: health ok, / /pricing /how-it-works /audit/demo /sign-up all 200, machine started 1/1 checks passing, logs show only expected transient restart health-check blip + one unrelated proxy-blocked bot probe (no app stack traces). W1.3 visual screen checks BLOCKED(human: §4.2 — no connected non-demo store exists to toggle; also no authenticated browser session in this session) — substituted an isolated create/update/null/cleanup round-trip of `grantedScopes` against the live DB, which passed, proving the migration integrates correctly. Doc fix: GO_LIVE.md's literal `source apps/web/.env.local && ...` prerequisite command needed `set -a`/`set +a` around it — bare `source` doesn't export vars to the pnpm child process, so `DIRECT_URL` wasn't seen. See BLOCKERS.md for the human follow-up. |
| 2026-07-13 | W2.1 Outcome scheduler | 4857e6c | `runTick` (@ss/jobs): idempotent post-window outcome measurement (conditional `updateMany` claim) + capped weekly backfill+re-analysis of stale READY stores (same atomic SYNCING claim as `syncStoreAction`). `POST /api/cron/tick`: constant-time `CRON_SECRET` check (503 unset, 401 wrong), rate-limited 1/5min, `.github/workflows/cron.yml` trigger (`17 */6 * * *`). `/monitoring`'s hardcoded `{30}` now reads `ATTRIBUTION_WINDOW_DAYS`. 3-dimension adversarial multi-agent review before commit (correctness/idempotency, security/auth, grounding/tenancy) found and fixed 2 should-fix gaps: `defaultRefresh` (the safety-critical claim+pipeline closure) had zero test coverage — added 4 tests mirroring `sync-runner.test.ts`'s `vi.mock` pattern; the route had no rate limiting unlike the webhook route — added `rateLimit('cron-tick', 1, 5*60_000)`. Also fixed 2 stale code comments pointing at moved logic. Gate green: typecheck 8/8, test 185/185 (+19 new), lint 0/0, build 20 routes incl. `/api/cron/tick`. Local runtime verification via `pnpm --filter @ss/web dev` (CRON_SECRET passed as inline env var, `.env.local` never touched): 503/401/200/429 all confirmed against the live DB with zero real stores/outcomes (mutating paths confirmed inert, not assumed). `gh workflow list` confirms "Cron tick" registered. BLOCKED(human) — CRON_SECRET must be set on Fly + GitHub before the schedule does anything in production; see BLOCKERS.md. |
| 2026-07-13 | W2.2 Billing go-live hardening | a4f72a7 | `StripeEvent` gained `customerId`/`currentPeriodEnd` (Basil `items.data[0]` fallback, expanded-object customer ignored); webhook route persists both via conditional spread. `currentTier()` demotes to free after a 7-day grace (`subscriptionLapsed`) even on a stale ACTIVE row — missed-webhook safety net. NEW `POST /api/billing/portal` opens the Stripe customer portal. `/plans` shows honest (non-committal — webhook can beat the redirect) post-checkout banners + a Manage-billing entry point. 3-dimension adversarial review (money-correctness, security/tenancy, grounding/fail-closed) found and fixed 2 should-fix money-path gaps before commit: (a) the webhook's `currentPeriodEnd` write had no ordering guard — an out-of-order/retried Stripe event could regress it and wrongly lapse a paying customer via the new grace check; fixed with a pure `resolvePeriodEndUpdate` monotonic guard (5 new tests). (b) checkout/webhook/portal had no `orgId === DEMO.orgId` guard unlike every other sensitive write path (contradicted SECURITY.md's stated invariant) — a Clerk-misconfiguration could let the demo org accumulate a real Stripe customer id, letting another DEMO-collapsed visitor open a stranger's billing portal; fixed and verified END-TO-END against a live dev server (checkout → 403 with Clerk unset + fake Stripe config), not just unit-tested. Also fixed a minor Invalid-Date edge case in period-end parsing. Gate green: typecheck 8/8, test 201/201 (+16 new), lint 0/0, build 18 routes incl. `/api/billing/portal`. `prisma db push`: "already in sync" (no schema drift, columns pre-existed). Local runtime: checkout/portal 404-parity under Clerk auth confirmed, webhook 503 fail-closed confirmed, portal 503-when-unconfigured confirmed with Clerk+Stripe both inline-unset (`.env.local` never touched). BLOCKED(human) — `/plans` screen check (no authenticated session) and the one-time Stripe Dashboard "save default portal configuration" step; see BLOCKERS.md. |
