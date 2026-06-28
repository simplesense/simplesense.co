/* global React, window */
const SOURCES = [
  { id: "ga4", name: "Google Analytics 4", desc: "Sessions, funnels, attribution", icon: "graph-up", color: "#cd8420" },
  { id: "meta", name: "Meta Ads", desc: "Spend, CAC, campaigns", icon: "bullseye", color: "#0871e7" },
  { id: "klaviyo", name: "Klaviyo", desc: "Email & SMS, segments", icon: "envelope-paper", color: "#c25a3c" },
];

const READ_STAGES = [
  "Reading 18,402 orders…",
  "Mapping 6,204 customers…",
  "Aligning GA4 sessions & spend…",
  "Scoring product velocity…",
  "Finding the patterns that matter…",
];

function Stepper({ step }) {
  const steps = ["Connect Shopify", "Add sources", "Read history", "Your audit"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{
              display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-ui-display)",
              background: i < step ? "var(--ss-success)" : i === step ? "var(--ss-blue-500)" : "var(--surface-soft)",
              color: i <= step ? "#fff" : "var(--text-muted)",
              boxShadow: i === step ? "var(--shadow-inset-glint)" : "none",
            }}>{i < step ? <i className="bi bi-check2" /> : i + 1}</span>
            <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 500, color: i <= step ? "var(--text-strong)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1.5, margin: "0 12px", background: i < step ? "var(--ss-success)" : "var(--border-strong)", minWidth: 18 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Onboarding() {
  const { Button, Badge } = window.SimpleSenseDesignSystem_33cb4c;
  const [step, setStep] = React.useState(0);
  const [shopifyState, setShopifyState] = React.useState("idle"); // idle | connecting | done
  const [sources, setSources] = React.useState({});
  const [readPct, setReadPct] = React.useState(0);
  const [readStage, setReadStage] = React.useState(0);

  const connectShopify = () => {
    setShopifyState("connecting");
    setTimeout(() => { setShopifyState("done"); setTimeout(() => setStep(1), 700); }, 2200);
  };
  const connectSource = (id) => {
    setSources((s) => ({ ...s, [id]: "connecting" }));
    setTimeout(() => setSources((s) => ({ ...s, [id]: "done" })), 1600);
  };

  // history-reading animation
  React.useEffect(() => {
    if (step !== 2) return;
    setReadPct(0); setReadStage(0);
    const t = setInterval(() => {
      setReadPct((p) => {
        const next = Math.min(100, p + 2);
        setReadStage(Math.min(READ_STAGES.length - 1, Math.floor((next / 100) * READ_STAGES.length)));
        if (next >= 100) { clearInterval(t); setTimeout(() => setStep(3), 600); }
        return next;
      });
    }, 70);
    return () => clearInterval(t);
  }, [step]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 0", position: "relative", overflow: "hidden" }}>
      {/* brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
        <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--ss-blue-500)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 21, boxShadow: "var(--shadow-inset-glint)" }}>S</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 23, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>SimpleSense</span>
      </div>

      <div style={{ width: "100%", maxWidth: 560, zIndex: 2 }}>
        <Stepper step={step} />

        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-md)", padding: "38px 38px 34px" }}>

          {/* STEP 0 — Connect Shopify */}
          {step === 0 && (
            <div>
              <Badge tone="clay">Step 1 · the only required one</Badge>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1.08, margin: "16px 0 10px" }}>
                Let's read your store.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--text-body)", margin: "0 0 28px" }}>
                Connect Shopify and SimpleSense reads your full order history — then tells you the three highest-ROI moves to make this week. No setup, no dashboards to build.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-hairline)", background: "var(--surface-inset)", marginBottom: 24 }}>
                <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "var(--radius-md)", background: "color-mix(in srgb, #1f8a5b 12%, #fff)", color: "#1f8a5b", fontSize: 24 }}><i className="bi bi-bag-check" /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Shopify</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Orders, products, customers, inventory</div>
                </div>
                {shopifyState === "done" && <Badge tone="success" dot>Connected</Badge>}
              </div>

              {shopifyState === "connecting" ? (
                <Button variant="primary" size="lg" style={{ width: "100%" }} disabled>
                  <i className="bi bi-arrow-repeat" style={{ marginRight: 8, animation: "ssSpin 0.9s linear infinite" }} /> Authorizing with Shopify…
                </Button>
              ) : (
                <Button variant="primary" size="lg" icon="bag-check" style={{ width: "100%" }} onClick={connectShopify}>Connect Shopify</Button>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, fontSize: 12.5, color: "var(--text-muted)" }}>
                <i className="bi bi-shield-lock" style={{ color: "var(--ss-blue-500)" }} /> Read-only. We never write to your store without you applying a move.
              </div>
            </div>
          )}

          {/* STEP 1 — Add more sources */}
          {step === 1 && (
            <div>
              <Badge tone="primary">Step 2 · optional, but sharper</Badge>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1.13, margin: "16px 0 24px" }}>
                The more it sees, the sharper the moves.
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)", margin: "0 0 24px" }}>
                Add the rest of your stack so SimpleSense can connect spend to revenue. You can always do this later.
              </p>
              <div style={{ display: "grid", gap: 12, marginBottom: 26 }}>
                {SOURCES.map((s) => {
                  const st = sources[s.id];
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-hairline)", background: "var(--surface-card)" }}>
                      <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${s.color} 12%, #fff)`, color: s.color, fontSize: 20 }}><i className={`bi bi-${s.icon}`} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-ui-display)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{s.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{s.desc}</div>
                      </div>
                      {st === "done" ? <Badge tone="success" dot>Connected</Badge>
                        : st === "connecting" ? <span style={{ fontSize: 13, color: "var(--ss-warning)", fontWeight: 600 }}><i className="bi bi-arrow-repeat" style={{ marginRight: 6, animation: "ssSpin 0.9s linear infinite" }} />Connecting</span>
                        : <Button size="sm" variant="secondary" onClick={() => connectSource(s.id)}>Connect</Button>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Button variant="primary" size="lg" iconRight="arrow-right" style={{ flex: 1 }} onClick={() => setStep(2)}>Read my history</Button>
                <Button variant="ghost" size="lg" onClick={() => setStep(2)}>Skip</Button>
              </div>
            </div>
          )}

          {/* STEP 2 — Reading history */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 24px" }}>
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="var(--surface-soft)" strokeWidth="6" />
                  <circle cx="48" cy="48" r="42" fill="none" stroke="var(--ss-blue-500)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - readPct / 100)} transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                  <text x="48" y="54" textAnchor="middle" fontFamily="var(--font-display)" fontSize="26" fill="var(--text-strong)">{readPct}</text>
                </svg>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Reading 3.2 years of history</h1>
              <p style={{ fontSize: 15, color: "var(--text-body)", margin: "0 0 4px", minHeight: 24, transition: "opacity 0.2s" }}>{READ_STAGES[readStage]}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 0" }}>This usually takes under a minute. Hang tight.</p>
            </div>
          )}

          {/* STEP 3 — Audit ready */}
          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "grid", placeItems: "center", width: 60, height: 60, margin: "0 auto 18px", borderRadius: "50%", background: "var(--ss-success-bg)", color: "var(--ss-success)", fontSize: 30 }}><i className="bi bi-check2" /></span>
              <Badge tone="success">Audit complete</Badge>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1.14, margin: "14px auto 14px", maxWidth: "15ch" }}>
                We found 3 moves worth <em style={{ fontStyle: "italic", color: "var(--ss-clay-500)" }}>$72k a month.</em>
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)", margin: "0 0 26px", maxWidth: "44ch", marginInline: "auto" }}>
                Your demand is local, your best customers are under-served, and four heroes are about to run dry. Here's your first week.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
                {[{ n: "82%", l: "local customers" }, { n: "71%", l: "rev from top 20%" }, { n: "11d", l: "to stockout" }].map((s) => (
                  <div key={s.l} style={{ padding: "14px 8px", borderRadius: "var(--radius-md)", background: "var(--surface-inset)", border: "1px solid var(--border-hairline)" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--text-strong)" }}>{s.n}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <a href="index.html" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg" iconRight="arrow-right" style={{ width: "100%" }}>Enter SimpleSense</Button>
              </a>
            </div>
          )}
        </div>

        {step === 0 && (
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--text-muted)" }}>
            Already connected? <a href="index.html" style={{ color: "var(--text-link)", textDecoration: "none", fontWeight: 600 }}>Go to your moves →</a>
          </div>
        )}
      </div>

      {/* blossom footer accent */}
      <div style={{ marginTop: "auto", width: "100%", height: 120, backgroundImage: "url(../../assets/img/footer-blossom.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.5, maskImage: "linear-gradient(to bottom, transparent, #000)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000)" }} />
      <style>{`@keyframes ssSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function mountOnboarding() {
  const ns = window.SimpleSenseDesignSystem_33cb4c;
  if (!ns || !ns.Button || !ns.Badge) { setTimeout(mountOnboarding, 30); return; }
  const obRoot = document.getElementById("root");
  if (!window.__obRoot) window.__obRoot = ReactDOM.createRoot(obRoot);
  window.__obRoot.render(<Onboarding />);
  let tries = 0;
  (function verify() {
    if (obRoot.children.length > 0 || tries++ > 60) return;
    window.__obRoot.render(<Onboarding />);
    setTimeout(verify, 50);
  })();
}
mountOnboarding();
