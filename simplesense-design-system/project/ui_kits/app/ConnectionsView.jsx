/* global React, window */
const { Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

function ConnectionCard({ c, state, onConnect }) {
  const status = state || c.status;
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
        <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${c.color} 12%, var(--surface-card))`, color: c.color, fontSize: 22, flexShrink: 0 }}>
          <i className={`bi bi-${c.icon}`} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{c.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{c.desc}</div>
        </div>
        {status === "connected" && <Badge tone="success" dot>Connected</Badge>}
        {status === "connecting" && <Badge tone="warning" dot>Connecting…</Badge>}
      </div>

      {status === "connected" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 13, borderTop: "1px solid var(--border-hairline)", fontSize: 12.5, color: "var(--text-muted)" }}>
          <span><i className="bi bi-clock-history" style={{ marginRight: 6 }} />Since {c.since}</span>
          <span style={{ fontWeight: 600, color: "var(--text-body)" }}>{c.records}</span>
        </div>
      )}
      {status === "connecting" && (
        <div style={{ paddingTop: 13, borderTop: "1px solid var(--border-hairline)" }}>
          <div style={{ height: 6, borderRadius: 3, background: "var(--surface-soft)", overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "var(--ss-warning)", borderRadius: 3, animation: "ssLoad 1.1s var(--ease-in-out) infinite alternate" }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Reading account history…</div>
        </div>
      )}
      {status === "available" && (
        <div style={{ paddingTop: 13, borderTop: "1px solid var(--border-hairline)" }}>
          <Button size="sm" variant="secondary" icon="plug" style={{ width: "100%" }} onClick={() => onConnect(c.id)}>Connect {c.name}</Button>
        </div>
      )}
    </div>
  );
}

function ConnectionsView() {
  const { ViewHeader, Panel, Grounded } = window.SSUI;
  const { connections } = window.SS_DATA;
  const [states, setStates] = React.useState({});
  const connect = (id) => {
    setStates((s) => ({ ...s, [id]: "connecting" }));
    setTimeout(() => setStates((s) => ({ ...s, [id]: "connected" })), 2200);
  };
  const connected = connections.filter((c) => (states[c.id] || c.status) === "connected");
  const available = connections.filter((c) => c.status === "available");

  return (
    <div>
      <ViewHeader eyebrow="Account · Connections" title="Your data sources"
        sub="SimpleSense reads — never writes without your say-so. The more it can see, the sharper the moves.">
        <Badge tone="success" dot>{connected.length} connected</Badge>
      </ViewHeader>

      <style>{`@keyframes ssLoad { from { transform: translateX(-30%) } to { transform: translateX(30%) } }`}</style>

      <div style={{ marginBottom: 8, fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Connected</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 26 }}>
        {connections.filter((c) => c.status === "connected" || states[c.id]).map((c) => (
          <ConnectionCard key={c.id} c={c} state={states[c.id]} onConnect={connect} />
        ))}
      </div>

      {available.some((c) => !states[c.id]) && (
        <>
          <div style={{ marginBottom: 8, fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Available to add</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 24 }}>
            {available.filter((c) => !states[c.id]).map((c) => <ConnectionCard key={c.id} c={c} onConnect={connect} />)}
          </div>
        </>
      )}

      <Panel padding={18} style={{ background: "var(--surface-inset)" }}>
        <Grounded icon="shield-lock">Read-only by default. SimpleSense pulls history to find moves; it only writes back (segments, Flows, audiences) when you apply a move.</Grounded>
      </Panel>
    </div>
  );
}

window.ConnectionsView = ConnectionsView;
