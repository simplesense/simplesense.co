# PARKING_LOT.md — for tomorrow morning's review

Items I made a documented default call on rather than stopping to ask, per your
"keep building, park it" instruction. Each entry: the decision point, what I did and
why, and what you might want to change. Nothing here is blocking further work unless
explicitly marked BLOCKING.

Newest first.

---

## Pausing before M2 AgentReady's scanner — wants a deliberate security pass, not a rushed one

M8 and M5 were both safe to build end-to-end quickly because their "chassis" only
ever computes over data the founder/customer explicitly hands over (a Klaviyo API
key, CSV exports) — nothing SimpleSense's server reaches out to on its own. M2's free
public scanner (`/audits/agent-ready`, plan §4) is different in kind: it's a service
that takes an arbitrary URL from a stranger on the internet and has *our server* fetch
it. That needs real SSRF-safe design before any code — block private/link-local/cloud-
metadata IP ranges (including after DNS resolution, not just by hostname, to close
DNS-rebinding), cap redirects and refuse ones that land on a blocked range, timeouts
and response-size limits, and rate-limiting so the scanner can't be turned into a
free HTTP proxy or DDoS amplifier for someone else's target. That's a genuinely
different risk profile than anything built so far this session, and rushing it inside
the same "keep building" pass felt like the wrong tradeoff — a security design deserves
a clear head, not a 15th-thing-tonight pass. I stopped here rather than build it
carelessly. Worth noting: a meaningful slice of M2's rubric (schema.org validity,
policy-text presence, robots.txt checks) doesn't actually need Playwright/a full
headless browser — a plain rate-limited `fetch()` covers most of it; only the
"JS-only price rendering" check needs real browser rendering. So M2 doesn't have to
wait on the Playwright decision below, just on getting the fetcher's safety net right.

## Hand-wrote the CSV parser instead of adding a library (S2)

`@ss/csv-ingest`'s `parse-csv.ts` is a from-scratch RFC4180 parser (quoted fields,
embedded commas/newlines, escaped quotes, CRLF, BOM) rather than a dependency like
`papaparse`/`csv-parse`. Default call to avoid a new dependency without your sign-off
(D5) given the repo's zero-heavy-dependency pattern so far; backed by 10 correctness
tests for the fiddly quoting/escaping cases specifically. If you'd rather standardize
on a battle-tested library here, this is a contained, single-file swap — nothing
downstream depends on the parser's internals, only on `parseOrdersCsv`/`parseReturnsCsv`'s
output shape.

## Re-prioritized S7 (entity registry) behind S2 + M5

The plan's Wave-0 order lists S7 alongside S1-S6, but with only M8 built so far, an
entity registry has no second module to cross-reference yet — and any real version of
it needs a DB table, which this session can't apply live (see the S5 entry above). Built
S2 CSV ingest kit + M5 ReturnLens instead (both fully DB-free, same profile as M8).
S7 is still on the list, just not next — worth revisiting once a second module's data
actually needs cross-referencing.

---

## [BLOCKING] S5 migration not applied to the live DB — this session can't reach Supabase

`packages/db/prisma/migrations/20260723000001_audit_intake/` (the `AuditIntake` table
backing the new `/audits/retention-x-ray` intake form) is written and additive, but I
could not run `prisma migrate deploy` against the live DB — this sandbox has lost its
route to `db.zgpyvahaoouvzagrdyxw.supabase.co` (IPv6-only host; `dig` resolves an AAAA
record fine, but `nc -6` gets "No route to host"; plain IPv4 internet egress works).
`prisma migrate status` fails the same way (P1001). Full detail in LEARNINGS.md
("Supabase connectivity regression, this session only, 2026-07-23").

**Consequence:** the `/audits/retention-x-ray` form will 500 in production exactly like
it did in my local verification (real error, screenshotted/logged, not a code bug — the
Prisma call is correct, it just can't reach Postgres) until the migration is applied.
There's no `release_command` in `fly.toml`/`Dockerfile`, so a `fly deploy` alone will
**not** fix this — migrations are a manual step here (matches the existing `grantedScopes`
migration precedent).

**What I need from you:** from a terminal that can actually reach Supabase (try your own
machine first — this looks sandbox-specific, not a Supabase-side change), run:
```
cd /Users/satya/simplesense.co && pnpm --filter @ss/db exec prisma migrate deploy
```
then re-check `/audits/retention-x-ray`'s form submits cleanly. If your machine *also*
can't reach the IPv6 host anymore, we should switch `DATABASE_URL`/`DIRECT_URL` to the
Supavisor pooler (`aws-0-<region>.pooler.supabase.com`, IPv4) per the Connect dialog —
a durable fix either way, not just a workaround for one session.

## Internal audit-intakes list has no real admin gate

`apps/web/app/internal/audit-intakes/page.tsx` gates on "signed in via Clerk and not the
demo org" — today that's exactly one account (you), so it's honest for now, but it is
**not** a role check. Flagged in a code comment on the page itself. Needs a real
admin-role check before any other real Clerk user ever exists (e.g. once a second
merchant signs up for the core product).

## No email notification on new audit-intake submissions

Founder only finds out about a new lead by opening `/internal/audit-intakes`. Wiring
Resend (or similar) for a notification email needs `RESEND_API_KEY` provisioning — a
credential decision, not something to default on my own. Until then this is a
"check the page" workflow, not a push one.

## Stripe payment links not configured for any audit module

`auditPaymentLink('retention-x-ray')` reads `STRIPE_PAYMENT_LINK_RETENTION_X_RAY` from
env — unset today, so the "Already spoke with us? Pay for your audit" CTA on the landing
page silently doesn't render (by design — never show a broken/empty payment link). Needs
a real Stripe Payment Link created and the env var set in `apps/web/.env.local` (dev) and
Fly secrets (prod) before that CTA does anything.

## Playwright decision needed for S1 (crawler) — blocks M2 AgentReady / M3 ReviewProof data collection

The plan's S1 shared crawler needs a headless-browser dependency (Playwright is the
obvious choice) to actually fetch and parse a store's live site for AgentReady/ReviewProof
signals. That's a new dependency (D5) I'm not adding without your sign-off. I've been
building the parts of M2/M3 that don't need it yet (rulebook chassis, report rendering)
and will keep the crawler-dependent pieces parked here until you decide: Playwright, a
lighter fetch+cheerio approach, or a hosted scraping API.

## LLM provider keys needed for S3/M1 AnswerShelf's "battery" runner

M1's premise is running the same prompt across multiple LLM providers (ChatGPT, Gemini,
Perplexity, etc.) to see how a store's brand shows up. Only `ANTHROPIC_API_KEY` is
configured today. I can build the harness generically and run it against Claude alone as
one battery member, but the multi-provider comparison — the actual point of the module —
needs OpenAI/Google/Perplexity keys provisioned, which I won't do without you.
