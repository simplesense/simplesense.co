import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our story',
  description:
    'Why SimpleSense exists: 25 years operating retail and e-commerce, and the gap between the data every store already has and the judgment nobody has time to apply to it.',
}

/** The constraints the product is actually built to — each one is enforced somewhere in
 *  the codebase, not aspirational copy. */
const RULES = [
  {
    icon: 'calculator',
    title: 'Every number is computed, never generated',
    body: 'The math happens in code, deterministically. The language model explains and ranks — it never invents, rounds up, or extrapolates a figure. A validation layer rejects any recommendation citing a number that isn’t traceable to your data.',
  },
  {
    icon: 'shield-exclamation',
    title: '“Insufficient” beats a guess',
    body: 'If there isn’t enough history to compute something honestly, we say so. A confident wrong answer is worse than no answer, because you’ll act on it.',
  },
  {
    icon: 'rulers',
    title: 'Ranged, not falsely precise',
    body: 'Impact estimates come as ranges with a confidence score. Anyone quoting you a single exact dollar figure for a future outcome is performing a certainty they don’t have.',
  },
  {
    icon: 'patch-exclamation',
    title: 'No invented proof',
    body: 'No testimonials we didn’t earn, no logo walls, no “trusted by” claims. When we have real customers with real results, you’ll see those — and not a day before.',
  },
  {
    icon: 'lock',
    title: 'Your data stays yours',
    body: 'Read-only by default. Encrypted at rest, never logged. Cross-store learning uses aggregated patterns only — never one merchant’s raw data exposed to another. Disconnect and it’s purged.',
  },
  {
    icon: 'graph-up-arrow',
    title: 'We check whether the move worked',
    body: 'We record the metric before you act and measure it after. If the change is inside normal noise we report “inconclusive” rather than claim a win.',
  },
]

export default function StoryPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">Story</div>
        <h1 className="sec-title" style={{ maxWidth: '18ch', margin: '0 auto 20px' }}>
          Built by someone who <em>ran the stores.</em>
        </h1>
        <p style={{ maxWidth: '56ch', margin: '0 auto', color: 'var(--ss-ink-soft)' }}>
          Twenty-five years in retail and e-commerce teaches you one uncomfortable thing: most
          businesses already have the answer to their biggest question sitting in their own data.
          Nobody has the time to go and get it.
        </p>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="ss-prose" style={{ maxWidth: '64ch', margin: '0 auto' }}>
          <p>
            I&rsquo;ve worked both sides of that gap — at Nike and JCPenney, where returns
            weren&rsquo;t a line item but a department, a warehouse and a quarterly argument; and at
            SelectBlinds, Art Van and Conn&rsquo;s, where seasonal concentration and discount
            dependency were the two things that could quietly ruin an otherwise good year.
          </p>
          <p>
            The pattern was the same everywhere. The data existed. The reports existed. What
            didn&rsquo;t exist was anyone with both the time and the judgment to look at a
            store&rsquo;s full history and say:{' '}
            <em>do these three things this week, in this order, and here&rsquo;s why.</em>
          </p>
          <p>
            Enterprise brands solve this by hiring someone — a CMO, an analyst, an agency retainer.
            A store doing $1–15M can&rsquo;t, and that&rsquo;s precisely the size where a few right
            moves change the whole business. The judgment is what&rsquo;s expensive, and the
            judgment is what&rsquo;s missing.
          </p>
          <p>
            Everyone else sells a better rear-view mirror. SimpleSense is meant to be the co-pilot
            telling you where to turn next.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we actually built</div>
          <h2 className="sec-title">A short list, and then the receipt.</h2>
          <p>
            SimpleSense reads your full order history, computes the metrics that matter, and hands
            you a ranked list of moves — the pattern it found, why it matters, exactly what to do,
            and what it&rsquo;s worth. Then it measures whether the move worked. That last part is
            the whole point: dashboards stop at &ldquo;here&rsquo;s your data.&rdquo;
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">The rules we hold ourselves to</div>
          <h2 className="sec-title">Written down first, then built to.</h2>
          <p>
            A product that tells you what to do has to be trustworthy in a way a chart never does.
          </p>
        </div>
        <div className="reads">
          {RULES.map((r) => (
            <div key={r.title} className="read">
              <i
                className={`bi bi-${r.icon}`}
                style={{ color: 'var(--ss-blue-500)' }}
                aria-hidden="true"
              />
              <div className="n">{r.title}</div>
              <div className="d">{r.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Where we are</div>
          <h2 className="sec-title">Early, and honest about it.</h2>
          <p>
            The free audit works and costs nothing but a click. The paid intelligence audits are
            founder-delivered — slower, and better than pretending they&rsquo;re automated. Prices
            are flat: never a percentage of your GMV, never a percentage of &ldquo;recovered
            revenue,&rdquo; because both give us a reason to tell you things that aren&rsquo;t true.
            If the free audit doesn&rsquo;t show you something you didn&rsquo;t already know,
            don&rsquo;t upgrade. That&rsquo;s not modesty — it&rsquo;s the actual test.
          </p>
        </div>
        <div className="audit-sample" style={{ maxWidth: 620, margin: '0 auto' }}>
          <p className="finding-title">Satya — 25 years operating retail and e-commerce.</p>
          <p className="finding-body" style={{ marginBottom: 0 }}>
            Nike, JCPenney, SelectBlinds, Art Van, Conn&rsquo;s. Now building the thing I kept
            wishing existed.
            <br />
            <span style={{ color: 'var(--text-muted)' }}>
              Founder, SimpleSense · Phoenix, Arizona
            </span>
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8, textAlign: 'center' }}>
        <h2 className="sec-title" style={{ maxWidth: '20ch', margin: '0 auto 16px' }}>
          See what your data already knows.
        </h2>
        <p style={{ maxWidth: '52ch', margin: '0 auto 24px', color: 'var(--ss-ink-soft)' }}>
          Connect Shopify and get the free audit — your top moves, the gaps, and what they&rsquo;re
          worth. No card.
        </p>
        <a className="cta btn-lg" href="/sign-up">
          <span className="glint" />
          Get your free audit
        </a>
      </section>
    </>
  )
}
