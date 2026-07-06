import { TIERS, stripeConfig, type TierId } from '@ss/config'
import { Badge } from '@ss/ui'
import { getSession } from '@/lib/auth'
import { currentTier } from '@/lib/billing'
import { AppShell } from '@/components/AppShell'

export const dynamic = 'force-dynamic'

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

export default async function PlansPage() {
  const { orgId } = await getSession()
  const tier = await currentTier(orgId)
  const cfg = stripeConfig()

  return (
    <AppShell>
      <p className="ss-eyebrow" style={{ margin: 0 }}>
        PLANS & BILLING
      </p>
      <h1
        style={{
          margin: '4px 0 8px',
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
        }}
      >
        Pick your plan
      </h1>
      <p style={{ marginTop: 0, color: 'var(--text-body)' }}>
        The free Audit is the front door. Geo + Pareto — the omnichannel wedge — live in Basic.
      </p>
      {!cfg.hasCredentials ? (
        <div
          style={{
            background: 'var(--ss-warning-bg)',
            color: 'var(--ss-warning)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 13,
            margin: '12px 0',
            maxWidth: 760,
          }}
        >
          <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
          Checkout is wired — add <code>STRIPE_SECRET_KEY</code> +{' '}
          <code>STRIPE_PRICE_BASIC/PRO</code> to enable live billing.
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginTop: 16,
          maxWidth: 980,
        }}
      >
        {ORDER.map((id) => {
          const t = TIERS[id]
          const isCurrent = id === tier
          return (
            <div
              key={id}
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${isCurrent ? 'var(--action-primary)' : 'var(--border-hairline)'}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <strong style={{ fontSize: 16, color: 'var(--text-strong)' }}>{t.name}</strong>
                {isCurrent ? (
                  <Badge tone="primary" dot>
                    Current
                  </Badge>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 40,
                  color: 'var(--text-strong)',
                  lineHeight: 1,
                }}
              >
                ${t.priceMonthly}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                  }}
                >
                  /mo
                </span>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'grid',
                  gap: 8,
                  flex: 1,
                }}
              >
                {FEATURES[id].map((f) => (
                  <li
                    key={f}
                    style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text-body)' }}
                  >
                    <i className="bi bi-check2" style={{ color: 'var(--ss-success)' }} />
                    {f}
                  </li>
                ))}
              </ul>
              {id !== 'free' && !isCurrent ? (
                <form action="/api/billing/checkout" method="post">
                  <input type="hidden" name="tier" value={id} />
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--action-primary)',
                      color: 'var(--text-onbrand)',
                      fontWeight: 600,
                      boxShadow: 'var(--shadow-inset-glint), var(--shadow-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Upgrade to {t.name}
                  </button>
                </form>
              ) : null}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
