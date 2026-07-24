import type { Metadata } from 'next'
import { auditPaymentLink } from '@ss/config'
import { AuditIntakeForm } from './AuditIntakeForm'

export const metadata: Metadata = {
  title: 'Retention X-Ray — Klaviyo audit',
  description:
    'A ranked, dollar-quantified audit of your Klaviyo retention program — flow coverage, revenue trends, list health, and margin risk, computed from your own account.',
}

const CATEGORIES = [
  {
    icon: 'diagram-3',
    title: 'Flow coverage',
    body: 'Which of the 6 canonical flows (welcome, abandoned checkout/browse, post-purchase, winback, sunset) are missing, or live but silently gone dormant.',
  },
  {
    icon: 'graph-down-arrow',
    title: 'Revenue-per-recipient trend',
    body: 'Every flow compared against its own 90-day-ago baseline — the decays that never trigger an alert.',
  },
  {
    icon: 'exclamation-triangle',
    title: 'Cadence & fatigue',
    body: 'Rising spam-complaint and unsubscribe trends, quiet-hours violations — the early warnings before deliverability breaks.',
  },
  {
    icon: 'list-check',
    title: 'List health',
    body: 'Sunset policy present or not, and the share of your list that has gone quiet without anyone noticing.',
  },
  {
    icon: 'people',
    title: 'Segment architecture',
    body: 'Whether a real VIP segment and an at-risk segment exist — the two highest-leverage groups most accounts never formalize.',
  },
  {
    icon: 'percent',
    title: 'Discount dependency',
    body: 'How much of your campaign revenue is discount-driven — a margin risk that compounds silently.',
  },
]

export default function RetentionXRayPage() {
  const paymentLink = auditPaymentLink('retention-x-ray')

  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">Retention X-Ray</div>
        <h1 className="sec-title" style={{ maxWidth: '18ch', margin: '0 auto 20px' }}>
          Your Klaviyo account, <em>audited like an operator would.</em>
        </h1>
        <p style={{ maxWidth: '52ch', margin: '0 auto 20px', color: 'var(--ss-ink-soft)' }}>
          A ranked, dollar-quantified read of your retention program — flow coverage, revenue
          trends, list health, and margin risk — computed from your own Klaviyo account. Read-only
          API key, no password, no account access. Delivered as a branded report.
        </p>
        <div className="audit-price-band">
          <span className="price">$750–1,500</span>
          <span className="unit">/ audit · delivered within days</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we check</div>
          <h2 className="sec-title">Six categories, every figure grounded.</h2>
          <p>
            No category is guessed — where the data to assess something isn&rsquo;t available, the
            report says so, rather than filling the gap with an estimate.
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
          <div className="label">high · flow revenue-per-recipient trend</div>
          <p className="finding-title">
            1 flow down 20%+ vs. its 90-day-ago baseline: Welcome Series.
          </p>
          <p className="finding-body">
            <strong>Next step:</strong> Refresh creative/copy on Welcome Series. Re-check
            revenue-per-recipient in 30 days.
          </p>
          <span className="finding-dollar">$500–$1,000 estimated impact</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Request your audit</div>
          <h2 className="sec-title">Tell us where to send it.</h2>
          <p>
            We&rsquo;ll follow up by email with 5 short steps to create a read-only Klaviyo key.
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
