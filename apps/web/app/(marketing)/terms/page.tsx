import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for using Simple Sense.',
}

export default function TermsPage() {
  return (
    <section className="section legal" style={{ paddingTop: 150 }}>
      <div className="legal-inner">
        <p className="sec-eyebrow">Terms</p>
        <h1 className="legal-h1">Terms of Service</h1>
        <p className="legal-updated">Last updated: July 2026</p>

        <p>
          These terms govern your use of Simple Sense. By creating an account or connecting a store,
          you agree to them.
        </p>

        <h2>The service</h2>
        <p>
          Simple Sense reads your connected store&rsquo;s data and produces ranked, grounded
          recommendations. Every figure we show is computed from your own data &mdash; but the
          recommendations themselves are <strong>advisory</strong>. You decide what to act on; we
          don&rsquo;t guarantee any specific business outcome.
        </p>

        <h2>Your account</h2>
        <p>
          You&rsquo;re responsible for your account credentials and for the actions taken under your
          organization. Keep your login secure and let us know of any unauthorized use.
        </p>

        <h2>Connecting your store</h2>
        <p>
          You must have the right to connect any store you link, and to authorize us to read its
          data. You can disconnect at any time. Access is read-only for analysis.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Don&rsquo;t misuse the service: no attempts to breach security or tenant isolation, no
          reverse-engineering for a competing product, and no using it to violate anyone&rsquo;s
          rights or applicable law.
        </p>

        <h2>Plans &amp; billing</h2>
        <p>
          A free tier is available. Paid plans are billed via our payment processor on the cycle you
          select; you can change or cancel your plan at any time, effective at the end of the
          current period. Fees already incurred are non-refundable except where required by law.
        </p>

        <h2>Disclaimers &amp; liability</h2>
        <p>
          The service is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we
          disclaim implied warranties, and our aggregate liability is limited to the amount you paid
          us in the twelve months preceding the claim. Recommendations are decision support, not
          professional, financial, or legal advice.
        </p>

        <h2>Termination</h2>
        <p>
          You may stop using the service at any time. We may suspend or terminate access for breach
          of these terms. On termination you can request deletion of your data (see our{' '}
          <a href="/privacy">Privacy Policy</a>).
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves; the &ldquo;last updated&rdquo; date
          reflects the current version. Continued use after a change means you accept it.
        </p>

        <h2>Contact</h2>
        <p>
          Questions: <a href="mailto:hello@simplesense.co">hello@simplesense.co</a>.
        </p>
      </div>
    </section>
  )
}
