import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Simple Sense handles your store data.',
}

export default function PrivacyPage() {
  return (
    <section className="section legal" style={{ paddingTop: 150 }}>
      <div className="legal-inner">
        <p className="sec-eyebrow">Privacy</p>
        <h1 className="legal-h1">Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <p>
          Simple Sense (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a prescriptive analytics service for
          Shopify merchants. This policy explains what we collect, why, and how we protect it. It is
          written in plain language on purpose &mdash; if anything here is unclear, email us.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Store data</strong> you authorize us to read from Shopify &mdash; orders,
            customers, products, and locations. We read it once during sync, reduce it to aggregate
            metrics, and use those to compute your recommendations.
          </li>
          <li>
            <strong>Account details</strong> &mdash; your email and organization, via our
            authentication provider.
          </li>
          <li>
            <strong>Billing details</strong> &mdash; handled by our payment processor; we never see
            or store full card numbers.
          </li>
        </ul>

        <h2>How we use it</h2>
        <p>
          Your store data is used solely to produce analytics and recommendations for{' '}
          <em>your own</em> store. We do not sell it, and we never join one merchant&rsquo;s data to
          another&rsquo;s. Any cross-store learning is limited to aggregated, anonymized outcomes
          (counts and averages across many stores) that can never identify an individual store.
        </p>

        <h2>How we protect it</h2>
        <ul>
          <li>Shopify access tokens are encrypted at rest (AES-256-GCM) and never logged.</li>
          <li>All traffic is served over TLS; our database is encrypted at rest.</li>
          <li>
            Raw customer PII is minimized &mdash; we keep the fields our analyzers need and no more.
          </li>
        </ul>

        <h2>Sub-processors</h2>
        <p>
          We rely on a small set of trusted infrastructure providers to run the service (hosting,
          database, authentication, payments, and the LLM that drafts recommendations from your
          aggregate metrics). We share only what each needs to function &mdash; the LLM, for
          instance, receives aggregate metrics, never raw customer records.
        </p>

        <h2>Your control &amp; deletion</h2>
        <p>
          You can disconnect your store at any time from the Connections screen, which purges its
          ingested data. To request export or full deletion of your account data, email us and
          we&rsquo;ll action it promptly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests: <a href="mailto:privacy@simplesense.co">privacy@simplesense.co</a>.
        </p>

        <p className="legal-note">
          This policy will evolve as the product does; material changes will be reflected in the
          &ldquo;last updated&rdquo; date above.
        </p>
      </div>
    </section>
  )
}
