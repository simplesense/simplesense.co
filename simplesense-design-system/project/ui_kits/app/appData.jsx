/* global window */
/* ============================================================
   SimpleSense — shared demo data model.
   One coherent store ("Maple & Oak Goods") that every view reads
   from, so the app feels like a single real account. Exposed on
   window.SS_DATA. For the Claude Code handoff this is the explicit
   data contract behind the screens.
   ============================================================ */

const store = {
  name: "Maple & Oak Goods",
  plan: "Pro",
  platform: "Shopify",
  category: "Home & Lifestyle",
  locations: ["Portland, OR — Pearl District", "Portland, OR — Hawthorne"],
  history: "3.2 years",
  sources: ["Shopify", "GA4", "Meta Ads", "Klaviyo"],
};

// The three signature moves (Pattern → Why → Move → Impact), enriched for deep-dives.
const moves = [
  {
    rank: 1,
    id: "geo",
    category: "Geographic concentration",
    pattern: "82% of your customers live within 5 miles of your two stores.",
    why: "You're paying national ad rates to reach an audience that is effectively local — and never offering them pickup.",
    moves: [
      "Geo-fence Meta & Google to a 5-mile radius",
      "Turn on local pickup (BOPIS) via Shopify Flow",
      "Shift budget from national spray to local high-intent",
    ],
    impact: "+$4–7k / mo",
    impactLow: 4000, impactHigh: 7000,
    confidence: "Grounded in 3.2 yrs of order data",
    confidencePct: 92,
    evidence: "Of 4,210 customers with a deliverable address, 3,452 sit inside the 5-mile ring around your two stores. National prospecting spend is $6.1k/mo against a 0.4% match rate.",
  },
  {
    rank: 2,
    id: "pareto",
    category: "Pareto customer economics",
    pattern: "Your top 20% of customers drive 71% of revenue — most came from one channel.",
    why: "These buyers are under-served. There's no VIP path, and the channel that produced them is under-funded.",
    moves: [
      "Build the top-20% Klaviyo segment (auto-defined)",
      "Launch a VIP flow: early access + private sales",
      "Double down on the channel that produced them",
    ],
    impact: "+$3–5k / mo",
    impactLow: 3000, impactHigh: 5000,
    confidence: "1,240 customers in segment",
    confidencePct: 88,
    evidence: "1,240 customers (the top quintile) generated $612k of your $862k trailing-12-mo revenue. 64% were first acquired through Klaviyo-driven email, your lowest-spend channel.",
  },
  {
    rank: 3,
    id: "inventory",
    category: "Inventory risk",
    pattern: "Four hero SKUs will stock out in ~11 days at the current sell-through.",
    why: "These four products carry 28% of revenue. A stockout during your peak week is the most expensive thing on this list.",
    moves: [
      "Reorder the 4 flagged SKUs today",
      "Pause paid traffic pointing at at-risk variants",
      "Set a low-stock Flow alert at 14 days of cover",
    ],
    impact: "Protects ~$18k",
    impactLow: 18000, impactHigh: 18000,
    confidence: "Velocity from last 90 days",
    confidencePct: 95,
    evidence: "Wool Throw — Oat, Ceramic Mug Set, Linen Apron and Beeswax Candle x6 sell a combined 47 units/day with 512 units on hand: 10.9 days of cover. Lead time is 18 days.",
  },
];

// KPI tiles for the dashboard.
const kpis = [
  { label: "Conversion rate", value: "1.8%", delta: "+0.4pt", deltaTone: "success", icon: "graph-up-arrow", spark: [1.2, 1.3, 1.25, 1.4, 1.5, 1.55, 1.7, 1.8] },
  { label: "Repeat revenue", value: "38%", delta: "+5pt", deltaTone: "success", icon: "arrow-repeat", spark: [30, 31, 33, 32, 34, 36, 37, 38] },
  { label: "Est. lift on table", value: "$72k", delta: "3 moves", deltaTone: "clay", icon: "lightning-charge", spark: [40, 48, 52, 55, 60, 66, 70, 72] },
  { label: "Refund rate", value: "3.1%", delta: "Watch", deltaTone: "warning", icon: "arrow-counterclockwise", spark: [2.4, 2.5, 2.6, 2.7, 2.9, 3.0, 3.0, 3.1] },
];

// Customers — Pareto deciles (share of revenue per customer decile) + cohort retention.
const customers = {
  total: 6204,
  vip: 1240,
  avgLtv: 139,
  vipLtv: 494,
  // revenue share by decile (top decile first)
  paretoDeciles: [41, 17, 13, 9, 7, 5, 4, 2, 1.4, 0.6],
  // cohort retention heatmap: rows = acquisition month, cols = months since (0..5)
  cohorts: [
    { label: "Jan", row: [100, 47, 38, 33, 30, 28] },
    { label: "Feb", row: [100, 44, 36, 31, 28, 26] },
    { label: "Mar", row: [100, 51, 42, 37, 34, 31] },
    { label: "Apr", row: [100, 49, 40, 35, 32, null] },
    { label: "May", row: [100, 52, 43, 38, null, null] },
    { label: "Jun", row: [100, 55, 46, null, null, null] },
  ],
  segments: [
    { name: "VIP — top 20%", count: 1240, rev: 71, ltv: 494, tone: "primary" },
    { name: "Loyal repeat", count: 1612, rev: 18, ltv: 168, tone: "success" },
    { name: "One-time", count: 2890, rev: 9, ltv: 58, tone: "neutral" },
    { name: "At-risk lapsing", count: 462, rev: 2, ltv: 121, tone: "warning" },
  ],
};

// Geography — concentration around the two stores.
const geo = {
  withinRadius: 82,
  radiusMiles: 5,
  localCustomers: 3452,
  nationalSpend: 6100,
  regions: [
    { name: "Portland metro", pct: 82, customers: 3452, tone: "primary" },
    { name: "Salem / Eugene", pct: 7, customers: 295, tone: "success" },
    { name: "Seattle / Tacoma", pct: 5, customers: 210, tone: "neutral" },
    { name: "Bay Area", pct: 3, customers: 126, tone: "neutral" },
    { name: "Rest of US", pct: 3, customers: 127, tone: "neutral" },
  ],
};

// Products — SKU economics & inventory risk.
const products = [
  { name: "Wool Throw — Oat", sku: "WT-OAT", price: 128, margin: 61, velocity: 14, stock: 142, cover: 10, revShare: 9, risk: "danger" },
  { name: "Ceramic Mug Set (4)", sku: "CM-S4", price: 64, margin: 58, velocity: 19, stock: 168, cover: 9, revShare: 8, risk: "danger" },
  { name: "Linen Apron", sku: "LN-APR", price: 48, margin: 66, velocity: 9, stock: 96, cover: 11, revShare: 6, risk: "danger" },
  { name: "Beeswax Candle x6", sku: "BW-C6", price: 42, margin: 72, velocity: 12, stock: 106, cover: 9, revShare: 5, risk: "danger" },
  { name: "Cutting Board — Walnut", sku: "CB-WAL", price: 89, margin: 54, velocity: 6, stock: 410, cover: 68, revShare: 7, risk: "ok" },
  { name: "Cotton Throw Pillow", sku: "CT-PIL", price: 38, margin: 63, velocity: 8, stock: 520, cover: 65, revShare: 4, risk: "ok" },
  { name: "Stoneware Bowl Set", sku: "SW-BWL", price: 72, margin: 56, velocity: 5, stock: 288, cover: 58, revShare: 4, risk: "ok" },
  { name: "Hand Towel — Pair", sku: "HT-PR", price: 24, margin: 68, velocity: 11, stock: 640, cover: 58, revShare: 3, risk: "watch" },
];

// Monitoring — live store health + alert feed.
const monitoring = {
  health: 94,
  pulse: { orders: 38, revenue: 4820, sessions: 1294, conv: 1.9 },
  // last 24h hourly sessions (sparkline)
  sessions24h: [22, 18, 14, 11, 9, 8, 12, 26, 41, 58, 67, 72, 78, 81, 76, 70, 66, 71, 84, 92, 88, 74, 55, 38],
  alerts: [
    { tone: "danger", icon: "exclamation-triangle", title: "Wool Throw — Oat dips below 14 days of cover", time: "12 min ago", source: "Inventory" },
    { tone: "warning", icon: "graph-down-arrow", title: "Mobile checkout drop-off up 6pt week-over-week", time: "1 hr ago", source: "GA4" },
    { tone: "success", icon: "check-circle", title: "Meta CAC fell to $19.40 — below your $24 target", time: "3 hrs ago", source: "Meta Ads" },
    { tone: "neutral", icon: "arrow-repeat", title: "Klaviyo synced 1,240-customer VIP segment", time: "5 hrs ago", source: "Klaviyo" },
    { tone: "warning", icon: "cash-stack", title: "Refund rate ticked to 3.1% — watch, not yet flagged", time: "8 hrs ago", source: "Shopify" },
  ],
};

// Connections — data sources.
const connections = [
  { id: "shopify", name: "Shopify", desc: "Orders, products, customers, inventory", status: "connected", since: "Mar 2023", icon: "bag-check", records: "18,402 orders", color: "#1f8a5b" },
  { id: "ga4", name: "Google Analytics 4", desc: "Sessions, funnels, attribution", status: "connected", since: "Mar 2023", icon: "graph-up", records: "3.1M events", color: "#cd8420" },
  { id: "meta", name: "Meta Ads", desc: "Spend, CAC, campaign performance", status: "connected", since: "Apr 2023", icon: "bullseye", records: "$74k spend", color: "#0871e7" },
  { id: "klaviyo", name: "Klaviyo", desc: "Email & SMS flows, segments", status: "connected", since: "May 2023", icon: "envelope-paper", records: "42 flows", color: "#c25a3c" },
  { id: "gads", name: "Google Ads", desc: "Search & shopping spend", status: "available", since: null, icon: "google", records: null, color: "#0871e7" },
  { id: "tiktok", name: "TikTok Ads", desc: "Spend & conversions", status: "available", since: null, icon: "tiktok", records: null, color: "#211c15" },
];

// Team for settings.
const team = [
  { name: "Maple Oak", email: "maple@mapleoak.co", role: "Owner", you: true },
  { name: "Devin Park", email: "devin@mapleoak.co", role: "Operator" },
  { name: "Sam Reyes", email: "sam@mapleoak.co", role: "Viewer" },
];

window.SS_DATA = { store, moves, kpis, customers, geo, products, monitoring, connections, team };
