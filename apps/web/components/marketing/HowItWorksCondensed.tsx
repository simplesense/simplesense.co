/**
 * Condensed 3-step, reusing the exact headlines/copy from /how-it-works (addendum
 * §1.3 point 4: "condensed 3-step from the main site... not duplicated text"). Not
 * yet imported by /how-it-works itself (kept that page untouched to limit tonight's
 * edit surface) — same words, no pills, shorter descriptions. See PARKING_LOT.md.
 */
const STEPS = [
  {
    num: '01',
    title: "It reads everything you've already got.",
    body: 'Connect Shopify in one click. Simple Sense ingests your full order, customer, and product history — 3–5 years — read-only.',
  },
  {
    num: '02',
    title: 'It finds the patterns that matter.',
    body: 'Deterministic analyzers surface the non-obvious — geographic concentration, under-served VIPs, the SKU losing money.',
  },
  {
    num: '03',
    title: 'You get a ranked list of moves — and why.',
    body: 'The few highest-ROI moves land in one read, ranked by expected impact — the pattern, why it matters, exactly what to do.',
  },
]

export function HowItWorksCondensed() {
  return (
    <div className="steps">
      {STEPS.map((s) => (
        <div key={s.num} className="step">
          <div className="num">{s.num}</div>
          <div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
