/* global React, window */
const { MoveCard, Badge, Button } = window.SimpleSenseDesignSystem_33cb4c;

// Only the props MoveCard reads — avoids spreading data fields onto the DOM.
const moveProps = (m) => ({ rank: m.rank, category: m.category, pattern: m.pattern, why: m.why, moves: m.moves, impact: m.impact, confidence: m.confidence });

/* Richer KPI tile with sparkline (extends the MetricCard idea). */
function KpiTile({ k }) {
  const { Sparkline } = window.SSCharts;
  const tones = { success: "var(--ss-success)", warning: "var(--ss-warning)", danger: "var(--ss-danger)", clay: "var(--ss-clay-500)", primary: "var(--ss-blue-600)" };
  const colorByTone = { success: "var(--ss-chart-2)", warning: "var(--ss-chart-3)", clay: "var(--ss-chart-4)", primary: "var(--ss-chart-1)" };
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-xs)", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{k.label}</span>
        <i className={`bi bi-${k.icon}`} style={{ fontSize: 14, color: "var(--text-muted)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--text-strong)" }}>{k.value}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: tones[k.deltaTone] || "var(--ss-success)", marginTop: 5 }}>{k.delta}</div>
        </div>
        <Sparkline data={k.spark} color={colorByTone[k.deltaTone] || "var(--ss-chart-1)"} width={84} height={32} />
      </div>
    </div>
  );
}

/* Compact one-line move row used in Focus queue / Briefing. */
function MoveRow({ m, applied, onApply, onOpen }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)", background: "var(--surface-card)" }}>
      <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, flexShrink: 0, borderRadius: "var(--radius-sm)", background: applied ? "var(--ss-success-bg)" : "var(--ss-blue-50)", color: applied ? "var(--ss-success)" : "var(--ss-blue-600)", fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 14 }}>
        {applied ? <i className="bi bi-check2" style={{ fontSize: 16 }} /> : m.rank}
      </span>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onOpen(m.id)}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{m.category}</div>
        <div style={{ fontSize: 14.5, color: "var(--text-strong)", fontWeight: 500, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.pattern}</div>
      </div>
      <Badge tone="clay">{m.impact}</Badge>
      {applied ? <Badge tone="success" dot>Applied</Badge> : <Button size="sm" variant="secondary" onClick={() => onApply(m.id)}>Apply</Button>}
    </div>
  );
}

function DashboardView({ onOpenMove, applied = {}, onApply, onUndo }) {
  const { ViewHeader, Panel, SegToggle, SectionLabel, Grounded } = window.SSUI;
  const { moves, kpis } = window.SS_DATA;
  const [layout, setLayout] = React.useState(() => localStorage.getItem("ss_dash_layout") || "digest");
  const setL = (id) => { setLayout(id); localStorage.setItem("ss_dash_layout", id); };
  const apply = (id) => onApply(id);
  const undo = (id) => onUndo(id);
  const remaining = moves.filter((m) => !applied[m.id]).length;
  const hero = moves[0], rest = moves.slice(1);

  return (
    <div>
      <ViewHeader eyebrow="Monday digest · June 22" title="This week's moves"
        sub={`Ranked by expected impact. ${remaining} of ${moves.length} still to action.`}>
        <SegToggle value={layout} onChange={setL} options={[
          { id: "digest", label: "Digest", icon: "list-ul" },
          { id: "focus", label: "Focus", icon: "bullseye" },
          { id: "briefing", label: "Briefing", icon: "file-text" },
        ]} />
        <Button variant="secondary" icon="download">Export to Klaviyo</Button>
      </ViewHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
        {kpis.map((k) => <KpiTile key={k.label} k={k} />)}
      </div>

      {/* ---- DIGEST: full ranked MoveCards ---- */}
      {layout === "digest" && (
        <div style={{ display: "grid", gap: 18 }}>
          {moves.map((m) => applied[m.id] ? (
            <AppliedRow key={m.rank} m={m} onUndo={() => undo(m.id)} />
          ) : (
            <div key={m.rank} onClick={(e) => { if (!e.target.closest("button")) onOpenMove(m.id); }} style={{ cursor: "pointer" }}>
              <MoveCard {...moveProps(m)} ctaLabel="Apply this move" onApply={() => apply(m.id)} />
            </div>
          ))}
        </div>
      )}

      {/* ---- FOCUS: single hero move + compact queue ---- */}
      {layout === "focus" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
          <div>
            <SectionLabel>Do this first</SectionLabel>
            {applied[hero.id]
              ? <AppliedRow m={hero} onUndo={() => undo(hero.id)} big />
              : <div onClick={(e) => { if (!e.target.closest("button")) onOpenMove(hero.id); }} style={{ cursor: "pointer" }}>
                  <MoveCard {...moveProps(hero)} ctaLabel="Apply this move" onApply={() => apply(hero.id)} />
                </div>}
          </div>
          <div>
            <SectionLabel right={`${rest.filter((m) => !applied[m.id]).length} queued`}>Then</SectionLabel>
            <div style={{ display: "grid", gap: 12 }}>
              {rest.map((m) => <MoveRow key={m.rank} m={m} applied={applied[m.id]} onApply={apply} onOpen={onOpenMove} />)}
            </div>
            <div style={{ marginTop: 18 }}>
              <Panel padding={18}>
                <Grounded>Every move is grounded in your own numbers. Next digest lands Monday, 6:00 AM.</Grounded>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* ---- BRIEFING: narrative summary + queue ---- */}
      {layout === "briefing" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
          <Panel style={{ position: "sticky", top: 88 }}>
            <div className="ss-eyebrow" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>The week in one read</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 21, lineHeight: 1.3, letterSpacing: "-0.01em", color: "var(--text-strong)", margin: "0 0 14px" }}>
              Your demand is local, your best customers are under-served, and four heroes are about to run dry.
            </p>
            <div style={{ display: "grid", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Lift on the table</span><span style={{ fontWeight: 700, color: "var(--ss-clay-600)", fontFamily: "var(--font-ui-display)" }}>$72k / mo</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Moves to action</span><span style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-ui-display)" }}>{remaining} of {moves.length}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Avg confidence</span><span style={{ fontWeight: 700, color: "var(--ss-success)", fontFamily: "var(--font-ui-display)" }}>92%</span></div>
            </div>
          </Panel>
          <div style={{ display: "grid", gap: 12 }}>
            {moves.map((m) => <MoveRow key={m.rank} m={m} applied={applied[m.id]} onApply={apply} onOpen={onOpenMove} />)}
            <Grounded icon="shield-check">Grounded in 3.2 years of Shopify, GA4, Meta &amp; Klaviyo history.</Grounded>
          </div>
        </div>
      )}
    </div>
  );
}

function AppliedRow({ m, onUndo, big }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: big ? "22px 24px" : "18px 22px", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)", opacity: 0.9 }}>
      <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--ss-success-bg)", color: "var(--ss-success)" }}>
        <i className="bi bi-check2" style={{ fontSize: 18 }} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>{m.category}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-strong)", marginTop: 2 }}>{m.pattern}</div>
      </div>
      <Badge tone="success" dot>Applied</Badge>
      <button onClick={onUndo} style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>Undo</button>
    </div>
  );
}

window.DashboardView = DashboardView;
