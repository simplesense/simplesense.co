/** Vertical pages, and the paid audit each one leads with. Single source for the nav
 *  menu — matches @ss/verticals' shipped configs and the /audits/* routes. */
const VERTICALS = [
  { href: '/for/pet-brands', label: 'Pet brands & boutiques', hint: 'Spearhead: Retention X-Ray' },
  { href: '/for/candle-brands', label: 'Candle & home fragrance', hint: 'Spearhead: AnswerShelf' },
  { href: '/for/apparel-brands', label: 'Apparel & footwear', hint: 'Spearhead: ReturnLens' },
]

const AUDITS = [
  { href: '/audits/retention-x-ray', label: 'Retention X-Ray', hint: 'Your Klaviyo money map' },
  { href: '/audits/answer-shelf', label: 'AnswerShelf', hint: 'Do the AI models recommend you?' },
  { href: '/audits/agent-ready', label: 'AgentReady', hint: 'Free storefront scan' },
  { href: '/audits/review-proof', label: 'ReviewProof', hint: 'FTC review-rule exposure' },
  { href: '/audits/return-lens', label: 'ReturnLens', hint: 'Returns-abuse intelligence' },
]

/** CSS-only dropdown (`.has-menu:hover/:focus-within .menu`) — no JS, so it works in a
 *  server component and degrades to plain links without hydration. */
function NavMenu({
  label,
  heading,
  items,
}: {
  label: string
  heading: string
  items: { href: string; label: string; hint: string }[]
}) {
  return (
    <div className="has-menu">
      <button className="menu-btn" type="button" aria-haspopup="true">
        {label} <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>
      <div className="menu">
        <div className="mlabel">{heading}</div>
        {items.map((i) => (
          <a key={i.href} href={i.href}>
            {i.label}
            <span className="d">{i.hint}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export function MarketingNav() {
  return (
    <div className="nav-wrap">
      <nav className="nav">
        <a className="brand" href="/">
          Simple Sense
        </a>
        <div className="nav-links">
          <a href="/how-it-works">How it works</a>
          <NavMenu label="Who it's for" heading="Built for your category" items={VERTICALS} />
          <NavMenu label="Audits" heading="Intelligence audits" items={AUDITS} />
          <a href="/pricing">Pricing</a>
        </div>
        <a className="cta" href="/sign-up">
          <span className="glint" />
          Get your free audit
        </a>
      </nav>
    </div>
  )
}

export function MarketingFooter() {
  return (
    <footer className="mkt">
      <div className="footer-art" />
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="wm">Simple Sense</div>
          <p>
            The co-pilot every $1–15M store has been missing — operator judgment, at software price.
          </p>
          <a className="cta" href="/sign-up">
            <span className="glint" />
            Start free
          </a>
        </div>
        <div className="fcol">
          <h4>Product</h4>
          <a href="/how-it-works">How it works</a>
          <a href="/audit/demo">Free audit</a>
          <a href="/pricing">Pricing</a>
          <a href="/app">Dashboard</a>
        </div>
        <div className="fcol">
          <h4>Audits</h4>
          {AUDITS.map((a) => (
            <a key={a.href} href={a.href}>
              {a.label}
            </a>
          ))}
        </div>
        <div className="fcol">
          <h4>Who it&rsquo;s for</h4>
          <a href="/for/pet-brands">Pet brands</a>
          <a href="/for/candle-brands">Candle &amp; home fragrance</a>
          <a href="/for/apparel-brands">Apparel &amp; footwear</a>
        </div>
        <div className="fcol">
          <h4>Company</h4>
          <a href="/story">Our story</a>
          <a href="/sign-in">Sign in</a>
          <a href="/sign-up">Sign up</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
      <div className="footer-base">
        <span>© 2026 SimpleSense.co · Built by an operator who has run the stores.</span>
        <div className="socials">
          <a href="#" aria-label="X">
            <i className="bi bi-twitter-x" />
          </a>
          <a href="#" aria-label="LinkedIn">
            <i className="bi bi-linkedin" />
          </a>
          <a href="#" aria-label="GitHub">
            <i className="bi bi-github" />
          </a>
        </div>
      </div>
    </footer>
  )
}
