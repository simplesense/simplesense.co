# PARKING_LOT.md — for tomorrow morning's review

Items I made a documented default call on rather than stopping to ask, per your
"keep building, park it" instruction. Each entry: the decision point, what I did and
why, and what you might want to change. Nothing here is blocking further work unless
explicitly marked BLOCKING.

Newest first.

---

## M2 AgentReady built — SSRF-safe fetcher independently red-teamed, one critical bug found and fixed

Follow-up to the entry below (previously "pausing before M2's scanner") — finished it
after you said to keep going. Built `@ss/safe-fetch` first, in isolation, then ran a
dedicated adversarial-review workflow against it (2 independent reviewers, each
verified by a second independent agent that reproduced the findings against the real
code) *before* building the rubric/scanner UI on top of it. Worth knowing this actually
caught something real, not just a box-ticking exercise: a **critical, reproduced**
bypass where `http://[::ffff:169.254.169.254]/` (the cloud-metadata IP, disguised as an
IPv4-mapped IPv6 literal in its hex-group form) sailed straight past the IP blocklist —
the mapped-address check only recognized the dotted-decimal textual form, but
`url.hostname` always produces the hex-group form, so the check never actually fired
for real traffic. Fixed, plus two smaller confirmed bugs (unbounded DNS lookup timeout,
an unhandled body-stream-error rejection). All three have regression tests. Full
writeup in `LEDGER.md`'s 2026-07-24 entry.

**Still an accepted, documented v0 limitation, not silently ignored**: `safeFetch`
validates DNS resolution then lets `fetch()` re-resolve the same hostname to actually
connect — a narrow DNS-rebinding TOCTOU window between the two lookups. Closing it
fully means pinning the TCP connection to the pre-validated IP via a low-level
connect-time `lookup` override, which needs `undici`'s dispatcher API — I judged that
not worth adding as a new dependency for a v0 scanner. Worth revisiting if this scanner
ever handles higher-stakes traffic than a free lead-magnet tool.

**Also not individually re-verified this session**: the AI-agent crawler user-agent
list the robots.txt rule checks (`ClaudeBot`, `Google-Extended`, `PerplexityBot`,
`CCBot`) — these are well-established, widely-documented tokens I'm confident in from
general knowledge, but only OpenAI's set (`GPTBot`/`ChatGPT-User`/`OAI-SearchBot`/
`OAI-AdsBot`) was freshly confirmed via WebFetch this session (Anthropic's own crawler
docs page 404'd when I tried). Low-stakes if one of these tokens is ever renamed —
worst case the rule under- or over-reports a block that isn't checked elsewhere — but
flagging since D3 (no invented symbols) technically wants everything source-verified.

It turned out most of M2's rubric doesn't need Playwright at all — schema.org
validity, policy-text presence, robots.txt, login-wall, and CAPTCHA detection all work
from a plain static fetch. Only the "JS-only price rendering" check is weaker without
real browser rendering (the rule is explicit about this in its own finding text —
"consistent with client-side rendering... cannot execute JavaScript to confirm it").
So M2 shipped without waiting on the Playwright decision below; M3 still needs it more
(review-widget scraping has no static-fetch equivalent).

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

## Playwright decision needed for S1 (crawler) — blocks M3 ReviewProof's review-widget scraping

Update: M2 AgentReady turned out not to need this after all (see the entry above) — its
static-fetch rubric shipped complete. What's still blocked is M3 ReviewProof's
review-widget/PDP scraping (plan §4: "crawl PDPs, review widgets... capture with
hashes"), which genuinely needs rendered DOM (review widgets are typically JS-injected)
in a way a plain fetch can't get around. That's a new dependency (D5) I'm not adding
without your sign-off: Playwright, a lighter fetch+cheerio approach, or a hosted
scraping API. M3's email-based rule (incentivized-review language in forwarded
review-request emails) doesn't need this and could still be built standalone if you'd
rather see that slice first.

## LLM provider keys needed for S3/M1 AnswerShelf's "battery" runner

M1's premise is running the same prompt across multiple LLM providers (ChatGPT, Gemini,
Perplexity, etc.) to see how a store's brand shows up. Only `ANTHROPIC_API_KEY` is
configured today. I can build the harness generically and run it against Claude alone as
one battery member, but the multi-provider comparison — the actual point of the module —
needs OpenAI/Google/Perplexity keys provisioned, which I won't do without you.
