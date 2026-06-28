/* global React */
const { Card, Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

const CATS = [
  { label: "Acquisition efficiency", score: 72, tone: "warning", note: "CAC up 14% QoQ on Meta" },
  { label: "Retention & repeat", score: 84, tone: "success", note: "Repeat rate climbing" },
  { label: "Conversion path", score: 61, tone: "danger", note: "Checkout drop-off on mobile" },
  { label: "Inventory health", score: 68, tone: "warning", note: "4 hero SKUs at risk" },
  { label: "Profit visibility", score: 90, tone: "success", note: "Landed cost + ad spend mapped" },
];

function Ring({ score }) {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const col = score >= 80 ? "var(--ss-success)" : score >= 67 ? "var(--ss-warning)" : "var(--ss-danger)";
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      <circle cx="46" cy="46" r={r} fill="none" stroke="var(--surface-soft)" strokeWidth="8" />
      <circle cx="46" cy="46" r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 46 46)" />
      <text x="46" y="50" textAnchor="middle" fontFamily="var(--font-display)" fontSize="26" fill="var(--text-strong)">{score}</text>
    </svg>
  );
}

function AuditView({ onNavigate }) {
  const overall = 71;
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div className="ss-eyebrow" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>Free audit · complete</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 38, letterSpacing: "-0.015em", lineHeight: 1.05, margin: "6px 0" }}>Store audit</h1>
        <p style={{ margin: 0, color: "var(--text-body)", fontSize: 15 }}>3.2 years of history read across Shopify, GA4, Meta and Klaviyo.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>
        <Card padding={26} style={{ textAlign: "center" }}>
          <Ring score={overall} />
          <h2 style={{ fontSize: 18, margin: "14px 0 4px" }}>Operator score</h2>
          <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.5 }}>
            Solid foundation with three high-value gaps. Fixing conversion and inventory unlocks most of the upside.
          </p>
          <Button variant="primary" iconRight="arrow-right" style={{ width: "100%" }} onClick={() => onNavigate && onNavigate("dashboard")}>See this week's moves</Button>
        </Card>

        <Card padding={8}>
          {CATS.map((cat, i) => (
            <div key={cat.label} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "16px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
            }}>
              <div style={{ width: 44, fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text-strong)" }}>{cat.score}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{cat.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{cat.note}</div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--surface-soft)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${cat.score}%`, height: "100%", borderRadius: 3, background: cat.tone === "success" ? "var(--ss-success)" : cat.tone === "warning" ? "var(--ss-warning)" : "var(--ss-danger)" }} />
                </div>
              </div>
              <Badge tone={cat.tone}>{cat.tone === "success" ? "Strong" : cat.tone === "warning" ? "Improve" : "Fix"}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

window.AuditView = AuditView;
