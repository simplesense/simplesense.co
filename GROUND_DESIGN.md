# GROUND_DESIGN.md — Product Goal, Philosophy, and Functional Architecture

This document describes **what this product is for and what it must do** — not how
it's currently built. Someone should be able to rebuild this from zero, with any
technology of their choosing, using only this document, and end up with something
that solves the same problem the same way. No implementation technology, database,
programming language, hosting provider, or visual design is prescribed here on
purpose — those are all decisions to make fresh, not decisions to inherit.

---

## 1. Who this is for, and the problem

The customer is an independent e-commerce operator — typically running a store on
Shopify (chosen as the starting platform because it holds the largest share of the
small-to-midsize online retail market, not for any technical reason) — doing
somewhere between roughly $1M and $20M a year in revenue. This operator:

- Has real data: years of orders, customers, products, discounts, returns.
- Does **not** have a data analyst, and does not want to become one.
- Is already drowning in dashboards (Shopify's own analytics, a half-dozen app
  plugins) that show *what happened* — charts, totals, trends — and leave the *what
  do I do about it* step entirely to the operator's own judgment and time.
- Is skeptical, correctly, of tools that oversell — vague AI hype, invented
  benchmarks, "increase revenue 30%!" claims with no basis.

The problem this product solves: **turn a store's own transaction history into a
short, ranked list of specific actions worth taking this week, each with an honest
estimate of the dollar impact, in the time it takes to read one page.** Not a
dashboard. Not a chatbot. A short, prioritized to-do list an operator could hand to
an employee and say "do these, in this order."

---

## 2. The one non-negotiable philosophy: grounding

Every number the product ever shows a merchant must be a number computed from
**that merchant's own data**. Never an industry benchmark presented as fact, never a
plausible-sounding estimate filling a gap, never a number invented to make a
recommendation sound more impressive. If the data needed to support a claim isn't
present — a metric that can't be computed because a required field is missing, or
there isn't enough history yet — the product says so plainly ("insufficient data")
rather than guessing.

This isn't a nice-to-have; it is the entire basis of trust the product is built on,
and it must be enforced as a hard gate on what gets shown, not just as a habit when
writing copy. A recommendation that can't point to the specific, real numbers behind
every claim it makes should never reach a user, full stop. This same discipline
extends outward into the product's own marketing: no invented social proof, no
fabricated testimonials, no urgency that isn't real, and any external statistic used
in marketing copy must be cited to its actual source and re-verified periodically,
not repeated from memory.

A second, related principle: **be prescriptive, not just descriptive.** A chart that
shows "here's your customer concentration over time" answers a question nobody asked.
The product's job is to answer "so what should I do," and to answer it as an
operator with judgment would — the specific move, why it matters in plain language,
and the dollar range at stake — not just surface a statistic and leave the
interpretation to the reader.

---

## 3. The functional pipeline

Regardless of implementation, the system needs six conceptual stages, each one a
pure transformation of the stage before it (meaning: given the same input, always
produce the same output — no hidden randomness, no reliance on "what time it happens
to run"):

1. **Ingest and normalize.** Pull a merchant's order, customer, and product history
   from their commerce platform into one consistent internal shape, however that
   platform happens to represent the data. Ingestion must be safe to re-run — running
   it twice on the same data should never create duplicates or corrupt state, since
   real syncs fail partway through and need to resume cleanly.

2. **Compute deterministic signals.** A fixed set of business-meaningful
   calculations run against the normalized data — see §4 for the actual list. Each
   calculation is pure math over the merchant's own numbers: no external lookups,
   no AI involved at this stage, nothing probabilistic. Any calculation that can't
   be completed (not enough customers, a required field never populated, a
   denominator of zero) must explicitly say so rather than silently returning zero
   or an average.

3. **Detect what actually matters.** Not every computed number is worth a merchant's
   attention. A second pass compares each computed signal against a meaningful
   threshold (is this customer concentration unusually high? is this discount
   dependency actually a problem, or normal?) and only the signals that cross a
   real threshold get carried forward. This step exists specifically so the next
   stage never has to sift a wall of numbers to find the two or three that matter.

4. **Turn signals into plain language, without inventing anything.** The handful of
   triggered signals get turned into short, readable recommendations — a sentence
   explaining the pattern, why it matters, and the specific action to take. This is
   the one place in the pipeline where natural-language generation is appropriate
   (a human-readable explanation is inherently a language task), and it must be
   tightly constrained: whatever generates this text is given ONLY the triggered
   signals and their real values, is required to cite exactly which computed value
   backs every claim it makes, and is never allowed to introduce a number, a
   benchmark, or a time window it wasn't explicitly given. This stage should be
   swappable for a simpler template-based approach with zero behavior change from
   the merchant's point of view — the language-generation step is a convenience for
   producing varied, readable prose, not a source of truth. A cheap, fully
   deterministic version of this step (canned phrasing per signal type) must exist
   and produce output that satisfies the exact same downstream validation as the
   real one, so the whole system can run, be tested, and be demoed without any
   ongoing cost or external dependency.

5. **Validate before showing anything.** This is the actual enforcement of §2's
   grounding principle, not a suggestion to whatever generated the text. Before a
   recommendation is shown to anyone: does every number in it trace back to a real
   cited signal? Is there at least one citation at all? Is the claimed dollar range
   internally consistent (low ≤ high, both non-negative)? If any check fails, the
   recommendation is discarded or quarantined for review — never shown in a broken
   or unverifiable state. This validation step is what makes grounding a structural
   guarantee rather than a hope.

6. **Rank and present.** Order the surviving recommendations by expected value —
   roughly, dollar impact weighted by confidence, divided by how much effort the
   action takes — so the highest-leverage, most-certain, least-effort actions surface
   first. Show a short list, not everything at once.

A seventh, longer-running loop closes this over time: **measure whether a
recommended action actually worked.** Capture the relevant metric's value before a
merchant marks a move as done, then re-measure it after enough time has passed, and
report the real, measured lift (or an honest "inconclusive" if the change is within
normal noise, or "no baseline" if nothing was captured). This is what turns
one-off recommendations into a system that gets more trustworthy over time — and any
learning drawn ACROSS merchants must only ever use aggregated outcome data, never one
merchant's specific numbers surfaced to another.

---

## 4. The actual signals worth computing (v1 scope)

These are the specific business questions the analysis stage answers, purely from a
store's own order/customer/product history — no external data source needed for any
of them:

- **Customer concentration (Pareto):** what share of revenue comes from the top 1/5/
  10/20% of paying customers — the classic "who actually keeps the lights on"
  question.
- **Recency/frequency segmentation:** who are the champions (frequent, recent, high
  spend) and who's drifting away (used to buy repeatedly, hasn't in a while)?
- **Repeat-purchase behavior (cohort):** of customers who bought for the first time
  in a given period, what share ever bought again, and how long did that take?
- **Replenishment timing:** for products people buy more than once, what's the
  typical gap between purchases — the natural cue for a "time to reorder" nudge.
- **Product affinity:** which products tend to be bought together?
- **Per-product profitability:** accounting for discounts actually given and known
  product cost, which specific products are quietly losing money?
- **Discount dependence:** what share of revenue only happens with a discount code
  attached, and how deep are those discounts on average?
- **Return rate:** what share of revenue comes back as refunds?
- **Order-value threshold effects:** relative to any free-shipping cutoff the
  merchant has set, is average order value sitting right at, just under, or well
  above that line?
- **Geographic concentration:** for a merchant with a physical presence, what share
  of revenue comes from customers near a location (a real, local-marketing
  opportunity)? For an online-only merchant, is revenue unusually concentrated in a
  few zip codes? Both versions must exclude orders with no usable location data from
  the concentration math, and separately report what share of revenue that
  unlocatable segment represents — a geographic finding must never quietly include
  guessed locations.
- **New-versus-returning revenue mix**, and **which acquisition source a
  customer's first order came through** — clearly distinguished from real ad-spend
  attribution, which this does not attempt.

Two categories are explicitly named but deliberately left unanswered in v1 because
answering them honestly needs data this system doesn't yet have — advertising-spend
efficiency (needs ad-platform data) and owned-channel (email/SMS) engagement share
(needs an email-platform integration). These should exist as visibly "insufficient
data" entries rather than being silently omitted, so a merchant knows the question
exists and why it isn't answered yet, rather than assuming it was never considered.

---

## 5. Access, tenancy, and the demo experience

Every merchant's data must be fully isolated from every other merchant's — this is
not a performance optimization, it's a trust requirement, and it should be
structurally impossible to violate by accident (any code path that reads or writes
store data should be forced through a single choke point that proves the requesting
identity actually owns that store, rather than relying on every individual query
remembering to filter correctly).

Alongside real, connected merchant accounts, there should be exactly one shared,
read-only **demo** identity that anyone can view without signing up — running the
exact same pipeline against a synthetic, clearly-labeled-as-synthetic store, so a
prospective customer can see the real product experience before connecting their own
data. The demo identity must never be a valid target for any action that would
normally cost money or persist a real change (starting a subscription, for
instance) — it exists to be looked at, not transacted through.

---

## 6. The business model

**Core product:** subscription tiers gated on the amount of detail shown, not on
which numbers are true. A free tier shows a small, fixed slice of one analysis run
(e.g., the top 3 recommendations) as a genuine, ungated taste of the real product —
never a teaser built from fake or truncated data. Paid tiers unlock the full ranked
list, deeper per-category detail (customer/geography/product breakdowns), and data
export. Gating must be enforced at the point data is fetched/prepared for display,
never by sending the full data and hiding part of it visually — a technically
sophisticated user should never be able to see paid-tier data through a free-tier
account by inspecting what was actually sent to them.

**Satellite revenue — concierge audits.** Beyond the core subscription, the same
underlying discipline (compute real numbers, cite evidence, never guess) supports a
separate line of one-time, higher-priced diagnostic reports sold to a broader
audience than just existing subscribers — each one a focused answer to a single
adjacent question a store operator cares about, for example: how healthy is your
retention/email program, how visible is your brand to AI shopping assistants, how
"agent-ready" is your storefront for automated purchasing, are your product reviews
showing integrity red flags, is your returns process being abused by a small cohort
of customers. These are lower-volume, higher-touch products — a founder or operator
reviews and delivers each one personally rather than the product being a fully
self-serve automated surface — and each is priced and sold independently (a simple
payment link, not embedded subscription billing). Every finding in these reports
still must obey the same grounding rule: cited evidence or it doesn't ship, and where
a claim can't yet be computed from available data, the report says so and stops
there rather than padding with a guess. Critically, when a signal genuinely can't be
computed with real, defensible logic (no reliable underlying data exists, or no
credible methodology exists), the honest move is to leave it out and say why —
never to fake a plausible-sounding heuristic just to look complete.

**Growth marketing follows the same rule as the product.** Landing pages built for
specific store verticals (pet products, candles, apparel, etc.) should use real,
computed numbers from a synthetic demo run for that vertical — never hand-typed
statistics — and any external market statistic used for context must link to its
real source. No fabricated customer counts, review counts, or testimonials, ever,
anywhere in marketing surfaces. A small number of focused vertical pages, measured
honestly against real conversion data, beats a large number of generic ones — let
actual visitor behavior decide which angle is working, not internal enthusiasm.

---

## 7. What "good" looks like

A successful build of this system, independent of how it's implemented, has these
properties:

- A merchant can connect their store and, within minutes, see a short list of
  specific, plain-language recommendations that are unmistakably about *their*
  business — numbers they recognize as their own, not boilerplate.
- No recommendation ever contains a number that isn't traceable to something real in
  that merchant's data. This should be checkable by a skeptical outsider — "show me
  where this $4,200 came from" should always have a real answer.
- A merchant with too little data or history sees honest "not enough data yet"
  messaging in the relevant places, never a confident-sounding number built on
  nothing.
- The free experience is good enough to be genuinely useful and trustworthy on its
  own, not deliberately crippled to force an upgrade — the upgrade should be earned
  by offering more, not by making the free tier worse than it could be.
- Someone reviewing this system for the first time — a technical evaluator, a
  skeptical customer, a regulator — can verify every displayed claim traces to real,
  computed, cited data, with no exceptions they have to take on faith.
- The system gets more accurate and more trusted over time because it actually
  checks whether its own recommendations worked, not because it claims more
  confidently.

## 8. Explicit non-goals

- This is **not** a general business-intelligence/dashboarding tool. If a feature's
  main value is "here's a chart to explore," it's out of scope — the product's job
  ends at "here's what to do," not "here's data to think about."
- This is **not** an autonomous execution tool in its early form — it tells the
  merchant what to do; it does not (at this stage) take the action on their behalf
  (send the campaign, change the price, issue the refund policy). That's a
  deliberate, revisitable scope boundary, not an oversight.
- This does **not** attempt advertising-attribution modeling, full marketing-mix
  analysis, or inventory/supply-chain optimization — those are different, harder
  problems with different data requirements, and pretending to solve them with
  order-history data alone would violate the grounding principle in §2.
- The concierge-audit line is explicitly **not** meant to become a fully automated,
  self-serve product surface in its current form — the human-review step is a
  deliberate quality gate for signals that are too nuanced, too legally sensitive
  (e.g. review-compliance findings), or too new to trust to fully automated
  delivery yet.
