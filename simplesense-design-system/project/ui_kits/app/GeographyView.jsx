/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

function GeographyView({ onOpenMove }) {
  const { GeoConcentration, BarRows } = window.SSCharts;
  const { ViewHeader, Panel, Stat, Grounded } = window.SSUI;
  const { geo } = window.SS_DATA;
  const [radius, setRadius] = React.useState(5);
  // pct within radius grows with radius (diminishing) — illustrative
  const pctAt = (r) => Math.min(96, Math.round(58 + Math.log2(r + 1) * 14));
  const pct = radius === 5 ? geo.withinRadius : pctAt(radius);

  return (
    <div>
      <ViewHeader eyebrow="Understand · Geography" title="Where your demand actually lives"
        sub="Your customers are far more concentrated than your ad spend assumes. That gap is money." >
        <Button variant="primary" icon="bullseye" onClick={() => onOpenMove("geo")}>See the geo move</Button>
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, alignItems: "start", marginBottom: 18 }}>
        <Panel title="Concentration around your stores" sub="Each dot is a customer; clay markers are your two locations.">
          <GeoConcentration height={320} pct={pct} radiusMiles={radius} />
          <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--surface-inset)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}>Radius</span>
              <span style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 15, color: "var(--ss-blue-600)" }}>{radius} mi · {pct}% of customers</span>
            </div>
            <input type="range" min="2" max="25" value={radius} onChange={(e) => setRadius(+e.target.value)}
              style={{ width: "100%", accentColor: "var(--ss-blue-500)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}><span>2 mi</span><span>25 mi</span></div>
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Panel padding={16}><Stat label="Within 5 miles" value={geo.withinRadius + "%"} delta="3,452 customers" deltaTone="primary" /></Panel>
            <Panel padding={16}><Stat label="National prospecting" value={"$6.1k"} delta="0.4% match" deltaTone="danger" sub="per month, mostly wasted" /></Panel>
          </div>
          <Panel title="Customers by region">
            <BarRows items={geo.regions.map((r) => ({ label: r.name, pct: r.pct, value: r.pct + "%", tone: r.tone }))} />
          </Panel>
          <Panel padding={18} style={{ background: "var(--ss-blue-50)", border: "1px solid var(--ss-blue-100)" }}>
            <Grounded icon="lightning-charge">
              You're paying national rates for a local audience. Geo-fencing to 5 miles and turning on pickup is worth <strong style={{ color: "var(--ss-clay-600)" }}>+$4–7k / mo</strong>. <button onClick={() => onOpenMove("geo")} style={{ border: "none", background: "none", padding: 0, color: "var(--text-link)", fontWeight: 600, cursor: "pointer", font: "inherit" }}>Open the move →</button>
            </Grounded>
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.GeographyView = GeographyView;
