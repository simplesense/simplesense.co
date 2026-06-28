/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

const PLANS = [
  { id: "free", name: "Free audit", price: { mo: 0, yr: 0 }, tag: "One-time", blurb: "See the gaps. No card required.",
    features: ["Full store audit", "Operator score", "Top 3 gaps identified", "1 data source"], cta: "Current free tier" },
  { id: "basic", name: "Basic", price: { mo: 49, yr: 39 }, tag: null, blurb: "Weekly moves for a focused store.",
    features: ["Everything in Free", "Weekly ranked moves", "2 data sources", "Email digest", "12 months history"], cta: "Downgrade" },
  { id: "pro", name: "Pro", price: { mo: 129, yr: 99 }, tag: "Current", blurb: "The full co-pilot, all sources.",
    features: ["Everything in Basic", "All data sources", "Unlimited history", "Real-time alerts + SMS", "Auto-apply moves", "Priority support"], cta: "Current plan" },
];

function PlanCard({ p, cycle, current }) {
  const price = p.price[cycle];
  return (
    <div style={{ position: "relative", background: "var(--surface-card)", border: current ? "1.5px solid var(--ss-blue-500)" : "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", boxShadow: current ? "var(--shadow-md)" : "var(--shadow-xs)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {p.tag && <span style={{ position: "absolute", top: 16, right: 16, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: current ? "var(--ss-blue-700)" : "var(--text-muted)", background: current ? "var(--ss-blue-50)" : "var(--surface-soft)", padding: "4px 9px", borderRadius: "var(--radius-pill)" }}>{p.tag}</span>}
      <div>
        <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 19, color: "var(--text-strong)" }}>{p.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{p.blurb}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 44, color: "var(--text-strong)", lineHeight: 1 }}>${price}</span>
        <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{price === 0 ? "" : `/mo${cycle === "yr" ? ", billed yearly" : ""}`}</span>
      </div>
      <div style={{ display: "grid", gap: 9, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
        {p.features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, color: "var(--text-body)" }}>
            <span style={{ color: "var(--ss-success)", marginTop: 1 }}>✓</span>{f}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 6 }}>
        <Button variant={current ? "secondary" : p.id === "pro" ? "primary" : "ghost"} style={{ width: "100%" }} disabled={current}>{p.cta}</Button>
      </div>
    </div>
  );
}

function BillingView() {
  const { ViewHeader, Panel, SegToggle, Stat } = window.SSUI;
  const [cycle, setCycle] = React.useState("mo");
  const invoices = [
    { date: "Jun 22, 2026", amt: "$129.00", status: "Paid" },
    { date: "May 22, 2026", amt: "$129.00", status: "Paid" },
    { date: "Apr 22, 2026", amt: "$129.00", status: "Paid" },
  ];
  return (
    <div>
      <ViewHeader eyebrow="Account · Billing" title="Plans & billing"
        sub="Start free with the audit. Upgrade when the moves are paying for themselves.">
        <SegToggle value={cycle} onChange={setCycle} options={[{ id: "mo", label: "Monthly" }, { id: "yr", label: "Yearly · save 23%" }]} />
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 26, alignItems: "stretch" }}>
        {PLANS.map((p) => <PlanCard key={p.id} p={p} cycle={cycle} current={p.id === "pro"} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 18, alignItems: "start" }}>
        <Panel title="This cycle">
          <div style={{ display: "grid", gap: 18 }}>
            <Stat label="Moves applied" value="14" delta="this month" deltaTone="success" />
            <Stat label="Est. lift captured" value="$31k" delta="from applied moves" deltaTone="clay" />
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
              At $129/mo, Pro has returned <strong style={{ color: "var(--ss-success)" }}>~240×</strong> its cost this month.
            </div>
          </div>
        </Panel>
        <Panel title="Invoices" right={<Button size="sm" variant="ghost" icon="download">Download all</Button>} padding={0} style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <tbody>
              {invoices.map((iv, i) => (
                <tr key={iv.date} style={{ borderTop: i ? "1px solid var(--border-hairline)" : "none" }}>
                  <td style={{ padding: "14px 20px", color: "var(--text-strong)", fontWeight: 500 }}>{iv.date}</td>
                  <td style={{ padding: "14px 14px", fontFamily: "var(--font-ui-display)", fontWeight: 600 }}>{iv.amt}</td>
                  <td style={{ padding: "14px 14px" }}><Badge tone="success">{iv.status}</Badge></td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}><a href="#" style={{ color: "var(--text-link)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

window.BillingView = BillingView;
