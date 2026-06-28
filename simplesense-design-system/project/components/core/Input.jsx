import React from "react";

/** Text input with optional leading icon and label. */
export function Input({ label, icon, id, hint, invalid = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `ss-input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <label htmlFor={inputId} style={{ display: "block", fontFamily: "var(--font-sans)" }}>
      {label ? (
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 }}>
          {label}
        </span>
      ) : null}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface-card)",
          border: `1px solid ${invalid ? "var(--ss-danger)" : focus ? "var(--ss-blue-500)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "0 12px",
          height: 42,
          boxShadow: focus ? "var(--focus-ring)" : "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        }}
      >
        {icon ? <i className={`bi bi-${icon}`} aria-hidden="true" style={{ color: "var(--text-muted)" }} /> : null}
        <input
          id={inputId}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--text-strong)",
            height: "100%",
            minWidth: 0,
            ...style,
          }}
          {...rest}
        />
      </span>
      {hint ? (
        <span style={{ display: "block", fontSize: 12, color: invalid ? "var(--ss-danger)" : "var(--text-muted)", marginTop: 6 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
