---
status: building
focus: Live in prod, polishing UX — unblock the first real merchant (needs live Stripe keys + Shopify redirect-URL allowlist)
updated: 2026-07-13
---

- [ ] Execute the ranked PLAN-*.md backlog (10 verified plans; W1.1 first-run-funnel done, next: W1.2 sync-scale)
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
