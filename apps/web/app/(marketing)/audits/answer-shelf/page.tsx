import type { Metadata } from 'next'
import { auditPaymentLink } from '@ss/config'
import { AuditIntakeForm } from './AuditIntakeForm'

export const metadata: Metadata = {
  title: 'AnswerShelf — AI shelf-of-voice audit',
  description:
    'How often do ChatGPT, Claude, Gemini, and Perplexity recommend your brand for buying-intent questions in your category — and which pages earn the mention?',
}

const CATEGORIES = [
  {
    icon: 'graph-up',
    title: 'Share of voice',
    body: 'What share of high-intent buying questions in your category actually mention your brand.',
  },
  {
    icon: 'award',
    title: 'First-mention rate',
    body: 'Being mentioned isn’t enough — is your brand the first name a model reaches for, or an also-ran.',
  },
  {
    icon: 'emoji-smile',
    title: 'Recommendation sentiment',
    body: 'When a model mentions you, does it recommend warmly or hedge toward a competitor.',
  },
  {
    icon: 'link-45deg',
    title: 'Cited-source domains',
    body: 'The exact pages models cite when they recommend you — the concrete fix list, not generic SEO advice.',
  },
  {
    icon: 'bar-chart',
    title: 'Competitor delta',
    body: 'Your share of voice next to your named competitors’, not in isolation.',
  },
  {
    icon: 'clock-history',
    title: 'Week-over-week trend',
    body: 'A longitudinal history a new entrant can’t backfill — the moat is the trendline, not one snapshot.',
  },
]

export default function AnswerShelfPage() {
  const paymentLink = auditPaymentLink('answer-shelf')

  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">AnswerShelf</div>
        <h1 className="sec-title" style={{ maxWidth: '20ch', margin: '0 auto 20px' }}>
          Do the machines <em>recommend</em> you?
        </h1>
        <p style={{ maxWidth: '52ch', margin: '0 auto 20px', color: 'var(--ss-ink-soft)' }}>
          A ranked read of how often ChatGPT, Claude, Gemini, and Perplexity recommend your brand
          for buying-intent questions in your category — and exactly which pages earn the mention.
          Aggregates with sample counts, never a single-shot claim.
        </p>
        <div className="audit-price-band">
          <span className="price">$500</span>
          <span className="unit">/ audit · delivered within days</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we check</div>
          <h2 className="sec-title">Six signals, every one grounded.</h2>
          <p>
            Small samples render as &ldquo;insufficient&rdquo; rather than a shaky percentage —
            statistical honesty applied to stochastic model output.
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
          <div className="label">critical · share of voice</div>
          <p className="finding-title">
            You appear in 12% of high-intent answers in your category; Competitor X appears in 41%.
          </p>
          <p className="finding-body">
            <strong>Next step:</strong> Here are the 6 pages the models cite when they recommend
            Competitor X — strengthen the equivalent pages on your own site first.
          </p>
          <span className="finding-dollar">29-point gap to the category leader</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Request your audit</div>
          <h2 className="sec-title">Tell us where to send it.</h2>
          <p>We&rsquo;ll build your prompt set and run the first battery within days.</p>
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
