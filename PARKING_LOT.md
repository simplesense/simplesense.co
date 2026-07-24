# PARKING_LOT.md — for tomorrow morning's review

Items I made a documented default call on rather than stopping to ask, per your
"keep building, park it" instruction. Each entry: the decision point, what I did and
why, and what you might want to change. Nothing here is blocking further work unless
explicitly marked BLOCKING.

Newest first.

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
