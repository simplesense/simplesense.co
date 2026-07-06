import { HeroVideo } from '@/components/HeroVideo'

// Self-hosted, compressed (720p, no audio, +faststart). One is chosen at random per visitor
// session — different visitors see a different ambient clip.
const HERO_VIDEOS = [
  { src: '/video/hero-1.mp4', poster: '/video/hero-1-poster.jpg' },
  { src: '/video/hero-2.mp4', poster: '/video/hero-2-poster.jpg' },
  { src: '/video/hero-3.mp4', poster: '/video/hero-3-poster.jpg' },
]

export default function LandingPage() {
  return (
    <>
      <header className="hero">
        <div className="hero-bg" aria-hidden="true">
          <HeroVideo sources={HERO_VIDEOS} />
          <div className="hero-bg-scrim" />
        </div>
        <div className="eyebrow-pill">
          <span className="tag">NEW</span> The prescriptive operator brain for e-commerce
        </div>
        <h1 className="hero-h">
          Stop drowning in data.
          <br />
          <em>Start executing.</em>
        </h1>
        <p className="hero-sub">
          Simple Sense reads your whole Shopify store and tells you the few moves to make this week
          — what to do, why, and the dollar impact. Every number earned from your own data.
        </p>
        <div className="hero-actions">
          <a className="cta btn-lg" href="/sign-up">
            <span className="glint" />
            Get your free audit <i className="bi bi-arrow-right" />
          </a>
          <a className="btn-ghost-lg" href="/audit/demo">
            <i className="bi bi-eye" /> See a sample audit
          </a>
        </div>
        <div className="trust">
          No credit card · Connect Shopify in one click · Your first moves in minutes
        </div>

        <div className="preview">
          <div className="preview-frame">
            <div className="preview-bar">
              <span className="dot" style={{ background: '#e0a98f' }} />
              <span className="dot" style={{ background: '#dcc98a' }} />
              <span className="dot" style={{ background: '#a9c4a0' }} />
              <span className="title">This week&apos;s moves · sample store</span>
            </div>
            <div className="preview-body">
              <div className="digest">
                <h3>This week&apos;s moves</h3>
                <div className="when">Ranked by expected impact · grounded in your data</div>
                <div className="mini-metric">
                  <span className="v">72%</span>
                  <span className="l">from top 20% of customers</span>
                  <span className="d" style={{ color: 'var(--accent)' }}>
                    VIP
                  </span>
                </div>
                <div className="mini-metric">
                  <span className="v">96%</span>
                  <span className="l">revenue within 5 mi</span>
                  <span className="d" style={{ color: 'var(--ss-success)' }}>
                    geo
                  </span>
                </div>
                <div className="mini-metric">
                  <span className="v">51%</span>
                  <span className="l">revenue discounted</span>
                  <span className="d" style={{ color: 'var(--ss-warning)' }}>
                    margin
                  </span>
                </div>
              </div>
              <div className="move">
                <div className="move-head">
                  <span className="rank">1</span>
                  <span className="move-cat">Customer retention</span>
                  <span className="impact">
                    <i className="bi bi-graph-up-arrow" /> +$1.8–3.5k/mo
                  </span>
                </div>
                <p className="move-pattern">
                  Just 6 customers account for 72% of your total revenue.
                </p>
                <ul className="move-list">
                  <li>
                    <i className="bi bi-check2" /> Build the exact top-20% VIP segment
                  </li>
                  <li>
                    <i className="bi bi-check2" /> Launch a VIP flow — early access, private sales
                  </li>
                  <li>
                    <i className="bi bi-check2" /> Double down on the channel that produced them
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="logos">
        <p>Reads your whole stack</p>
        <div className="row">
          <span>
            <i className="bi bi-bag-check" /> Shopify
          </span>
          <span>
            <i className="bi bi-graph-up" /> GA4
          </span>
          <span>
            <i className="bi bi-meta" /> Meta
          </span>
          <span>
            <i className="bi bi-google" /> Google Ads
          </span>
          <span>
            <i className="bi bi-envelope-paper" /> Klaviyo
          </span>
        </div>
      </section>
    </>
  )
}
