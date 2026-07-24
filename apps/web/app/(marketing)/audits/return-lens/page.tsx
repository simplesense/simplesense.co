import type { Metadata } from 'next'
import { auditPaymentLink } from '@ss/config'
import { AuditIntakeForm } from './AuditIntakeForm'

export const metadata: Metadata = {
  title: 'Return Lens — returns-abuse audit',
  description:
    'A ranked, dollar-quantified audit of your returns program — serial refunders, size-bracketing, wardrobing, and high-return SKUs, computed from your own order and return exports.',
}

const CATEGORIES = [
  {
    icon: 'people',
    title: 'Cross-email identity resolution',
    body: 'Customers checking out under more than one email at the same shipping address — the simplest way a per-account return limit gets defeated.',
  },
  {
    icon: 'graph-up-arrow',
    title: 'Serial-refunder scoring',
    body: 'Every repeat customer scored against this store’s own cohort average return rate, not an industry guess.',
  },
  {
    icon: 'grid-3x3-gap',
    title: 'Size-bracketing detection',
    body: 'Orders that buy multiple sizes of the same style and return most of them — apparel/footwear’s single most common return-abuse pattern.',
  },
  {
    icon: 'clock-history',
    title: 'Wardrobing timing signal',
    body: 'Returns filed in the window that looks like "wore it, then returned it" — a signal to investigate, never an auto-deny basis.',
  },
  {
    icon: 'exclamation-diamond',
    title: 'High-return SKU clustering',
    body: 'Products whose return rate outpaces the rest of the catalog, with the dominant return reason — usually a sizing or listing problem, not a customer one.',
  },
  {
    icon: 'sliders',
    title: 'Policy-tier recommendation',
    body: 'A concrete cutoff: who keeps instant refunds, who moves to an inspection-required tier — based on this store’s own numbers.',
  },
]

export default function ReturnLensPage() {
  const paymentLink = auditPaymentLink('return-lens')

  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">Return Lens</div>
        <h1 className="sec-title" style={{ maxWidth: '18ch', margin: '0 auto 20px' }}>
          Your returns data, <em>audited like an operator would.</em>
        </h1>
        <p style={{ maxWidth: '52ch', margin: '0 auto 20px', color: 'var(--ss-ink-soft)' }}>
          A ranked, dollar-quantified read of your returns program — serial refunders,
          size-bracketing, wardrobing signals, and high-return SKUs — computed from your own order
          and return exports. No account access, no API key. Delivered as a branded report.
        </p>
        <div className="audit-price-band">
          <span className="price">$1,000</span>
          <span className="unit">/ audit · delivered within days</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we check</div>
          <h2 className="sec-title">Six categories, every figure grounded.</h2>
          <p>
            Outputs are review cohorts, never an auto-deny list — where the data to assess something
            isn&rsquo;t available, the report says so.
          </p>
        </div>
        <div className="reads">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="read">
              <i
                className={`bi bi-${c.icon}`}
                style={{ color: 'var(--ss-blue-500)' }}
                aria-hidden="true"
              />
              <div className="n">{c.title}</div>
              <div className="d">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Sample finding</div>
          <h2 className="sec-title">Not a checklist. An answer.</h2>
          <p>Illustrative — the format every real finding follows.</p>
        </div>
        <div className="audit-sample">
          <div className="label">high · serial-refunder scoring vs. cohort baseline</div>
          <p className="finding-title">
            2 customers return at 3x+ the cohort average (21%) — the highest returns 75% of their
            orders.
          </p>
          <p className="finding-body">
            <strong>Next step:</strong> Move flagged customers to an inspection-required refund tier
            for their next order; re-score after 90 days.
          </p>
          <span className="finding-dollar">$450 in refunds among flagged customers</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Request your audit</div>
          <h2 className="sec-title">Tell us where to send it.</h2>
          <p>
            We&rsquo;ll follow up by email with instructions for a 12-month order + return CSV
            export.
          </p>
        </div>
        <AuditIntakeForm />
        {paymentLink ? (
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 13.5,
              color: 'var(--text-muted)',
            }}
          >
            Already spoke with us?{' '}
            <a href={paymentLink} style={{ color: 'var(--text-link)' }}>
              Pay for your audit
            </a>
            .
          </p>
        ) : null}
      </section>
    </>
  )
}
