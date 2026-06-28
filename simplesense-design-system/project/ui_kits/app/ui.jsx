/* global React, window */
/* ============================================================
   SimpleSense — shared view layout primitives.
   Keeps every operator-app screen consistent: editorial header,
   labeled section, panel, segmented toggle. Exposed on window.SSUI.
   ============================================================ */

/* Editorial page header — eyebrow + serif title + sub, optional action. */
function ViewHeader({ eyebrow, title, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
      <div>
        {eyebrow && <div className="ss-eyebrow" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 38, letterSpacing: "-0.015em", lineHeight: 1.05, margin: "6px 0 6px" }}>{title}</h1>
        {sub && <p style={{ margin: 0, color: "var(--text-body)", fontSize: 15, maxWidth: "64ch" }}>{sub}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

/* Section label above a block of content. */
function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 12px" }}>
      <h2 style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "var(--text-strong)", margin: 0 }}>{children}</h2>
      {right && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{right}</div>}
    </div>
  );
}

/* A titled panel built on the Card surface (no dependency on Card to stay flexible). */
function Panel({ title, sub, right, padding = 22, children, style }) {
  return (
    <div style={{
      background: "var(--surface-card)", border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xs)", padding, ...style,
    }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            {title && <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 15.5, color: "var(--text-strong)" }}>{title}</div>}
            {sub && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/* Segmented control (pill). options: [{id,label}] */
function SegToggle({ options = [], value, onChange, size = "md" }) {
  const pad = size === "sm" ? "5px 12px" : "7px 15px";
  const fs = size === "sm" ? 12.5 : 13.5;
  return (
    <div style={{ display: "inline-flex", background: "var(--surface-soft)", padding: 3, borderRadius: "var(--radius-pill)", gap: 2 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            border: "none", cursor: "pointer", padding: pad, borderRadius: "var(--radius-pill)",
            fontFamily: "var(--font-sans)", fontSize: fs, fontWeight: on ? 600 : 500,
            background: on ? "var(--surface-card)" : "transparent",
            color: on ? "var(--text-strong)" : "var(--text-muted)",
            boxShadow: on ? "var(--shadow-xs)" : "none", transition: "all var(--dur-fast)",
            display: "inline-flex", alignItems: "center", gap: 7,
          }}>
            {o.icon && <i className={`bi bi-${o.icon}`} style={{ fontSize: fs + 1 }} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Inline stat — label over a serif value, optional delta. */
function Stat({ label, value, delta, deltaTone = "success", sub }) {
  const tones = { success: "var(--ss-success)", warning: "var(--ss-warning)", danger: "var(--ss-danger)", clay: "var(--ss-clay-500)", primary: "var(--ss-blue-600)", neutral: "var(--text-muted)" };
  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", color: "var(--text-strong)", lineHeight: 1 }}>{value}</span>
        {delta && <span style={{ fontSize: 12.5, fontWeight: 600, color: tones[deltaTone] }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* Evidence / grounding note line — the brand's "show your working". */
function Grounded({ children, icon = "shield-check" }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
      <i className={`bi bi-${icon}`} style={{ color: "var(--ss-blue-500)", marginTop: 2, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

window.SSUI = { ViewHeader, SectionLabel, Panel, SegToggle, Stat, Grounded };
