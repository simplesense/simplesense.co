/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

const alertTone = {
  danger: { bg: "var(--ss-danger-bg)", fg: "var(--ss-danger)" },
  warning: { bg: "var(--ss-warning-bg)", fg: "var(--ss-warning)" },
  success: { bg: "var(--ss-success-bg)", fg: "var(--ss-success)" },
  neutral: { bg: "var(--surface-soft)", fg: "var(--ss-ink-soft)" },
};

function MonitoringView({ onOpenMove }) {
  const { TrendLine, Ring } = window.SSCharts;
  const { ViewHeader, Panel, Stat, Grounded } = window.SSUI;
  const { monitoring } = window.SS_DATA;
  const [live, setLive] = React.useState(monitoring.pulse);
  // gently animate the "live" pulse numbers
  React.useEffect(() => {
    const t = setInterval(() => setLive((p) => ({
      orders: p.orders + (Math.random() < 0.4 ? 1 : 0),
      revenue: p.revenue + Math.round(Math.random() * 120),
      sessions: p.sessions + Math.round(Math.random() * 8),
      conv: p.conv,
    })), 2600);
    return () => clearInterval(t);
  }, []);
  const labels = ["12a", "4a", "8a", "12p", "4p", "8p", "now"];
  const sampled = [0, 4, 8, 12, 16, 20, 23].map((h) => monitoring.sessions24h[h]);

  return (
    <div>
      <ViewHeader eyebrow="Operate · Monitoring" title="Store health, live"
        sub="The pulse of the store right now, with anything worth your attention pushed to the top.">
        <Badge tone="success" dot>Live · all sources synced</Badge>
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start", marginBottom: 18 }}>
        <Panel style={{ textAlign: "center" }}>
          <Ring score={monitoring.health} size={120} stroke={10} label="HEALTH" />
          <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 16, marginTop: 12, color: "var(--text-strong)" }}>Strong &amp; steady</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>No critical issues. One inventory alert needs a decision today.</p>
        </Panel>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <Panel padding={16}><Stat label="Orders today" value={live.orders} delta="live" deltaTone="success" /></Panel>
            <Panel padding={16}><Stat label="Revenue today" value={"$" + live.revenue.toLocaleString()} delta="live" deltaTone="success" /></Panel>
            <Panel padding={16}><Stat label="Sessions" value={live.sessions.toLocaleString()} delta="live" deltaTone="primary" /></Panel>
            <Panel padding={16}><Stat label="Conversion" value={live.conv + "%"} delta="+0.1pt" deltaTone="success" /></Panel>
          </div>
          <Panel title="Sessions · last 24 hours" sub="Hourly, across all traffic sources.">
            <TrendLine series={[sampled]} labels={labels} height={180} colors={["var(--ss-chart-1)"]} />
          </Panel>
        </div>
      </div>

      <Panel title="Alert feed" sub="Ranked by urgency. SimpleSense only surfaces what crosses a threshold." right={<Button size="sm" variant="ghost" icon="sliders">Thresholds</Button>}>
        <div style={{ display: "grid", gap: 2 }}>
          {monitoring.alerts.map((a, i) => {
            const t = alertTone[a.tone];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 6px", borderTop: i ? "1px solid var(--border-hairline)" : "none" }}>
                <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, flexShrink: 0, borderRadius: "var(--radius-sm)", background: t.bg, color: t.fg }}><i className={`bi bi-${a.icon}`} style={{ fontSize: 17 }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{a.source} · {a.time}</div>
                </div>
                {a.tone === "danger" && <Button size="sm" variant="secondary" onClick={() => onOpenMove("inventory")}>Act</Button>}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

window.MonitoringView = MonitoringView;
