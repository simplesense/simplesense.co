/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

const riskMeta = {
  danger: { tone: "danger", label: "Reorder now" },
  watch: { tone: "warning", label: "Watch" },
  ok: { tone: "success", label: "Healthy" },
};

function ProductsView({ onOpenMove }) {
  const { ViewHeader, Panel, Stat, Grounded, SegToggle } = window.SSUI;
  const { products } = window.SS_DATA;
  const [filter, setFilter] = React.useState("all");
  const [reordered, setReordered] = React.useState({});
  const rows = products.filter((p) => filter === "all" ? true : filter === "risk" ? p.risk === "danger" : p.risk === "ok" || p.risk === "watch");
  const atRisk = products.filter((p) => p.risk === "danger");

  return (
    <div>
      <ViewHeader eyebrow="Understand · Products" title="SKU economics"
        sub="Margin, velocity and inventory risk for every product — so a peak-week stockout never surprises you.">
        <Button variant="secondary" icon="download">Export CSV</Button>
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <Panel padding={16}><Stat label="Active SKUs" value="184" sub="across 12 collections" /></Panel>
        <Panel padding={16}><Stat label="Avg margin" value="61%" delta="+2pt" deltaTone="success" /></Panel>
        <Panel padding={16}><Stat label="At-risk SKUs" value={atRisk.length} delta="~11 days cover" deltaTone="danger" /></Panel>
        <Panel padding={16}><Stat label="Revenue at risk" value="$18k" delta="hero SKUs" deltaTone="clay" /></Panel>
      </div>

      {atRisk.length > 0 && (
        <Panel padding={18} style={{ marginBottom: 18, background: "var(--ss-danger-bg)", border: "1px solid color-mix(in srgb, var(--ss-danger) 30%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 22, color: "var(--ss-danger)" }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>4 hero SKUs stock out in ~11 days</div>
              <div style={{ fontSize: 13.5, color: "var(--text-body)" }}>They carry 28% of revenue. Lead time is 18 days — reorder today.</div>
            </div>
            <Button variant="primary" icon="lightning-charge" onClick={() => onOpenMove("inventory")}>Open inventory move</Button>
          </div>
        </Panel>
      )}

      <Panel title="All products" right={<SegToggle size="sm" value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, { id: "risk", label: "At risk" }, { id: "healthy", label: "Healthy" }]} />} padding={0} style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <th style={{ padding: "12px 22px", fontWeight: 600 }}>Product</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Price</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Margin</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Units / day</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Days of cover</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Rev share</th>
                <th style={{ padding: "12px 22px", fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const rm = riskMeta[p.risk];
                const coverPct = Math.min(100, (p.cover / 40) * 100);
                const coverCol = p.cover <= 14 ? "var(--ss-danger)" : p.cover <= 30 ? "var(--ss-warning)" : "var(--ss-success)";
                return (
                  <tr key={p.sku} style={{ borderTop: "1px solid var(--border-hairline)" }}>
                    <td style={{ padding: "13px 22px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-strong)" }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p.sku}</div>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: "var(--font-ui-display)", fontWeight: 600 }}>${p.price}</td>
                    <td style={{ padding: "13px 14px", textAlign: "right", color: p.margin >= 60 ? "var(--ss-success)" : "var(--text-body)", fontWeight: 600 }}>{p.margin}%</td>
                    <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: "var(--font-ui-display)", fontWeight: 600 }}>{p.velocity}</td>
                    <td style={{ padding: "13px 14px", minWidth: 130 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface-soft)", overflow: "hidden" }}>
                          <div style={{ width: `${coverPct}%`, height: "100%", background: coverCol, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: coverCol, minWidth: 30 }}>{p.cover}d</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "right", color: "var(--text-muted)" }}>{p.revShare}%</td>
                    <td style={{ padding: "13px 22px", textAlign: "right" }}>
                      {p.risk === "danger"
                        ? (reordered[p.sku]
                            ? <Badge tone="success" dot>Reordered</Badge>
                            : <Button size="sm" variant="secondary" onClick={() => setReordered((r) => ({ ...r, [p.sku]: true }))}>Reorder</Button>)
                        : <Badge tone={rm.tone}>{rm.label}</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

window.ProductsView = ProductsView;
