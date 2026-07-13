import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, flat pricing — a free store audit, then $99 Basic or $299 Pro. Every number grounded in your own Shopify data.',
}

type PlanCard = {
  tier: string
  badge?: string
  tagline: string
  price: string
  caption: string
  includes: string[]
  cta: string
  ghost?: boolean
  note: string
  featured?: boolean
}

// Prices mirror packages/config/src/tiers.ts (Free Audit $0 / Basic $99 / Pro $299).
// Basic is featured — the geo+Pareto omnichannel wedge lives there, on purpose.
const CARDS: PlanCard[] = [
  {
    tier: 'Free Audit',
    tagline: 'The front door — a full store audit and your top moves, on the house.',
    price: '$0',
    caption: 'free — no billing',
    includes: [
      'Your top 3 moves each run — what to do, why, and the dollar impact',
      'A full store audit built from your own Shopify data',
      'Geo + Pareto concentration shown as a teaser',
      'Every number grounded in your data — or marked “insufficient,” never faked',
    ],
    cta: 'Start free audit',
    ghost: true,
    note: 'No credit card required.',
  },
  {
    tier: 'Basic',
    badge: 'Recommended',
    tagline: 'Where the leverage lives — the whole ranked list, geo and Pareto included.',
    price: '$99',
    caption: 'per month · flat, no GMV tax',
    includes: [
      'Everything in Free Audit',
      'The full ranked move list — not just the top 3',
      'Geo + Pareto analysis — the omnichannel wedge, never paywalled to Pro',
      'Klaviyo / segment + SKU CSV exports',
      'Cohort / LTV (basic) and outcome tracking (summary)',
      '1 store',
    ],
    cta: 'Choose Basic',
    note: 'Preview free first — the audit needs no card.',
    featured: true,
  },
  {
    tier: 'Pro',
    tagline: 'When reading isn’t enough — execute in one click, across every store.',
    price: '$299',
    caption: 'per month · flat, no GMV tax',
    includes: [
      'Everything in Basic',
      'One-click execution — push moves to Klaviyo, Shopify Flow, and ads',
      'Full cohort / LTV and outcome tracking',
      'Multi-store + API access',
      'Priority support',
    ],
    cta: 'Choose Pro',
    note: 'Preview free first — upgrade when you’re ready to execute.',
  },
]

// Honest "social proof": verifiable guarantees, not testimonials. SimpleSense has no
// customers to quote yet — every claim here is checkable, and real quotes can drop in later.
const PROOF: { icon: string; title: string; body: string }[] = [
  {
    icon: 'calculator',
    title: 'Every number is earned',
    body: 'Each figure is computed from your own Shopify data. When the data to support a number isn’t there, we show “insufficient” — never a fabricated 0 or an estimate.',
  },
  {
    icon: 'shield-lock',
    title: 'Encrypted, never logged',
    body: 'Your Shopify access token is encrypted at rest with AES-256-GCM and never logged. All traffic runs over TLS, and the database is encrypted at rest.',
  },
  {
    icon: 'diagram-3',
    title: 'Your data stays yours',
    body: 'Every read and write is scoped to your store. One merchant’s data is never joined to another’s — not for analysis, not for anything.',
  },
  {
    icon: 'eye-slash',
    title: 'The model only sees aggregates',
    body: 'SimpleSense sends the model aggregate metrics only — never raw customer records. And we don’t sell your store’s data.',
  },
  {
    icon: 'eye',
    title: 'See it before you commit',
    body: 'Get a free audit of your own store — real moves from your real numbers — with no credit card. Disconnect from Connections anytime and your ingested data is purged.',
  },
  {
    icon: 'person-badge',
    title: 'Built by an operator',
    body: 'SimpleSense is built by an operator who has run $1–15M Shopify stores — the moves are the ones a sharp operator would actually make.',
  },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Can I trust these numbers?',
    a: 'Every number is computed from your own Shopify data. When the data to support a figure isn’t there, we show “insufficient” rather than a fabricated 0 or an estimate — so you can trust what you act on.',
  },
  {
    q: 'Is the free audit really free?',
    a: 'Yes. The Free Audit costs $0 and needs no credit card. You connect Shopify in one click and see your store’s top 3 moves — each with what to do, why, and the dollar impact — built entirely from your own data.',
  },
  {
    q: 'What’s the difference between free and paid?',
    a: 'Free shows a fixed top 3 moves per run. Basic ($99/mo) unlocks the full ranked move list, geo + Pareto analysis, and Klaviyo / segment + SKU exports. Pro ($299/mo) adds one-click execution, full cohort / LTV and outcomes, multi-store, and API access.',
  },
  {
    q: 'Is my store’s data safe and private?',
    a: 'Your Shopify access token is encrypted at rest (AES-256-GCM) and never logged, all traffic runs over TLS, and the database is encrypted at rest. Your data is strictly scoped to your store and never joined to another merchant’s. The model only ever receives aggregate metrics, never raw customer records — and we don’t sell your data.',
  },
  {
    q: 'How do I get started?',
    a: 'Connect Shopify with a one-click OAuth and your first moves land in minutes. The free audit needs no credit card, so you can see real output before deciding anything.',
  },
  {
    q: 'Why is geo + Pareto in Basic and not Pro?',
    a: 'Geo + Pareto is the omnichannel wedge — the fastest way to see where your revenue actually concentrates — so we put it in Basic on purpose, not behind the top tier. Pro earns its price on execution, depth, and scale instead.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes. Disconnecting from the Connections screen purges the data we’ve ingested. For a full export or complete deletion, email us and we’ll handle it.',
  },
  {
    q: 'How does billing work?',
    a: 'Basic and Pro are billed monthly at a flat rate — $99 and $299 — and the price never scales with your GMV. You start entirely free with no card; you only enter billing details when you choose a paid plan.',
  },
]

export default function PricingPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 150, paddingBottom: 16 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Pricing</div>
          <h1 className="sec-title">
            See your top moves free. <em>Upgrade when it earns it.</em>
          </h1>
          <p>
            Connect Shopify in one click for a free store audit — no credit card. When you want the
            full ranked list, geo + Pareto, and exports, Basic is a flat $99 a month that never
            taxes your growth.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="price-grid">
          {CARDS.map((c) => (
            <div key={c.tier} className={`price-card${c.featured ? ' featured' : ''}`}>
              {c.badge ? <div className="badge">{c.badge}</div> : null}
              <div className="tier">{c.tier}</div>
              <div className="tagline">{c.tagline}</div>
              <hr className="divider" />
              <div className="price">{c.price}</div>
              <div className="price-caption">{c.caption}</div>
              <div className="includes-label">Includes</div>
              <ul>
                {c.includes.map((f) => (
                  <li key={f}>
                    <i className="bi bi-check2" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                className={c.ghost ? 'btn-ghost-lg' : 'cta'}
                href="/sign-up"
                style={{ justifyContent: 'center' }}
              >
                {c.ghost ? null : <span className="glint" />}
                {c.cta}
              </a>
              <div className="card-note">{c.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section proof">
        <div className="section-head">
          <div className="sec-eyebrow">Why you can trust the numbers</div>
          <h2 className="sec-title">
            Proof you can <em>verify yourself.</em>
          </h2>
          <p>
            No borrowed logos, no invented reviews — run a free audit and see the grounded output
            for yourself before you pay. Here’s how SimpleSense earns the trust to read your
            numbers; real operator stories will land here as they come in.
          </p>
        </div>
        <div className="reads">
          {PROOF.map((p) => (
            <div key={p.title} className="read">
              <i className={`bi bi-${p.icon}`} aria-hidden="true" />
              <div className="n">{p.title}</div>
              <div className="d">{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <h2>
            Get your first moves <em>in minutes.</em>
          </h2>
          <p>
            Connect Shopify in one click and see your store’s top moves — grounded in your real
            numbers, no credit card. Upgrade only when the full playbook earns it.
          </p>
          <a
            className="cta btn-lg"
            href="/sign-up"
            style={{ background: '#fff', color: 'var(--ss-ink)', borderColor: '#fff' }}
          >
            <span
              className="glint"
              style={{ background: 'linear-gradient(to bottom,#fff,transparent)' }}
            />
            Get your free audit <i className="bi bi-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="sec-eyebrow">FAQ</div>
          <h2 className="sec-title">Questions, answered.</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                {f.q}
                <i className="bi bi-chevron-down" aria-hidden="true" />
              </summary>
              <div className="faq-a">{f.a}</div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
