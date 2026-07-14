# BLOCKERS.md — items the loop cannot complete without Satya

Format: one entry per blocked item — what's blocked, why, what Satya needs to do.

---

## W1.5 — W1.3 visual screen checks (re-grant banner / partial-history notice)

**Blocked on:** §4.2 (First dev-store E2E, HUMAN GATE) not yet done, combined with no
authenticated Clerk browser session available in this headless loop session.

**What's blocked:** The PLAN-scope-grant-tracking.md acceptance list's 3 screen-check
bullets (re-connect banner renders naming `read_all_orders`, inverse case shows no
banner/notice, demo org shows neither) require *visually* loading `/connections` and
`/app` as a signed-in org with a connected (non-demo) store, then manually toggling
that store's `grantedScopes` row.

**Why the loop can't do it:** Querying the live Store table (2026-07-13) shows exactly
one row — the demo store (`wildflower.myshopify.com`, `isDemo`-equivalent). No real
merchant has connected yet (§4.2 hasn't happened), so there is no connected store to
toggle. Even if one existed, viewing `/connections` requires a live Clerk sign-in,
which the loop cannot create or authenticate (credential entry / account creation are
prohibited actions).

**What WAS verified instead (2026-07-13):** An isolated round-trip check against the
live (post-migration) Supabase DB — create a throwaway Organization + Store with
`grantedScopes` set, read it back, update it, null it out, read back each time, then
cascade-delete the throwaway org. All values persisted correctly; the new
`Store.grantedScopes` column round-trips through the real Prisma client against the
live schema. This proves the migration + column work end-to-end; it does not prove the
banner/notice *render* correctly, though that logic has 4 dedicated passing unit tests
(`storeHasAllOrdersScope`, `missingScopes` — `packages/config/test/config.test.ts`).

**What Satya needs to do:** Complete §4.2 (create a dev store, connect it via
`/connections`). Once a real connected store exists, either loop back through the
PLAN's screen-check steps manually, or ask the loop to re-run them in a session with
browser access to an authenticated tab.

---

## W2.1 — CRON_SECRET not set in production

**Blocked on:** Setting a Fly secret and a GitHub repo secret — both require credentials
(`fly` / `gh` auth) and dashboard/CLI access the loop does not have and should not
attempt (D5 — anything leaving the machine / credential handling is human-only).

**What's blocked:** `.github/workflows/cron.yml` runs every 6h (`17 */6 * * *`) and will
`exit 1` immediately (its own guard: "CRON_SECRET repo secret is not set") until the GH
repo secret exists. Even if the GH side were set, `POST /api/cron/tick` 503s
("not configured") until the Fly secret is also set — the route deliberately fails closed
per `apps/web/app/api/cron/tick/route.ts` (mirrors the Shopify webhook route's pattern).
So the outcome-measurement/weekly-re-analysis flywheel is fully coded, tested, and
deployed-ready but inert in production until both secrets exist.

**What WAS verified instead (2026-07-13):** Full local runtime verification via a
`pnpm --filter @ss/web dev` instance with `CRON_SECRET=testsecret` passed as an inline
shell env var (`.env.local` was never read or written, per the HARD RAIL): unset → 503,
wrong secret → 401, correct secret → 200 with the full result shape, repeated call within
the 5-min rate-limit window → 429. Against the live Supabase DB (no real non-demo stores
or SCHEDULED outcomes exist yet), `runTick` correctly did nothing (all counts 0) —
confirmed inert, not merely assumed. `gh workflow list` confirms "Cron tick" is
registered on the default branch and will fire on schedule once the secret exists.

**What Satya needs to do:**
```
openssl rand -hex 32   # generate the secret once, use the same value for both
fly secrets set CRON_SECRET=<value> -a simplesense-co
gh secret set CRON_SECRET --body <value>
```
Also matches the STATUS.md open-action item. No code change needed afterward — the next
scheduled run (or a manual `gh workflow run "Cron tick"`) will pick it up.

---

## W2.2 — /plans screen check (upgraded/canceled banners, Manage-billing button)

**Blocked on:** No authenticated Clerk session available in this loop session (same class
of blocker as W1.5).

**What's blocked:** PLAN-billing-go-live.md's screen-check acceptance item: sign in via
Clerk dev, confirm `/plans?upgraded=1` shows the success banner, `/plans?canceled=1` shows
the canceled banner, plain `/plans` shows neither, and the "Manage billing / cancel" button
does NOT render (no `stripeCustomerId` in dev).

**Why the loop can't do it:** `/plans` is behind `auth.protect()` (not in the middleware's
public matcher). Checked `claude-in-chrome` `tabs_context_mcp` for an existing signed-in
browser session — none exists — and creating/entering Clerk credentials is a prohibited
action.

**What WAS verified instead (2026-07-13):** Full code-path inspection (both banners are
simple `sp.upgraded === '1'` / `sp.canceled === '1'` boolean renders off the `searchParams`
Next 15 Promise pattern — no server state involved, so the plain-`/plans`-shows-neither case
is structurally guaranteed) plus live end-to-end proof that `stripeCustomerId` can never be
set for the demo org (the button's gate): a real `pnpm --filter @ss/web dev` curl with Clerk
fully unset + a fake Stripe key/price showed `POST /api/billing/checkout` → `403 "not
available for the demo org"` — the new DEMO guard added during adversarial review fires for
real, not just in unit tests.

**What Satya needs to do:** Sign in to `/plans` in a browser (dev or prod once merchant
accounts exist) and confirm the banners/button render as coded, OR ask the loop to re-run
the check in a session with browser access to an authenticated tab.

---

## W2.2 — Stripe customer-portal default configuration (one-time dashboard step)

**Blocked on:** A Stripe Dashboard click (Settings → Billing → Customer portal → save a
default configuration), required once per Stripe mode (test/live) before
`createPortalSession`'s API call succeeds — otherwise Stripe returns "default configuration
has not been created." This is a dashboard-only action, same bucket as pasting live keys.

**What Satya needs to do:** In the Stripe Dashboard (test mode now, live mode before
go-live), open Settings → Billing → Customer portal and save the default configuration once.
No code or secret change needed.

---
