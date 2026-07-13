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
