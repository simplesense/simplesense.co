/* global React, ReactDOM, window */
const { Button } = window.SimpleSenseDesignSystem_33cb4c;

// View components are registered on window by sibling babel scripts. Read them
// at render time (not module-eval time) so load order can't capture undefined.

function Topbar({ onConnect }) {
  return (
    <header style={{
      height: "var(--topbar-height)", position: "sticky", top: 0, zIndex: 20,
      background: "color-mix(in srgb, var(--surface-card) 90%, transparent)", backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 14, padding: "0 22px",
    }}>
      <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
        <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }} />
        <input placeholder="Ask about your store…" style={{
          width: "100%", height: 38, padding: "0 12px 0 34px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-strong)", background: "var(--surface-page)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)",
        }} />
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--ss-success)", fontWeight: 600 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ss-success)" }} /> All sources synced
      </span>
      <button className="ss-icon-btn" aria-label="Notifications"><i className="bi bi-bell" /></button>
      <Button variant="primary" size="sm" icon="plug" onClick={onConnect}>Connect a source</Button>
    </header>
  );
}

function App() {
  const {
    Sidebar, AuditView, DashboardView, MonitoringView, CustomersView,
    GeographyView, ProductsView, ConnectionsView, SettingsView, BillingView, MoveDetailView,
  } = window;
  const [view, setView] = React.useState("dashboard");
  const [moveId, setMoveId] = React.useState(null);   // when set → detail page
  const [applied, setApplied] = React.useState({});   // shared apply state (by move id)
  const mainRef = React.useRef(null);

  const go = (v) => { setMoveId(null); setView(v); if (mainRef.current) mainRef.current.scrollTop = 0; };
  const openMove = (id) => { setMoveId(id); window.scrollTo(0, 0); };
  const applyMove = (id) => setApplied((a) => ({ ...a, [id]: true }));

  let content;
  if (moveId) {
    content = <MoveDetailView moveId={moveId} applied={!!applied[moveId]} onApply={() => applyMove(moveId)} onBack={() => setMoveId(null)} />;
  } else {
    switch (view) {
      case "dashboard": content = <DashboardView applied={applied} onApply={applyMove} onUndo={(id) => setApplied((a) => ({ ...a, [id]: false }))} onOpenMove={openMove} />; break;
      case "audit": content = <AuditView onNavigate={go} />; break;
      case "monitor": content = <MonitoringView onOpenMove={openMove} />; break;
      case "customers": content = <CustomersView onOpenMove={openMove} />; break;
      case "geo": content = <GeographyView onOpenMove={openMove} />; break;
      case "products": content = <ProductsView onOpenMove={openMove} />; break;
      case "connections": content = <ConnectionsView />; break;
      case "settings": content = <SettingsView />; break;
      case "billing": content = <BillingView />; break;
      default: content = <DashboardView applied={applied} onApply={applyMove} onUndo={(id) => setApplied((a) => ({ ...a, [id]: false }))} onOpenMove={openMove} />;
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Sidebar active={moveId ? "dashboard" : view} onSelect={go} />
      <div style={{ marginLeft: "var(--sidebar-width)", minHeight: "100vh" }}>
        <Topbar onConnect={() => go("connections")} />
        <main ref={mainRef} style={{ padding: "26px 28px", maxWidth: "var(--container-max)", margin: "0 auto" }}>
          {content}
        </main>
      </div>
    </div>
  );
}

// Mount only once every dependency has registered. Babel executes the
// type="text/babel" src scripts in fetch-completion order (NOT DOM order),
// so we poll until every view component, the data/chart/ui globals, AND the
// design-system bundle are present before the first (and only) render. App
// provably renders clean once these exist, so no retry/boundary is needed.
const REQUIRED = [
  "Sidebar", "AuditView", "DashboardView", "MonitoringView", "CustomersView",
  "GeographyView", "ProductsView", "ConnectionsView", "SettingsView", "BillingView",
  "MoveDetailView", "SS_DATA", "SSCharts", "SSUI",
];
function ssReady() {
  const ns = window.SimpleSenseDesignSystem_33cb4c;
  if (!ns || !ns.Button || !ns.MoveCard) return false;
  return REQUIRED.every((n) => window[n]);
}
function mountApp() {
  if (!ssReady()) { setTimeout(mountApp, 30); return; }
  const rootEl = document.getElementById("root");
  if (!window.__ssRoot) window.__ssRoot = ReactDOM.createRoot(rootEl);
  window.__ssRoot.render(<App />);
  // Self-heal: React 18's async commit can no-op the very first render during
  // babel's staggered script eval. If nothing committed, render again until it
  // sticks (App provably renders once deps are present, so this converges fast).
  let tries = 0;
  (function verify() {
    if (rootEl.children.length > 0 || tries++ > 60) return;
    window.__ssRoot.render(<App />);
    setTimeout(verify, 50);
  })();
}
mountApp();
