import type { Metadata } from 'next'
import { auditPaymentLink } from '@ss/config'
import { AuditIntakeForm } from './AuditIntakeForm'

export const metadata: Metadata = {
  title: 'ReviewProof — FTC review-rule exposure audit',
  description:
    'Where your review programme sits against the FTC’s Rule on Consumer Reviews and Testimonials (16 CFR Part 465) — evidence and citations, surfaced as risk, never as legal advice.',
}

/**
 * M3 ReviewProof. This page is deliberately honest that the module runs THREE signals,
 * not five: two of the plan's original five ("insider reviews", "review hijacking") are
 * permanently out of scope — the first isn't detectable from public data, and the second
 * was dropped from the FTC's FINAL rule. Selling five and delivering three, or padding
 * with a heuristic, would break the same grounding rule the product is built on.
 */
const SIGNALS = [
  {
    icon: 'gift',
    live: true,
    title: 'Incentives tied to a positive review',
    body: 'Scans the review-request emails you forward us for language conditioning a reward on a 5-star or positive outcome. Incentivising a review of ANY sentiment is legal; conditioning it on sentiment is not — we check for the difference, not the keyword.',
  },
  {
    icon: 'graph-down-arrow',
    live: true,
    title: 'Review-count regression',
    body: 'We capture your public review widget over time and flag it when the published count goes DOWN. Real reviews don’t vanish on their own — a drop is either platform moderation or suppression, and you should know which.',
  },
  {
    icon: 'activity',
    live: true,
    title: 'Review-timing bursts',
    body: 'An unusually dense cluster of reviews measured against your own store’s baseline posting rate — the shape purchased batches make. Needs at least 10 dated reviews in your widget’s structured data, or we report insufficient rather than guess.',
  },
  {
    icon: 'slash-circle',
    live: false,
    title: 'Undisclosed insider reviews',
    body: 'Not offered. Detecting employee or family reviews reliably needs data no public page exposes. We’d rather leave it out than sell you a guess dressed as a finding.',
  },
  {
    icon: 'slash-circle',
    live: false,
    title: 'Review hijacking',
    body: 'Not offered. It appeared in the FTC’s PROPOSED rule but was dropped from the final one, so there is no Part 465 penalty provision to measure you against.',
  },
]

export default function ReviewProofPage() {
  const paymentLink = auditPaymentLink('review-proof')
  const liveCount = SIGNALS.filter((s) => s.live).length

  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">ReviewProof</div>
        <h1 className="sec-title" style={{ maxWidth: '20ch', margin: '0 auto 20px' }}>
          Would your reviews <em>survive</em> a closer look?
        </h1>
        <p style={{ maxWidth: '54ch', margin: '0 auto 20px', color: 'var(--ss-ink-soft)' }}>
          The FTC&rsquo;s Rule on Consumer Reviews and Testimonials (16 CFR Part 465) has been in
          force since October 2024, and it carries civil penalties per violating review. This audit
          shows you where your own review programme sits against it — every finding tied to the
          evidence behind it.
        </p>
        <div className="audit-price-band">
          <span className="price">$450</span>
          <span className="unit">/ audit · {liveCount} live signals · delivered within days</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we check</div>
          <h2 className="sec-title">Three signals we can prove. Two we won&rsquo;t fake.</h2>
          <p>
            Most vendors would list five. Two of these can&rsquo;t be measured honestly from the
            data available, so they&rsquo;re priced out and marked below rather than padded in.
          </p>
        </div>
        <div className="reads">
          {SIGNALS.map((s) => (
            <div key={s.title} className="read" style={s.live ? undefined : { opacity: 0.72 }}>
              <i
                className={`bi bi-${s.icon}`}
                style={{ color: s.live ? 'var(--ss-blue-500)' : 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <div className="n">
                {s.title}
                {s.live ? null : (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    not offered
                  </span>
                )}
              </div>
              <div className="d">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Sample finding</div>
          <h2 className="sec-title">Risk surfaced, with the receipt.</h2>
          <p>Illustrative — the format every real finding follows.</p>
        </div>
        <div className="audit-sample">
          <div className="label">high · incentivised reviews</div>
          <p className="finding-title">
            2 of 14 review-request emails offer a discount conditioned on a 5-star review
            specifically.
          </p>
          <p className="finding-body">
            <strong>Next step:</strong> Drop the sentiment condition — &ldquo;leave a review, get
            10% off&rdquo; is fine; &ldquo;leave a 5-star review, get 10% off&rdquo; is the part
            that creates exposure. Both flagged emails are named in the report with the offending
            line quoted.
          </p>
          <span className="finding-dollar">16 CFR Part 465 · risk surfacing, not legal advice</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Request your audit</div>
          <h2 className="sec-title">Tell us where to send it.</h2>
          <p>
            We&rsquo;ll tell you up front which signals your data actually supports before you pay.
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
        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            maxWidth: '62ch',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          SimpleSense surfaces risk patterns and cites the rule text behind them. It is not a law
          firm and this audit is not legal advice — judgment calls go to your own counsel.
        </p>
      </section>
    </>
  )
}
