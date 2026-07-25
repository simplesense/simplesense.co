# case-01 — "Trail Runner Jacket," a realistic PDP with one planted gap

Hand-crafted (not a real merchant's page) product page + policy page + robots.txt used
as the golden-path fixture for M2 AgentReady v0 (COMPOUND_ENGINEERING_PLAN.md §4):

- Valid schema.org Product/Offer/AggregateRating JSON-LD (name, price, currency, a real
  `ItemAvailability` value, rating) — passes.
- A real shipping/returns policy page with substantial text — passes.
- robots.txt disallows `/admin`, `/cart`, `/checkout` but nothing broader, and blocks no
  named AI-agent bot — passes.
- No login wall (200 status) — passes.
- Ample static visible text with structured Product data present — passes.
- **One deliberate gap:** a `class="g-recaptcha"` div on the product page — fails.

Expected score: 5 of 6 checks pass = 83/100, asserted by hand in
`packages/integrations/test/agent-ready/e2e-fixture.test.ts` (not just snapshot-matched
— every `passed`/`failed` verdict and the final score are asserted individually). Per
COMPOUND_ENGINEERING_PLAN.md §2.2/§2.3: any real mis-detection becomes a NEW case here
with its own expected values, before the fix is written.
