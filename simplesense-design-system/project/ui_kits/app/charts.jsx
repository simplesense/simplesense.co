/* global React, window */
/* ============================================================
   SimpleSense — chart primitives (warm, calm data-viz).
   Pure SVG, no deps. Colors come from the data-viz tokens.
   Exposed on window.SSCharts.
   ============================================================ */

const C = {
  blue: "var(--ss-chart-1)", green: "var(--ss-chart-2)", amber: "var(--ss-chart-3)",
  clay: "var(--ss-chart-4)", plum: "var(--ss-chart-5)",
  grid: "var(--border-hairline)", soft: "var(--surface-soft)", ink: "var(--text-strong)", muted: "var(--text-muted)",
};

/* Small inline sparkline — area + line. */
function Sparkline({ data = [], color = C.blue, width = 120, height = 34, fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * width,
    height - 3 - ((d - min) / span) * (height - 6),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = "sp" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Larger line chart with baseline grid + optional second series. */
function TrendLine({ series = [], labels = [], height = 220, colors = [C.blue, C.clay], format = (v) => v }) {
  const W = 720, pad = { l: 38, r: 14, t: 14, b: 26 };
  const all = series.flat();
  const max = Math.max(...all) * 1.08, min = Math.min(0, ...all);
  const span = max - min || 1;
  const x = (i, n) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const ticks = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block" }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = min + (span * i) / ticks, yy = y(v);
        return (
          <g key={i}>
            <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke={C.grid} strokeWidth="1" />
            <text x={pad.l - 8} y={yy + 3.5} textAnchor="end" fontSize="11" fill={C.muted} fontFamily="var(--font-sans)">{format(Math.round(v))}</text>
          </g>
        );
      })}
      {labels.map((lb, i) => (
        <text key={i} x={x(i, labels.length)} y={height - 8} textAnchor="middle" fontSize="11" fill={C.muted} fontFamily="var(--font-sans)">{lb}</text>
      ))}
      {series.map((s, si) => {
        const d = s.map((v, i) => `${i ? "L" : "M"}${x(i, s.length).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={colors[si]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {s.map((v, i) => <circle key={i} cx={x(i, s.length)} cy={y(v)} r="3" fill="var(--surface-card)" stroke={colors[si]} strokeWidth="2" />)}
          </g>
        );
      })}
    </svg>
  );
}

/* Pareto chart — revenue bars per decile + cumulative % line. */
function ParetoChart({ deciles = [], height = 260 }) {
  const W = 720, pad = { l: 40, r: 40, t: 18, b: 34 };
  const n = deciles.length;
  const max = Math.max(...deciles) * 1.1;
  const bw = (W - pad.l - pad.r) / n;
  let cum = 0; const cumPts = [];
  deciles.forEach((d, i) => { cum += d; cumPts.push([pad.l + bw * i + bw / 2, pad.t + (1 - cum / 100) * (height - pad.t - pad.b)]); });
  const y = (v) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const line = cumPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  // highlight where cumulative crosses ~71 (top 2 deciles)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block" }}>
      {[0, 25, 50, 75, 100].map((t) => {
        const yy = pad.t + (1 - t / 100) * (height - pad.t - pad.b);
        return <line key={t} x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke={C.grid} strokeWidth="1" />;
      })}
      {deciles.map((d, i) => {
        const h = (d / max) * (height - pad.t - pad.b);
        const hot = i < 2;
        return (
          <g key={i}>
            <rect x={pad.l + bw * i + bw * 0.16} y={y(d)} width={bw * 0.68} height={h} rx="3"
              fill={hot ? C.blue : C.soft} />
            <text x={pad.l + bw * i + bw / 2} y={height - 12} textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="var(--font-sans)">{i + 1}0%</text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke={C.clay} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {cumPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill="var(--surface-card)" stroke={C.clay} strokeWidth="2" />)}
      {/* 71% callout at decile 2 */}
      <g>
        <line x1={cumPts[1][0]} y1={cumPts[1][1]} x2={cumPts[1][0]} y2={pad.t} stroke={C.clay} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <text x={cumPts[1][0] + 6} y={pad.t + 12} fontSize="12" fill={C.clay} fontWeight="700" fontFamily="var(--font-sans)">71% of revenue</text>
      </g>
    </svg>
  );
}

/* Cohort retention heatmap. rows: [{label, row:[..]}] values 0-100 or null. */
function CohortHeatmap({ rows = [], cols = ["M0", "M1", "M2", "M3", "M4", "M5"] }) {
  const cell = (v) => {
    if (v == null) return { bg: "transparent", fg: "transparent", txt: "" };
    const t = v / 100;
    // blend cream → blue by intensity
    const bg = `color-mix(in srgb, var(--ss-blue-500) ${Math.round(8 + t * 78)}%, var(--surface-card))`;
    const fg = t > 0.42 ? "#fff" : "var(--text-body)";
    return { bg, fg, txt: v + "%" };
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `48px repeat(${cols.length}, 1fr)`, gap: 5 }}>
      <div />
      {cols.map((c) => <div key={c} style={{ textAlign: "center", fontSize: 11, color: C.muted, fontWeight: 600, paddingBottom: 2 }}>{c}</div>)}
      {rows.map((r) => (
        <React.Fragment key={r.label}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: C.muted, fontWeight: 600 }}>{r.label}</div>
          {r.row.map((v, i) => {
            const s = cell(v);
            return (
              <div key={i} style={{
                height: 34, borderRadius: 6, background: s.bg, color: s.fg,
                display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600,
                fontFamily: "var(--font-ui-display)", border: v == null ? "1px dashed var(--border-hairline)" : "none",
              }}>{s.txt}</div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

/* Horizontal bar rows for rankings/distributions. items: [{label, pct, value, tone}] */
function BarRows({ items = [], showValue = true }) {
  const tones = { primary: C.blue, success: C.green, warning: C.amber, danger: C.clay, neutral: "var(--ss-ink-soft)" };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 13.5, color: "var(--text-strong)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</div>
          <div style={{ height: 9, borderRadius: 5, background: C.soft, overflow: "hidden" }}>
            <div style={{ width: `${it.pct}%`, height: "100%", borderRadius: 5, background: tones[it.tone] || C.blue, transition: "width var(--dur-base) var(--ease-out)" }} />
          </div>
          {showValue && <div style={{ fontSize: 13, color: C.muted, fontFamily: "var(--font-ui-display)", fontWeight: 600, minWidth: 56, textAlign: "right" }}>{it.value ?? it.pct + "%"}</div>}
        </div>
      ))}
    </div>
  );
}

/* Donut / progress ring. */
function Ring({ score = 0, size = 92, stroke = 8, color, label }) {
  const r = size / 2 - stroke, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const col = color || (score >= 80 ? C.green : score >= 67 ? C.amber : C.clay);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.soft} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }} />
      <text x={size / 2} y={size / 2 + (label ? -2 : 6)} textAnchor="middle" fontFamily="var(--font-ui-display)" fontWeight="700" fontSize={size * 0.28} fill={C.ink}>{score}</text>
      {label && <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="9.5" fill={C.muted} fontFamily="var(--font-sans)" letterSpacing="0.08em">{label}</text>}
    </svg>
  );
}

/* Stylized geo-concentration plot: concentric radius rings + clustered dots.
   Abstract (not a real map) — on-brand, painterly. */
function GeoConcentration({ height = 320, radiusMiles = 5, pct = 82 }) {
  const W = 520, cx = W / 2, cy = height / 2;
  const rings = [0.92, 0.66, 0.4]; // outer→inner as fraction of maxR
  const maxR = Math.min(W, height) / 2 - 14;
  // deterministic-ish dots: dense cluster near center + a few outliers
  const dots = React.useMemo(() => {
    const out = []; let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 140; i++) {
      const local = rnd() < pct / 100;
      const rr = local ? maxR * 0.36 * Math.sqrt(rnd()) : maxR * (0.62 + rnd() * 0.34);
      const a = rnd() * Math.PI * 2;
      out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.78, local });
    }
    return out;
  }, [height, pct]);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: "block" }}>
      <defs>
        <radialGradient id="geoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ss-blue-500)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--ss-blue-500)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={maxR * 0.5} ry={maxR * 0.42} fill="url(#geoGlow)" />
      {rings.map((f, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={maxR * f} ry={maxR * f * 0.78} fill="none"
          stroke={i === 1 ? "var(--ss-blue-500)" : C.grid} strokeWidth={i === 1 ? 1.5 : 1}
          strokeDasharray={i === 1 ? "5 4" : "none"} opacity={i === 1 ? 0.7 : 1} />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.local ? 3.1 : 2.4}
          fill={d.local ? "var(--ss-blue-500)" : "var(--ss-muted)"} opacity={d.local ? 0.82 : 0.5} />
      ))}
      {/* two store markers */}
      {[[-0.12, -0.04], [0.12, 0.06]].map(([dx, dy], i) => (
        <g key={i} transform={`translate(${cx + maxR * dx},${cy + maxR * dy})`}>
          <circle r="7" fill="var(--ss-clay-500)" stroke="#fff" strokeWidth="2" />
          <circle r="13" fill="none" stroke="var(--ss-clay-500)" strokeWidth="1.5" opacity="0.4" />
        </g>
      ))}
      <text x={cx} y={cy - maxR * 0.78 + 4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ss-blue-700)" fontFamily="var(--font-sans)">{radiusMiles}-mile radius · {pct}%</text>
    </svg>
  );
}

window.SSCharts = { Sparkline, TrendLine, ParetoChart, CohortHeatmap, BarRows, Ring, GeoConcentration };
