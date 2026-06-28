/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

function EvidenceViz({ id }) {
  const { ParetoChart, GeoConcentration, BarRows } = window.SSCharts;
  const { customers, geo, products } = window.SS_DATA;
  if (id === "geo") return <GeoConcentration height={300} pct={geo.withinRadius} radiusMiles={geo.radiusMiles} />;
  if (id === "pareto") return <ParetoChart deciles={customers.paretoDeciles} height={260} />;
  // inventory → days of cover for the 4 at-risk SKUs
  const atRisk = products.filter((p) => p.risk === "danger").map((p) => ({ label: p.name, pct: Math.min(100, (p.cover / 30) * 100), value: p.cover + "d", tone: "danger" }));
  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>Days of inventory cover · reorder threshold 14d</div>
      <BarRows items={atRisk} />
    </div>
  );
}

function MoveDetailView({ moveId, onBack, applied, onApply }) {
  const { Ring } = window.SSCharts;
  const { Panel, SectionLabel, Grounded } = window.SSUI;
  const { moves } = window.SS_DATA;
  const m = moves.find((x) => x.id === moveId) || moves[0];
  const [checks, setChecks] = React.useState({});
  const toggle = (i) => setChecks((c) => ({ ...c, [i]: !c[i] }));
  const doneCount = m.moves.filter((_, i) => checks[i]).length;

  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13.5, fontWeight: 500, padding: 0, marginBottom: 18 }}>
        <i className="bi bi-arrow-left" /> Back to this week's moves
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--ss-blue-500)", color: "#fff", fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 20, boxShadow: "var(--shadow-inset-glint)" }}>{m.rank}</span>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>{m.category}</span>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", lineHeight: 1.08, margin: "0 0 22px", maxWidth: "20ch" }}>{m.pattern}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <Panel title="The evidence" sub="Straight from your own numbers — no assumptions added.">
            <EvidenceViz id={m.id} />
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-hairline)" }}>
              <Grounded icon="bar-chart-line">{m.evidence}</Grounded>
            </div>
          </Panel>

          <Panel title="Why this matters">
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text-body)" }}>{m.why}</p>
          </Panel>

          <Panel title="The move" sub={`${doneCount} of ${m.moves.length} steps done`}>
            <div style={{ display: "grid", gap: 2 }}>
              {m.moves.map((step, i) => (
                <button key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 8px", border: "none", borderTop: i ? "1px solid var(--border-hairline)" : "none", background: "transparent", textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, flexShrink: 0, borderRadius: "var(--radius-xs)", border: checks[i] ? "none" : "1.5px solid var(--border-strong)", background: checks[i] ? "var(--ss-success)" : "transparent", color: "#fff", transition: "all var(--dur-fast)" }}>
                    {checks[i] && <i className="bi bi-check2" style={{ fontSize: 15 }} />}
                  </span>
                  <span style={{ fontSize: 14.5, color: checks[i] ? "var(--text-muted)" : "var(--text-strong)", textDecoration: checks[i] ? "line-through" : "none" }}>{step}</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Impact rail */}
        <div style={{ display: "grid", gap: 18, position: "sticky", top: 88 }}>
          <Panel>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>Expected impact</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", color: "var(--ss-clay-600)", lineHeight: 1.05, margin: "4px 0 6px" }}>{m.impact}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>Ranged, not falsely precise. Modeled on your trailing-12-month figures.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid var(--border-hairline)" }}>
              <Ring score={m.confidencePct} size={64} stroke={6} color="var(--ss-success)" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>Confidence</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.confidence}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {applied
                ? <Button variant="secondary" icon="check2" style={{ width: "100%" }} disabled>Applied this move</Button>
                : <Button variant="primary" icon="lightning-charge" style={{ width: "100%" }} onClick={onApply}>Apply this move</Button>}
              <Button variant="ghost" icon="calendar-event" style={{ width: "100%" }}>Schedule for later</Button>
            </div>
          </Panel>

          <Panel title="How we'd ship it">
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { icon: "shopify", t: "Shopify Flow", d: "Automations created on apply" },
                { icon: "envelope-paper", t: "Klaviyo", d: "Segment pushed automatically" },
                { icon: "bullseye", t: "Meta & Google", d: "Audience + radius updated" },
              ].map((r) => (
                <div key={r.t} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--surface-soft)", color: "var(--ss-blue-600)" }}><i className={`bi bi-${r.icon}`} /></span>
                  <div><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{r.t}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.d}</div></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.MoveDetailView = MoveDetailView;
