import type { VerticalConfig, VerticalDemoResult } from '@ss/verticals'
import { LockedMovesCard } from '@/components/locked'
import { TrustRow } from './TrustRow'
import { FounderBlock } from './FounderBlock'
import { HowItWorksCondensed } from './HowItWorksCondensed'
import { TrackedCta } from './TrackedCta'

/**
 * One shared template, per-vertical skin (addendum §1.3) — adding a future vertical is
 * config + copy, never a new component. Section order matches §1.3 exactly.
 */
export function VerticalPageTemplate({
  config,
  demo,
}: {
  config: VerticalConfig
  demo: VerticalDemoResult
}) {
  return (
    <>
      {/* 1. Hero */}
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">{config.displayName}</div>
        <h1 className="sec-title" style={{ maxWidth: '22ch', margin: '0 auto 20px' }}>
          {config.hero.headline}
        </h1>
        <p style={{ maxWidth: '58ch', margin: '0 auto 16px', color: 'var(--ss-ink-soft)' }}>
          {config.hero.subhead}
        </p>
        <p
          style={{
            maxWidth: '52ch',
            margin: '0 auto 28px',
            fontSize: 13.5,
            color: 'var(--text-muted)',
          }}
        >
          {config.hero.proofLine}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <TrackedCta
            className="cta btn-lg"
            href="/sign-up"
            eventName="vertical_hero_primary_cta"
            vertical={config.slug}
          >
            <span className="glint" />
            Get your free audit
          </TrackedCta>
          <TrackedCta
            className="cta btn-lg"
            href="/audit/demo"
            eventName="vertical_hero_sample_cta"
            vertical={config.slug}
            style={{
              background: 'transparent',
              color: 'var(--text-strong)',
              border: '1px solid var(--border-strong)',
            }}
          >
            See a sample {config.displayName.toLowerCase()} audit
          </TrackedCta>
        </div>
      </section>

      {/* 2. Sample audit strip */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Sample audit</div>
          <h2 className="sec-title">
            {demo.storeName} — <em>a synthetic demo store.</em>
          </h2>
          <p>
            Every figure below is computed by SimpleSense&rsquo;s real analysis pipeline on a
            synthetic demo store, not hand-written — the same pipeline that reads your own data.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 20, maxWidth: 760, margin: '0 auto' }}>
          {demo.moves.map((m) => (
            <div key={m.title} className="audit-sample">
              <div className="label">move</div>
              <p className="finding-title">{m.title}</p>
              <p className="finding-body">{m.narrative}</p>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 760, margin: '20px auto 0' }}>
          <LockedMovesCard count={3} />
        </div>
      </section>

      {/* 3. Built for stores like yours */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Built for stores like yours</div>
          <h2 className="sec-title">Not a generic audit.</h2>
        </div>
        <div className="reads">
          {config.painPoints.map((p) => (
            <div key={p.claim.slice(0, 40)} className="read">
              <i
                className="bi bi-check2-circle"
                style={{ color: 'var(--ss-blue-500)' }}
                aria-hidden="true"
              />
              <div className="d">{p.claim}</div>
              {p.cite !== 'editorial' ? (
                <a
                  href={p.cite.sourceUrl}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-link)',
                    marginTop: 8,
                    display: 'inline-block',
                  }}
                >
                  Source: {p.cite.sourceName}
                </a>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                    display: 'inline-block',
                  }}
                >
                  Editorial — not a statistical claim
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. How it works (shared) */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">How it works</div>
          <h2 className="sec-title">From your data to your next move.</h2>
        </div>
        <HowItWorksCondensed />
      </section>

      {/* 5. Spearhead offer card */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Paired audit</div>
          <h2 className="sec-title">Want the deep version?</h2>
        </div>
        <div
          className="audit-price-band"
          style={{ display: 'block', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}
        >
          <span className="price">{config.spearhead.price}</span>
          <span className="unit" style={{ display: 'block', marginTop: 8 }}>
            <TrackedCta
              href={config.spearhead.auditPath}
              className="cta"
              eventName="vertical_spearhead_cta"
              vertical={config.slug}
              style={{ marginTop: 12 }}
            >
              See the {config.spearhead.module.replace(/-/g, ' ')} audit
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </TrackedCta>
          </span>
        </div>
      </section>

      {/* 6. Benchmarks block */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Where the numbers come from</div>
          <h2 className="sec-title">Cited, not invented.</h2>
        </div>
        <div className="reads">
          {config.benchmarks.map((b) => (
            <div key={b.stat} className="read">
              <i
                className="bi bi-graph-up-arrow"
                style={{ color: 'var(--ss-clay-500)' }}
                aria-hidden="true"
              />
              <div className="d">{b.stat}</div>
              <a
                href={b.sourceUrl}
                style={{
                  fontSize: 12,
                  color: 'var(--text-link)',
                  marginTop: 8,
                  display: 'inline-block',
                }}
              >
                Source: {b.sourceName}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Niche FAQ */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">FAQ</div>
          <h2 className="sec-title">Questions {config.displayName.toLowerCase()} ask.</h2>
        </div>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
          {config.faq.map((f) => (
            <div key={f.q} className="audit-sample">
              <p className="finding-title">{f.q}</p>
              <p className="finding-body" style={{ marginBottom: 0 }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: config.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </section>

      {/* 8. Founder block */}
      <section className="section" style={{ paddingTop: 8 }}>
        <FounderBlock line={config.founderLine} />
      </section>

      {/* 9. Trust row */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Why you can trust the numbers</div>
          <h2 className="sec-title">Proof you can verify yourself.</h2>
        </div>
        <TrustRow />
      </section>
    </>
  )
}
