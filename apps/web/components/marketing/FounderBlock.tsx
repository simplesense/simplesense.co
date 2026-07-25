/**
 * Vertical-relevant founder line (addendum §1.3 point 8) — one line per vertical,
 * never stretched beyond what's credible for that category. The specific claims
 * (Nike/JCPenney for apparel; SelectBlinds/Art Van/Conn's for candles/home; the
 * generic operator line for pet) come from the vertical config, authored by the
 * founder — this component only renders it consistently.
 */
export function FounderBlock({ line }: { line: string }) {
  return (
    <div className="audit-sample" style={{ textAlign: 'center' }}>
      <i
        className="bi bi-person-badge"
        style={{ color: 'var(--ss-clay-500)', fontSize: 28 }}
        aria-hidden="true"
      />
      <p className="finding-body" style={{ marginTop: 12 }}>
        {line}
      </p>
    </div>
  )
}
