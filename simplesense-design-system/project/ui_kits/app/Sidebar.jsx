/* global React */
const { Avatar } = window.SimpleSenseDesignSystem_33cb4c;

const NAV = [
  { group: "Operate", items: [
    { id: "dashboard", label: "This week's moves", icon: "compass", badge: "3" },
    { id: "audit", label: "Store audit", icon: "clipboard-data" },
    { id: "monitor", label: "Monitoring", icon: "activity" },
  ]},
  { group: "Understand", items: [
    { id: "customers", label: "Customers", icon: "people" },
    { id: "geo", label: "Geography", icon: "geo-alt" },
    { id: "products", label: "Products", icon: "box-seam" },
  ]},
  { group: "Account", items: [
    { id: "connections", label: "Connections", icon: "plug" },
    { id: "billing", label: "Plans & billing", icon: "credit-card" },
    { id: "settings", label: "Settings", icon: "gear" },
  ]},
];

function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      position: "fixed", inset: "0 auto 0 0", width: "var(--sidebar-width)",
      background: "var(--surface-card)", borderRight: "1px solid var(--border-hairline)",
      display: "flex", flexDirection: "column", zIndex: 30,
    }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "var(--radius-sm)",
          background: "var(--ss-blue-500)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 20, boxShadow: "var(--shadow-inset-glint)",
        }}>S</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>SimpleSense</span>
      </div>

      <nav style={{ padding: 12, overflowY: "auto", flex: 1 }}>
        {NAV.map((sec) => (
          <div key={sec.group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 10px 8px" }}>{sec.group}</div>
            {sec.items.map((it) => {
              const on = active === it.id;
              return (
                <button key={it.id} onClick={() => onSelect(it.id)} style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                  padding: "9px 10px", margin: "2px 0", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                  background: on ? "var(--ss-blue-50)" : "transparent",
                  color: on ? "var(--ss-blue-700)" : "var(--ss-ink-soft)",
                  fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 600 : 500,
                  transition: "background var(--dur-fast)",
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface-soft)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
                >
                  <i className={`bi bi-${it.icon}`} style={{ fontSize: 16, color: on ? "var(--ss-blue-500)" : "var(--text-muted)" }} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--ss-clay-500)", borderRadius: "var(--radius-pill)", padding: "1px 7px" }}>{it.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 14, borderTop: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name="Maple Oak" size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Maple &amp; Oak Goods</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Pro · Shopify</div>
        </div>
        <i className="bi bi-chevron-expand" style={{ color: "var(--text-muted)" }} />
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
