---
status: building
focus: Core product live on Fly; all 5 intelligence-audit modules + Wave-0 shared infra shipped in code. Stripe billing verified working in TEST mode (2026-07-31) — live billing is the next revenue-unblocking step, and it is human-gated.
updated: 2026-07-31
---

- [ ] **Go live on billing (highest-value unblock).** Test mode is verified end-to-end.
      Live needs, in order: (a) live-mode Stripe API keys from an activated account,
      (b) Basic/Pro products **recreated in live mode** (test/live are separate
      namespaces — nothing carries over), (c) Stripe Dashboard → Settings → Billing →
      Customer portal → save a default configuration, or `/api/billing/portal` fails,
      (d) set all of it as Fly secrets, not just `.env.local`. Run `pnpm preflight`
      after each step — it validates prices against the live Stripe API and catches
      the cross-account mistake that cost a session on 2026-07-31.
- [ ] Set `CRON_SECRET` (`openssl rand -hex 32`) on Fly (`fly secrets set CRON_SECRET=… -a simplesense-co`)
      and as a GitHub repo secret (`gh secret set CRON_SECRET`) — enables the
      outcome-measurement / weekly re-analysis tick (`.github/workflows/cron.yml`).
      Confirmed still unset by `pnpm preflight` on 2026-07-31.
- [ ] Set `STRIPE_WEBHOOK_SECRET` — without it, subscription lifecycle webhooks fail
      signature verification, so cancellations/payment failures never downgrade a tier.
      Confirmed still unset by `pnpm preflight` on 2026-07-31.
- [ ] Shopify redirect-URL allowlist entry → first real dev-store connect end-to-end
- [ ] Shopify approvals: `read_all_orders` + protected-customer-data. Until granted,
      real stores are hard-capped to ~60 days of order history — a genuine product-
      completeness gap for any paying customer, independent of billing.
- [ ] Rotate the secrets that passed through chat (Anthropic / Supabase DB pw / Shopify
      secret / Clerk) — and add the Stripe test key used on 2026-07-31 to that list.
- [ ] Clerk production instance (currently test/dev keys)
- [ ] Wire `@ss/entities` (S7) into a real module run path — built and tested, but not
      yet connected to anything; needs a product decision on how brand identity relates
      to the existing Store/org model. See PARKING_LOT.md.
- [ ] Give `@ss/capture-archive` (S6) a durable backend — in-memory + JSON-file only today.
- [ ] Harden `/internal/audit-intakes` — currently gated on "signed in and not the demo
      org," which is a placeholder, not a real role check.
- [ ] P1 UX: dashboard DB-query batching (W3.3; hover/focus + next/font shipped in W3.1,
      mobile app-shell in W3.2)
- [ ] S3 real multi-provider LLM battery for M1 AnswerShelf — blocked on
      OpenAI/Gemini/Perplexity keys; mock battery ships today.
- [ ] Shopify App Store (embedded) — parked; build plan in `docs/SHOPIFY_APP_STORE_PLAN.md`
- [x] Grounded engine: analyzers → signal detection → LLM synthesis → grounding validation → ranking
- [x] App: dashboard, move detail, customers/geography/products, monitoring, connections, settings
- [x] Durable background Shopify sync + live Admin GraphQL reader (idempotent, status-polled)
- [x] Server-enforced tier gating (free top-3 / Basic / Pro) + CSV segment & SKU exports
- [x] Marketing site, onboarding, /privacy + /terms, rotating video hero, mobile footer,
      redesigned /pricing (tiered cards + honest proof grid + FAQ)
- [x] Intelligence-audit modules shipped: M8 Retention X-Ray, M5 ReturnLens, M2 AgentReady
      (+ SSRF-safe fetcher & free scanner), M1 AnswerShelf (mock battery), M3 ReviewProof
      (3 of 5 signals real — the other 2 deliberately out of scope, not faked)
- [x] Niche landing pages `/for/{pet,candle,apparel}-brands` — config-driven, computed
      demo numbers only, banned-claims lint enforced
- [x] Wave-0 shared infra: S1 Playwright crawler, S4 report PDF, S6 capture archive,
      S7 entity registry (16 real bugs found by adversarial review, all fixed)
- [x] `pnpm preflight` config doctor — validates env location, Clerk all-or-nothing,
      encryption-key shape, and Stripe prices against the live API
- [x] Self-audit 2026-07-31 (4 lenses, adversarially verified): 5 real defects found
      and fixed before go-live — an abandoned checkout granting permanent free Pro, an
      unreachable activation branch leaving paying customers on free, double-billing on
      upgrade, a missing demo-store guard, and a fabricated `0` on the live
      /for/pet-brands page. See LEARNINGS.md. **The three billing bugs were only
      unexploitable because live billing is still off — they would have gone live with
      it.**
- [x] Stripe checkout verified working end-to-end in test mode (2026-07-31)
- [x] 4 adversarial audits folded (grounding, tenancy, billing, sync); 714 tests green
- [x] Live on Fly + Supabase at simplesense.co (health-checked deploys)
