/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

function CustomersView({ onOpenMove }) {
  const { ParetoChart, CohortHeatmap, BarRows } = window.SSCharts;
  const { ViewHeader, Panel, SectionLabel, Stat, Grounded, SegToggle } = window.SSUI;
  const { customers } = window.SS_DATA;
  const [cohortMode, setCohortMode] = React.useState("retention");

  return (
    <div>
      <ViewHeader eyebrow="Understand · Customers" title="Customer economics"
        sub="Who actually drives the revenue, how long they stay, and where the next dollar is hiding.">
        <Button variant="secondary" icon="download">Export segments</Button>
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <Panel padding={16}><Stat label="Total customers" value={customers.total.toLocaleString()} sub="all-time" /></Panel>
        <Panel padding={16}><Stat label="VIP segment (top 20%)" value={customers.vip.toLocaleString()} delta="71% of revenue" deltaTone="primary" /></Panel>
        <Panel padding={16}><Stat label="Avg LTV" value={"$" + customers.avgLtv} delta="+8% YoY" deltaTone="success" /></Panel>
        <Panel padding={16}><Stat label="VIP LTV" value={"$" + customers.vipLtv} delta="3.5× average" deltaTone="clay" /></Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start", marginBottom: 18 }}>
        <Panel title="The Pareto reality" sub="Share of revenue by customer decile, with the cumulative curve.">
          <ParetoChart deciles={customers.paretoDeciles} height={264} />
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            <Grounded icon="lightning-charge">
              Your top two deciles — 1,240 customers — generate 71% of revenue. There's a move here: <button onClick={() => onOpenMove("pareto")} style={{ border: "none", background: "none", padding: 0, color: "var(--text-link)", fontWeight: 600, cursor: "pointer", font: "inherit" }}>build the VIP flow →</button>
            </Grounded>
          </div>
        </Panel>

        <Panel title="Segments" sub="Auto-defined from order behavior.">
          <div style={{ display: "grid", gap: 14 }}>
            {customers.segments.map((s) => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</span>
                  <Badge tone={s.tone}>{s.count.toLocaleString()}</Badge>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--surface-soft)", overflow: "hidden" }}>
                  <div style={{ width: `${s.rev}%`, height: "100%", borderRadius: 4, background: s.tone === "primary" ? "var(--ss-blue-500)" : s.tone === "success" ? "var(--ss-success)" : s.tone === "warning" ? "var(--ss-warning)" : "var(--ss-ink-soft)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>{s.rev}% of revenue</span><span>${s.ltv} LTV</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Cohort retention" sub="% of each acquisition month still buying, by months since first order."
        right={<SegToggle size="sm" value={cohortMode} onChange={setCohortMode} options={[{ id: "retention", label: "Retention" }, { id: "revenue", label: "Revenue" }]} />}>
        <CohortHeatmap rows={customers.cohorts} />
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Grounded>Spring cohorts (Mar–Jun) retain ~10pt better than winter — your local, repeat-driven base is getting stickier.</Grounded>
        </div>
      </Panel>
    </div>
  );
}

window.CustomersView = CustomersView;
