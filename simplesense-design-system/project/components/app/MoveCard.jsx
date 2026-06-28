import React from "react";
import { Badge } from "../core/Badge.jsx";
import { Button } from "../core/Button.jsx";

/**
 * MoveCard — the signature SimpleSense unit: a ranked, prescriptive
 * recommendation. Structure: rank → pattern → why → moves (✓ list) → impact.
 * This is the product's hero component; everything else is supporting cast.
 */
export function MoveCard({
  rank,
  category = "Move",
  pattern,
  why,
  moves = [],
  impact,
  confidence,
  ctaLabel = "Apply this move",
  onApply,
  style,
  ...rest
}) {
  return (
    <article
      style={{
        position: "relative",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: "22px 24px",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {/* header: rank + category + impact */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {rank != null ? (
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: "var(--radius-sm)",
              background: "var(--ss-blue-500)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontSize: 20,
              lineHeight: 1,
              boxShadow: "var(--shadow-inset-glint)",
              flex: "none",
            }}
          >
            {rank}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="ss-eyebrow" style={{
            fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)",
          }}>
            {category}
          </span>
        </div>
        {impact ? <Badge tone="success" dot>{impact}</Badge> : null}
      </div>

      {/* pattern — the non-obvious finding, in editorial serif */}
      <p style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontSize: 22,
        lineHeight: 1.18,
        letterSpacing: "-0.01em",
        color: "var(--text-strong)",
      }}>
        {pattern}
      </p>

      {/* why */}
      {why ? (
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text-body)" }}>
          <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>Why · </span>
          {why}
        </p>
      ) : null}

      {/* moves */}
      {moves.length ? (
        <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 9 }}>
          {moves.map((m, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.45, color: "var(--text-body)" }}>
              <i className="bi bi-check2" aria-hidden="true" style={{ color: "var(--ss-success)", fontSize: 16, marginTop: 1, flex: "none" }} />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-hairline)",
      }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          {confidence ? <><i className="bi bi-bullseye" aria-hidden="true" style={{ marginRight: 6 }} />{confidence}</> : null}
        </span>
        <Button size="sm" variant="primary" iconRight="arrow-right" onClick={onApply}>{ctaLabel}</Button>
      </div>
    </article>
  );
}
