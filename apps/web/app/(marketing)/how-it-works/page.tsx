export default function HowItWorksPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 150 }}>
        <div className="section-head">
          <div className="sec-eyebrow">How it works</div>
          <h2 className="sec-title">
            From your data to your <em>next move</em>.
          </h2>
          <p>
            Connect once. Every analysis turns years of order history into a short, ranked list of
            what to do — never another dashboard.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="num">01</div>
            <div>
              <h3>It reads everything you&apos;ve already got.</h3>
              <p>
                Connect Shopify in one click. Simple Sense ingests your full order, customer and
                product history — 3–5 years — and normalizes it, securely and read-only.
              </p>
              <div className="pills">
                <span className="pill">
                  <i className="bi bi-bag-check" /> Shopify, one click
                </span>
                <span className="pill">
                  <i className="bi bi-clock-history" /> 3–5 years analyzed
                </span>
                <span className="pill">
                  <i className="bi bi-shield-lock" /> Read-only, encrypted
                </span>
              </div>
            </div>
          </div>
          <div className="step">
            <div className="num">02</div>
            <div>
              <h3>It finds the patterns that matter.</h3>
              <p>
                Deterministic analyzers surface the non-obvious — geographic concentration,
                under-served VIPs, the SKU losing money. Only what crosses a threshold worth your
                time.
              </p>
              <div className="pills">
                <span className="pill">
                  <i className="bi bi-geo-alt" /> Concentration
                </span>
                <span className="pill">
                  <i className="bi bi-people" /> Pareto economics
                </span>
                <span className="pill">
                  <i className="bi bi-box-seam" /> Margin &amp; returns
                </span>
              </div>
            </div>
          </div>
          <div className="step">
            <div className="num">03</div>
            <div>
              <h3>You get a ranked list of moves — and why.</h3>
              <p>
                The few highest-ROI moves land in one read, ranked by expected impact. Each one is a
                complete unit: the pattern, why it matters, exactly what to do, and what it&apos;s
                worth.
              </p>
              <div className="pills">
                <span className="pill">
                  <i className="bi bi-list-ol" /> Ranked by impact
                </span>
                <span className="pill">
                  <i className="bi bi-lightning-charge" /> One-click apply
                </span>
                <span className="pill">
                  <i className="bi bi-activity" /> Measured lift
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="sec-eyebrow">The content unit</div>
          <h2 className="sec-title">The anatomy of a move</h2>
          <p>
            Every recommendation follows the same honest structure. No black box — you can see the
            working behind each call.
          </p>
        </div>
        <div className="reads">
          <div className="read">
            <i className="bi bi-1-circle" style={{ color: 'var(--ss-blue-500)' }} />
            <div className="n">Pattern</div>
            <div className="d">
              The non-obvious finding, pulled straight from your own numbers. Specific, never
              generic.
            </div>
          </div>
          <div className="read">
            <i className="bi bi-2-circle" style={{ color: 'var(--ss-clay-500)' }} />
            <div className="n">Why it matters</div>
            <div className="d">
              One plain line on the cost of the gap — so the move is a decision, not a mystery.
            </div>
          </div>
          <div className="read">
            <i className="bi bi-3-circle" style={{ color: 'var(--ss-success)' }} />
            <div className="n">The move</div>
            <div className="d">
              The exact actions to take, in order — with copy-ready segment and campaign specs.
            </div>
          </div>
          <div className="read">
            <i className="bi bi-4-circle" style={{ color: 'var(--ss-ink)' }} />
            <div className="n">Expected impact</div>
            <div className="d">
              A ranged estimate — never falsely precise — modeled on your figures, with its
              confidence.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="sec-eyebrow">Grounded, not guessed</div>
          <h2 className="sec-title">It only speaks from your data</h2>
          <p>
            Every number you see traces to a metric computed from your store. If the data isn&apos;t
            there, it says so — it never fills the gap with a guess.
          </p>
        </div>
        <div className="reads">
          <div className="read">
            <i className="bi bi-bag-check" style={{ color: '#1f8a5b' }} />
            <div className="n">Shopify</div>
            <div className="d">Orders, products, customers, ship-to, cost of goods.</div>
          </div>
          <div className="read">
            <i className="bi bi-graph-up" style={{ color: '#cd8420' }} />
            <div className="n">GA4 (soon)</div>
            <div className="d">Sessions, funnels and where conversion leaks.</div>
          </div>
          <div className="read">
            <i className="bi bi-bullseye" style={{ color: '#0871e7' }} />
            <div className="n">Meta &amp; Google (soon)</div>
            <div className="d">Spend, CAC and which audiences actually pay back.</div>
          </div>
          <div className="read">
            <i className="bi bi-envelope-paper" style={{ color: '#c25a3c' }} />
            <div className="n">Klaviyo (soon)</div>
            <div className="d">Flows and segments — and the channel behind your VIPs.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <h2>
            See your first moves <em>in minutes.</em>
          </h2>
          <p>
            Connect Shopify and get a free store audit — your highest-conviction moves, grounded in
            your real numbers.
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
            Get your free audit <i className="bi bi-arrow-right" />
          </a>
        </div>
      </section>
    </>
  )
}
