/* global React, window */
const { Badge, Button, Avatar, Input } = window.SimpleSenseDesignSystem_33cb4c;

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, flexShrink: 0,
      background: on ? "var(--ss-blue-500)" : "var(--border-strong)", transition: "background var(--dur-fast)",
    }}>
      <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-xs)", transform: on ? "translateX(18px)" : "translateX(0)", transition: "transform var(--dur-fast) var(--ease-out)" }} />
    </button>
  );
}

function Row({ title, desc, children, first }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderTop: first ? "none" : "1px solid var(--border-hairline)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsView() {
  const { ViewHeader, Panel, SegToggle } = window.SSUI;
  const { store, team } = window.SS_DATA;
  const [tab, setTab] = React.useState("account");
  const [prefs, setPrefs] = React.useState({ digest: true, alerts: true, weekly: true, sms: false, autoApply: false });
  const [day, setDay] = React.useState("monday");
  const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <ViewHeader eyebrow="Account · Settings" title="Settings"
        sub="Your store, your team, and how SimpleSense talks to you." />

      <div style={{ marginBottom: 20 }}>
        <SegToggle value={tab} onChange={setTab} options={[
          { id: "account", label: "Account", icon: "shop" },
          { id: "team", label: "Team", icon: "people" },
          { id: "digest", label: "Digest & alerts", icon: "bell" },
        ]} />
      </div>

      {tab === "account" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start", maxWidth: 900 }}>
          <Panel title="Store profile">
            <div style={{ display: "grid", gap: 14 }}>
              <Input label="Store name" defaultValue={store.name} />
              <Input label="Category" defaultValue={store.category} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 7 }}>Locations</div>
                {store.locations.map((l) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-body)", padding: "7px 0" }}>
                    <i className="bi bi-geo-alt" style={{ color: "var(--ss-clay-500)" }} />{l}
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" style={{ justifySelf: "start" }}>Save changes</Button>
            </div>
          </Panel>
          <Panel title="Plan">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text-strong)" }}>Pro</span>
              <Badge tone="primary">Current</Badge>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
              All sources, weekly moves, unlimited history, priority support. Renews Jul 22, 2026.
            </div>
            <Button variant="ghost" iconRight="arrow-right">Manage plan &amp; billing</Button>
          </Panel>
        </div>
      )}

      {tab === "team" && (
        <Panel title="Team members" sub="Owners and operators can apply moves; viewers see read-only." right={<Button size="sm" variant="secondary" icon="person-plus">Invite</Button>} style={{ maxWidth: 760 }}>
          <div style={{ display: "grid" }}>
            {team.map((m, i) => (
              <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderTop: i ? "1px solid var(--border-hairline)" : "none" }}>
                <Avatar name={m.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{m.name} {m.you && <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>· you</span>}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.email}</div>
                </div>
                <Badge tone={m.role === "Owner" ? "primary" : m.role === "Operator" ? "success" : "neutral"}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "digest" && (
        <div style={{ maxWidth: 720, display: "grid", gap: 18 }}>
          <Panel title="Weekly digest" sub="Your ranked moves, delivered.">
            <Row first title="Send the Monday digest" desc="The week's ranked moves by email."><Toggle on={prefs.digest} onChange={set("digest")} /></Row>
            <Row title="Delivery day">
              <SegToggle size="sm" value={day} onChange={setDay} options={[{ id: "monday", label: "Mon" }, { id: "wednesday", label: "Wed" }, { id: "friday", label: "Fri" }]} />
            </Row>
            <Row title="Weekly summary recap" desc="A Friday note on what moved after applied moves."><Toggle on={prefs.weekly} onChange={set("weekly")} /></Row>
          </Panel>
          <Panel title="Alerts" sub="Real-time, only when something crosses a threshold.">
            <Row first title="Critical alerts" desc="Stockouts, conversion drops, CAC spikes."><Toggle on={prefs.alerts} onChange={set("alerts")} /></Row>
            <Row title="SMS for critical only" desc="Text me when revenue is genuinely at risk."><Toggle on={prefs.sms} onChange={set("sms")} /></Row>
            <Row title="Auto-apply high-confidence moves" desc="Let SimpleSense ship moves above 95% confidence."><Toggle on={prefs.autoApply} onChange={set("autoApply")} /></Row>
          </Panel>
        </div>
      )}
    </div>
  );
}

window.SettingsView = SettingsView;
