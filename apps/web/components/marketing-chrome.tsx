export function MarketingNav() {
  return (
    <div className="nav-wrap">
      <nav className="nav">
        <a className="brand" href="/">
          Simple Sense
        </a>
        <div className="nav-links">
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/audit/demo">Sample audit</a>
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
          <h4>Who it&rsquo;s for</h4>
          <a href="/for/pet-brands">Pet brands</a>
          <a href="/for/candle-brands">Candle &amp; home fragrance</a>
          <a href="/for/apparel-brands">Apparel &amp; footwear</a>
        </div>
        <div className="fcol">
          <h4>Company</h4>
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
