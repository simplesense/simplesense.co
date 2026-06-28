import { TIERS, type TierId } from '@ss/config'

const FEATURES: Record<TierId, string[]> = {
  free: ['Top moves only', 'Free store audit', 'Geo + Pareto teaser'],
  basic: [
    'Full ranked moves',
    'Geo + Pareto analysis',
    'Klaviyo / segment export',
    '1 store',
    'Cohort / LTV (basic)',
  ],
  pro: [
    'Everything in Basic',
    'One-click execution',
    'Full cohort / LTV + outcomes',
    'Multi-store + API',
    'Priority support',
  ],
}
const ORDER: TierId[] = ['free', 'basic', 'pro']

export default function PricingPage() {
  return (
    <section className="section" style={{ paddingTop: 150 }}>
      <div className="section-head">
        <div className="sec-eyebrow">Pricing</div>
        <h2 className="sec-title">
          Operator judgment, at <em>software price.</em>
        </h2>
        <p>
          The free Audit is the front door. Geo + Pareto — the omnichannel wedge — live in Basic,
          not behind a paywall.
        </p>
      </div>

      <div className="price-grid">
        {ORDER.map((id) => {
          const t = TIERS[id]
          return (
            <div key={id} className={`price-card${id === 'basic' ? ' featured' : ''}`}>
              <div className="tier">{t.name}</div>
              <div className="price">
                ${t.priceMonthly}
                <small>/mo</small>
              </div>
              <ul>
                {FEATURES[id].map((f) => (
                  <li key={f}>
                    <i className="bi bi-check2" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                className={id === 'free' ? 'btn-ghost-lg' : 'cta'}
                href="/sign-up"
                style={{ justifyContent: 'center' }}
              >
                {id !== 'free' ? <span className="glint" /> : null}
                {id === 'free' ? 'Start free' : `Choose ${t.name}`}
              </a>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-muted)' }}>
        Flat pricing that doesn&apos;t tax your growth — 2–13× under GMV-tiered incumbents.
      </p>
    </section>
  )
}
