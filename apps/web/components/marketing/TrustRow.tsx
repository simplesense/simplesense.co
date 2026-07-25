/**
 * Extracted from the pricing page's inline `PROOF` array (SIMPLESENSE_NICHE_PAGES_CE_
 * ADDENDUM_2026-07-25 §1.3 point 9: "shared component from pricing page"). Same
 * content, same honest framing: verifiable guarantees, not testimonials — there are no
 * customers to quote yet, so nothing here claims otherwise.
 */
const PROOF: { icon: string; title: string; body: string }[] = [
  {
    icon: 'calculator',
    title: 'Every number is earned',
    body: 'Each figure is computed from your own Shopify data. When the data to support a number isn’t there, we show “insufficient” — never a fabricated 0 or an estimate.',
  },
  {
    icon: 'shield-lock',
    title: 'Encrypted, never logged',
    body: 'Your Shopify access token is encrypted at rest with AES-256-GCM and never logged. All traffic runs over TLS, and the database is encrypted at rest.',
  },
  {
    icon: 'diagram-3',
    title: 'Your data stays yours',
    body: 'Every read and write is scoped to your store. One merchant’s data is never joined to another’s — not for analysis, not for anything.',
  },
  {
    icon: 'eye-slash',
    title: 'The model only sees aggregates',
    body: 'SimpleSense sends the model aggregate metrics only — never raw customer records. And we don’t sell your store’s data.',
  },
  {
    icon: 'eye',
    title: 'See it before you commit',
    body: 'Get a free audit of your own store — real moves from your real numbers — with no credit card. Disconnect from Connections anytime and your ingested data is purged.',
  },
  {
    icon: 'person-badge',
    title: 'Built by an operator',
    body: 'SimpleSense is built by an operator who has run $1–15M Shopify stores — the moves are the ones a sharp operator would actually make.',
  },
]

export function TrustRow() {
  return (
    <div className="reads">
      {PROOF.map((p) => (
        <div key={p.title} className="read">
          <i
            className={`bi bi-${p.icon}`}
            style={{ color: 'var(--ss-blue-500)' }}
            aria-hidden="true"
          />
          <div className="n">{p.title}</div>
          <div className="d">{p.body}</div>
        </div>
      ))}
    </div>
  )
}
