import type { CSSProperties } from 'react'

export interface ParetoPoint {
  /** Cumulative fraction of customers, 0–1 (x-axis). */
  customerFraction: number
  /** Cumulative fraction of revenue, 0–1 (y-axis). */
  revenueShare: number
}

export interface ParetoChartProps {
  /** Concentration points (e.g. top 1/5/10/20%). Sorted by customerFraction ascending. */
  points: ParetoPoint[]
  width?: number
  height?: number
  style?: CSSProperties
}

/**
 * ParetoChart (§3c) — the customer-concentration curve. Plots cumulative revenue share
 * against cumulative customer share as a filled Lorenz-style curve, with the 45° "perfect
 * equality" reference. The gap between the curve and the diagonal IS the concentration.
 * Pure SVG, deterministic, server-renderable. Every point is a real metric — no smoothing
 * that would imply data between the measured percentiles.
 */
export function ParetoChart({ points, width = 460, height = 280, style }: ParetoChartProps) {
  const pad = { top: 16, right: 16, bottom: 30, left: 40 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom
  const x = (f: number) => pad.left + Math.max(0, Math.min(1, f)) * w
  const y = (f: number) => pad.top + (1 - Math.max(0, Math.min(1, f))) * h

  // Anchor the curve at the origin; clamp + sort the measured points.
  const pts = [{ customerFraction: 0, revenueShare: 0 }, ...points]
    .filter((p) => Number.isFinite(p.customerFraction) && Number.isFinite(p.revenueShare))
    .sort((a, b) => a.customerFraction - b.customerFraction)

  const curve = pts.map(
    (p) => `${x(p.customerFraction).toFixed(1)},${y(p.revenueShare).toFixed(1)}`,
  )
  const area = `${x(0)},${y(0)} ${curve.join(' ')} ${x(pts[pts.length - 1]?.customerFraction ?? 0)},${y(0)}`

  const ticks = [0, 0.25, 0.5, 0.75, 1]
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Customer revenue concentration curve"
      style={{ display: 'block', ...style }}
    >
      {/* gridlines */}
      {ticks.map((t) => (
        <line
          key={`gx${t}`}
          x1={x(t)}
          y1={pad.top}
          x2={x(t)}
          y2={pad.top + h}
          stroke="var(--border-hairline)"
          strokeWidth={1}
        />
      ))}
      {ticks.map((t) => (
        <line
          key={`gy${t}`}
          x1={pad.left}
          y1={y(t)}
          x2={pad.left + w}
          y2={y(t)}
          stroke="var(--border-hairline)"
          strokeWidth={1}
        />
      ))}

      {/* equality diagonal */}
      <line
        x1={x(0)}
        y1={y(0)}
        x2={x(1)}
        y2={y(1)}
        stroke="var(--text-muted)"
        strokeWidth={1.25}
        strokeDasharray="4 4"
      />

      {/* concentration area + curve */}
      <polygon points={area} fill="var(--ss-blue-500)" fillOpacity={0.12} />
      <polyline
        points={curve.join(' ')}
        fill="none"
        stroke="var(--ss-blue-500)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.slice(1).map((p, i) => (
        <circle
          key={i}
          cx={x(p.customerFraction)}
          cy={y(p.revenueShare)}
          r={3.5}
          fill="var(--surface-card)"
          stroke="var(--ss-blue-500)"
          strokeWidth={2}
        />
      ))}

      {/* axis labels */}
      {ticks.map((t) => (
        <text
          key={`tx${t}`}
          x={x(t)}
          y={height - 10}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text-muted)"
          fontFamily="var(--font-sans)"
        >
          {Math.round(t * 100)}%
        </text>
      ))}
      {ticks
        .filter((t) => t > 0)
        .map((t) => (
          <text
            key={`ty${t}`}
            x={pad.left - 6}
            y={y(t) + 3}
            textAnchor="end"
            fontSize={10}
            fill="var(--text-muted)"
            fontFamily="var(--font-sans)"
          >
            {Math.round(t * 100)}%
          </text>
        ))}
    </svg>
  )
}
