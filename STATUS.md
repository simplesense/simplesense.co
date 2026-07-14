---
status: building
focus: WAVE 2 shipped and live (v28) — outcome scheduler + billing hardening deployed, both inert until CRON_SECRET + Stripe Dashboard config + live Stripe keys land — next up WAVE 3 (quality floor)
updated: 2026-07-14
---

- [ ] Execute the ranked PLAN-*.md backlog (10 verified plans; WAVE 1 + WAVE 2 done — W1.1-W1.5, W2.1 outcome scheduler, W2.2 billing hardening, W2.3 deploy+verify (v28) all shipped and live; next: WAVE 3 — W3.1 interaction states)
- [ ] Set CRON_SECRET (openssl rand -hex 32) on Fly (fly secrets set CRON_SECRET=… -a simplesense-co) and as a GitHub repo secret (gh secret set CRON_SECRET) — enables the outcome-measurement / weekly re-analysis tick (.github/workflows/cron.yml). For local testing put it in apps/web/.env.local.
- [ ] In the Stripe Dashboard (test mode now, live mode before go-live): Settings → Billing → Customer portal → save a default configuration, or POST /api/billing/portal's createPortalSession call fails ("default configuration has not been created").
- [ ] Live Stripe keys + the 3 price IDs → turn tier gating into revenue
- [ ] Shopify redirect-URL allowlist entry → first real dev-store connect end-to-end
- [ ] Shopify approvals: read_all_orders + protected-customer-data (full history + PII on real stores)
- [ ] Rotate the secrets that passed through chat (Anthropic / Supabase DB pw / Shopify secret / Clerk)
- [ ] P1 UX: mobile app-shell responsiveness, hover/focus states, dashboard DB-query batching, next/font
- [ ] Shopify App Store (embedded) — parked; build plan in docs/SHOPIFY_APP_STORE_PLAN.md
- [x] Grounded engine: analyzers → signal detection → LLM synthesis → grounding validation → ranking
- [x] App: dashboard, move detail, customers/geography/products, monitoring, connections, settings
- [x] Durable background Shopify sync + live Admin GraphQL reader (idempotent, status-polled)
- [x] Server-enforced tier gating (free top-3 / Basic / Pro) + CSV segment & SKU exports
- [x] Marketing site, onboarding, /privacy + /terms, rotating video hero, mobile footer, redesigned /pricing (tiered cards + honest proof grid + FAQ)
- [x] 4 adversarial audits folded (grounding, tenancy, billing, sync); 145 tests green
- [x] Live on Fly + Supabase at simplesense.co (health-checked deploys)
