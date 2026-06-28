# Simple Sense — Insight Library & ICP Definition
### The prescriptions the engine surfaces, grounded in real benchmarks
*June 2026 · companion to the deck and Master Reference · use for the free Audit, the "product in action" slide, and marketing hooks*

---

## Part 1 — Does Simple Sense serve physical-store-with-ecommerce, or ecommerce-only?

**Decision: Beachhead on omnichannel SMBs (physical store + Shopify); the engine and most of the library generalize to pure-ecommerce as the expansion market. Don't pick one — sequence them.**

Why, in one line: the geo/foot-traffic insight is your most differentiated, least-served, most-on-brand wedge — but the *core engine* (concentration, retention, channel profitability, AOV, returns) is channel-agnostic, so narrowing to omnichannel-only would needlessly shrink the market.

The reasoning, with the data:

1. **Omnichannel is where you're 10x more differentiated.** Incumbents (Triple Whale, Polar, Northbeam) assume pure DTC. Yet [only ~5% of retailers have achieved unified-commerce leadership despite 99% of executives agreeing it improves profitability](https://www.ringly.io/blog/omnichannel-retail-statistics-2026) — a wide-open gap. Your operator pedigree (omnichannel retail: SelectBlinds, Conn's, JCPenney, Nike) is most credible exactly here.

2. **The geo insight only "wows" when there's a store.** [80% of U.S. disposable income is spent within ~20 miles of home](https://www.opticedge.com/post/yourcustomersaredrivingby), and a store's [primary trade area typically holds 50–80% of its customers](https://study.com/academy/lesson/retail-trade-areas-definition-factors.html). For a hybrid store, "82% of your customers live within 5 miles" → geo-fenced ads + BOPIS is a jaw-dropper no dashboard offers. And [85% of BOPIS shoppers buy something extra in-store](https://www.ringly.io/blog/omnichannel-retail-statistics-2026), so the prescription prints margin.

3. **But the engine runs on any store's data — the geo *action* just changes.** Every Shopify store has ship-to addresses, so the geo *analysis* always runs; for online-only stores the move becomes regional ad targeting, 3PL/inventory placement, and regional shipping offers instead of foot-traffic/BOPIS. And the majority of the library below (Pareto/VIP, retention timing, channel profitability, AOV/free-shipping, returns) is identical regardless of physical presence.

4. **Pure-ecommerce is the bigger pool and the natural expansion.** It's more crowded, but the same engine retains those stores on everything except the BOPIS-specific plays.

**How to express it in the pitch:** *"Simple Sense works for any Shopify store. It's most differentiated for omnichannel SMBs — physical + online — where no one else turns 5 years of data into 'open a pickup option and geo-fence these 3 zip codes.'"* Lead the hero demo with the omnichannel geo→BOPIS story; show one online-only variant so you don't appear to exclude the larger market.

> **Tagging note for the build:** the engine should detect whether a store has physical locations (Shopify POS locations / "local pickup" enabled) and branch the geo prescription accordingly — BOPIS + foot-traffic for hybrid, regional ads + inventory placement for online-only. This is a real `if` in the prescription logic, not a positioning slogan.

---

## Part 2 — 20 insight statements (the kind the Audit surfaces)

**How to read these.** The **bold number** in each is *illustrative* — an example of what the engine computes for one specific store from its own data. The cited stat after it is the **real, sourced benchmark** that makes the pattern common and the recommended move sound. Tags: **[Omni]** needs a physical store · **[Online-OK]** works online-only (action adjusts) · **[Both]** channel-agnostic.

### Geography & omnichannel (the wedge)

**1. "82% of your customers live within 5 miles of your two stores — yet 60% of your ad budget runs statewide."** **[Omni]**
- *Why it's real:* a store's primary trade area typically holds [50–80% of its customers](https://study.com/academy/lesson/retail-trade-areas-definition-factors.html), and [~80% of disposable income is spent within 20 miles of home](https://www.opticedge.com/post/yourcustomersaredrivingby).
- *The move:* geo-fence paid spend to the real trade area; redirect the saved budget to local BOPIS/loyalty.

**2. "Your two stores' trade areas overlap by ~30% — you're paying twice to reach the same shoppers."** **[Omni]**
- *Why it's real:* [overlapping own-store trade areas dilute performance and inflate spend](https://www.growthfactor.ai/resources/blog/what-is-a-trade-area); distance ≠ drive-time, so radius targeting double-counts.
- *The move:* de-dupe geo-targeting between stores; differentiate local assortment/offers to reduce cannibalization.

**3. "1 in 6 of your online orders ships to an address within 10 minutes of a store — but you don't offer pickup."** **[Omni]**
- *Why it's real:* [85% of BOPIS shoppers make an additional in-store purchase](https://www.ringly.io/blog/omnichannel-retail-statistics-2026); offering pickup/curbside lifts conversion ~25%.
- *The move:* enable local pickup; trigger a "pick up today" option for in-radius carts to capture margin + a second basket.

**4. "40% of your online revenue ships to just 3 zip clusters — where you hold no local inventory."** **[Online-OK]**
- *Why it's real:* customer geography concentrates locally even online; [orders to distant shipping zones cost 40–60% more](https://redstagfulfillment.com/what-percentage-of-ecommerce-orders-offer-free-shipping/).
- *The move:* place forward inventory / a 2nd 3PL node near the cluster; run regional free-ship offers there.

### Customer concentration & VIPs (Pareto / RFM)

**5. "Your top 20% of customers drive 71% of revenue — and most came from one channel."** **[Both]**
- *Why it's real:* [the top 20% of customers typically account for ~80% of sales](https://www.vennapps.com/blog/ecommerce-customer-retention-statistics).
- *The move:* build a VIP Klaviyo segment with early access/perks; protect and double down on the channel that sourced them.

**6. "Your top 5% of customers are worth ~9x the average — and you have no VIP flow for them."** **[Both]**
- *Why it's real:* [the top 5% of customers generate ~35% of total ecommerce revenue](https://www.mobiloud.com/blog/repeat-customer-rate-ecommerce); repeat buyers spend [~67% more per order](https://www.mobiloud.com/blog/repeat-customer-rate-ecommerce).
- *The move:* a tiered VIP/loyalty flow (recognition > discount); concierge the top 5%.

**7. "65% of your revenue comes from repeat buyers — but 80% of your ad spend chases new ones."** **[Both]**
- *Why it's real:* [~65% of ecommerce revenue comes from repeat customers](https://www.lexer.io/blog/10-must-know-facts-and-statistics-for-retail-and-ecommerce); selling to an existing customer is 60–70% likely vs 5–20% for a new prospect.
- *The move:* rebalance budget toward retention; a [5% retention lift correlates with a 25–95% profit increase](https://www.lexer.io/blog/10-must-know-facts-and-statistics-for-retail-and-ecommerce).

### Channel profitability

**8. "Your most profitable customers come from email/SMS; your least profitable from paid social — and you're scaling the wrong one."** **[Both]**
- *Why it's real:* [paid CAC is up ~40% in two years](https://www.omnisend.com/blog/digital-marketing-statistics/), while the cheapest first-purchase channel is [often not the highest-LTV channel](https://www.darkroomagency.com/observatory/email-marketing-benchmarks-ecommerce-2026).
- *The move:* rank channels by LTV:CAC (not first-order CAC) and shift spend to the durable winners.

**9. "Email + SMS drives only ~9% of your revenue — well-run stores your size do 25–35%."** **[Both]**
- *Why it's real:* well-optimized owned programs reach [~30–40% of total revenue](https://www.darkroomagency.com/observatory/email-marketing-benchmarks-ecommerce-2026) ([15–20%+ is the broad average for solid programs](https://codecrew.us/blog/email-marketing-stats-you-need-to-know-the-ultimate-list/)).
- *The move:* stand up the core flows first — [flows generate ~41% of email revenue from just ~5% of sends (~18x revenue per recipient)](https://www.klaviyo.com/products/email-marketing/benchmarks).

**10. "You have automated flows for 4 customer moments — top stores cover 12–16. Every gap is leaked revenue."** **[Both]**
- *Why it's real:* [top performers maintain flows for 12–16 customer actions; most brands cover only 4–6](https://www.darkroomagency.com/observatory/email-marketing-benchmarks-ecommerce-2026).
- *The move:* add the missing triggers (browse/cart/checkout abandon, post-purchase, winback, replenishment).

### Retention & lifecycle timing

**11. "73% of your buyers never return — but those who make a 2nd purchase have a 54% chance of a 3rd."** **[Both]**
- *Why it's real:* the [average repeat rate is ~28%](https://www.opensend.com/post/repeat-purchase-rate-ecommerce); after a first order there's [~27% chance of a return, but after the second the third jumps to 54%+](https://www.mobiloud.com/blog/repeat-customer-rate-ecommerce).
- *The move:* engineer the 2nd order — strong post-purchase flow + a nudge inside the 60-day window ([60-day repurchasers are 3x more likely to become long-term customers](https://prooflytics.io/blog/klaviyo-marketing-analytics)).

**12. "Your repeat rate is 18% — your category benchmark is 25%+. Closing that gap is worth ~50% more revenue."** **[Both]**
- *Why it's real:* [apparel repeat sits ~20–26%, beauty similar (40%+ with replenishment)](https://www.lexer.io/blog/10-must-know-facts-and-statistics-for-retail-and-ecommerce); [stores at a 40% repeat rate earn ~50% more than those at 10%](https://www.mobiloud.com/blog/repeat-customer-rate-ecommerce).
- *The move:* loyalty program + post-purchase sequence + reorder reminders.

**13. "Customers reorder your consumable about every 47 days — but your first reminder goes at 90. You're losing the reorder to whoever emails first."** **[Both]**
- *Why it's real:* timely automated flows dramatically outperform generic sends ([~18x revenue per recipient](https://www.klaviyo.com/products/email-marketing/benchmarks)); consumables show the highest repeat rates.
- *The move:* a predictive replenishment flow timed to each SKU's actual reorder cycle; offer subscribe-and-save.

### AOV, shipping & cart

**14. "Your free-shipping threshold sits below your AOV — it's costing margin without lifting baskets."** **[Both]**
- *Why it's real:* the [optimal threshold is 15–30% above current AOV; a progress bar + product recs lifts AOV 18–28%](https://easyappsecom.com/guides/shopify-free-shipping-statistics).
- *The move:* raise the threshold to ~15–25% above AOV and add a progress bar with "add $X for free shipping" recs.

**15. "Shipping cost is the #1 reason ~7 in 10 of your carts are abandoned — and you reveal it only at checkout."** **[Both]**
- *Why it's real:* [unexpected shipping cost is the leading abandonment driver; stores without free shipping see 75–82% abandonment vs 62–68% with it; surfacing the threshold early cuts abandonment 18–25%](https://easyappsecom.com/guides/shopify-free-shipping-statistics).
- *The move:* show the threshold on product pages, not just checkout; add a cart-recovery flow ([8–12% recovery](https://www.darkroomagency.com/observatory/email-marketing-benchmarks-ecommerce-2026)).

### Margin, returns & product mix

**16. "Your shoe return rate is 31% — every point back is real margin, and 53% of those returns are fit."** **[Online-OK]**
- *Why it's real:* [apparel averages ~25% returns, shoes ~31%; fit/sizing drives ~53% of apparel returns; one point of reduction is worth ~$100K/yr at $10M revenue](https://eightx.co/blog/average-ecommerce-return-rate).
- *The move:* sizing guidance + better PDP detail on the worst SKUs; "keep-it" partial refunds below a cost threshold.

**17. "20% of your SKUs drive 80% of profit — and another 15% lose money after returns and discounts, on equal ad spend."** **[Both]**
- *Why it's real:* the [80/20 pattern holds at the product level](https://swifterm.com/the-pareto-principle-application-for-ecommerce/); [processing a return costs 20–65% of the item's price](https://www.opensend.com/post/return-shipping-cost-statistics).
- *The move:* compute true per-SKU margin (net of returns + discounts); reallocate ad budget and merchandising to the winners; cull or reprice the losers.

### Discounting & pricing

**18. "62% of your orders use a discount code — you've trained your best customers to wait for a sale."** **[Both]**
- *Why it's real:* discount dependency erodes margin, and [the brands that pull ahead "go beyond discounts" to segmentation/personalization](https://www.klaviyo.com/marketing-resources/email-benchmarks-by-industry-2024); loyal buyers are less price-driven.
- *The move:* replace blanket codes with targeted offers (new-customer / winback only); protect full-price demand for VIPs.

### Acquisition quality

**19. "The channel with your lowest CAC also has your worst 12-month LTV — you're optimizing for cheap, not valuable."** **[Both]**
- *Why it's real:* [the cheapest acquisition channel is frequently not the one producing the most valuable long-term customers](https://www.darkroomagency.com/observatory/email-marketing-benchmarks-ecommerce-2026); the metric that matters is [LTV:CAC, target >3:1](https://www.lexer.io/blog/10-must-know-facts-and-statistics-for-retail-and-ecommerce).
- *The move:* score every channel by cohort LTV:CAC; scale the durable ones even if their first-order CAC is higher.

### Seasonality & cohort quality

**20. "Your holiday cohort returns at 17% above baseline and rarely reorders — you're acquiring gift-buyers, not customers."** **[Both]**
- *Why it's real:* [holiday-period purchases are returned ~17% more than the annual baseline](https://www.opensend.com/post/return-shipping-cost-statistics), and gift buyers convert to loyalty poorly.
- *The move:* segment the holiday cohort, set expectations, and run a distinct winback; don't count seasonal gift revenue as core retention.

---

## How to use this

- **Free Audit:** the engine runs these checks against a store's data and returns the 3–5 that are *true and highest-$* for that store — each with the store's real number, the benchmark, and the move. That ranked, prescriptive output is the product.
- **Deck / "product in action":** use #1 (geo→BOPIS) and #5 (top-20%→VIP) as the hero examples — they're the most visual and most on-brand.
- **Marketing hooks:** each bolded line is a build-in-public / r/shopify post ("Here's what 80% of stores miss in their geo data…").

*Numbers in bold are illustrative of per-store output; cited stats are real-world benchmarks (linked). The engine must compute each store's actual figure from its own data and never present a benchmark as the store's number.*
