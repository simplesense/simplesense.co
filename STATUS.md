---
status: building
focus: WAVE 1 live (v27); W2.1 outcome scheduler shipped in code (needs CRON_SECRET to actually run) — next up W2.2 billing go-live hardening
updated: 2026-07-13
---

- [ ] Execute the ranked PLAN-*.md backlog (10 verified plans; WAVE 1 done — W1.1 funnel, W1.2 sync-scale, W1.3 scope-grants, W1.4 acquisition-source, W1.5 deploy+verify all shipped and live; W2.1 outcome scheduler shipped in code, awaiting CRON_SECRET below to actually run; next: W2.2 billing go-live hardening)
- [ ] Set CRON_SECRET (openssl rand -hex 32) on Fly (fly secrets set CRON_SECRET=… -a simplesense-co) and as a GitHub repo secret (gh secret set CRON_SECRET) — enables the outcome-measurement / weekly re-analysis tick (.github/workflows/cron.yml). For local testing put it in apps/web/.env.local.
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
