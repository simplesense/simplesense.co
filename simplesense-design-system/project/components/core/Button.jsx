import React from "react";

/**
 * SimpleSense Button.
 * Primary carries the signature inner top glint + outline lifted from the
 * landing CTA. Press states shift color, never shrink.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  pill = false,
  icon,
  iconRight,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    sm: { padding: "0 14px", height: 34, fontSize: 13 },
    md: { padding: "0 18px", height: 42, fontSize: 14 },
    lg: { padding: "0 26px", height: 52, fontSize: 16 },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: s.height,
    padding: s.padding,
    fontFamily: "var(--font-sans)",
    fontSize: s.fontSize,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.005em",
    border: "1px solid transparent",
    borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background var(--dur-fast) var(--ease-in-out), color var(--dur-fast), border-color var(--dur-fast)",
    whiteSpace: "nowrap",
    userSelect: "none",
    overflow: "hidden",
  };

  const variants = {
    primary: {
      background: active ? "var(--ss-blue-700)" : hover ? "var(--ss-blue-600)" : "var(--ss-blue-500)",
      color: "var(--text-onbrand)",
      borderColor: active ? "var(--ss-blue-700)" : "var(--ss-blue-500)",
      boxShadow: "var(--shadow-inset-glint), var(--shadow-sm)",
    },
    clay: {
      background: active ? "var(--ss-clay-600)" : hover ? "var(--ss-clay-600)" : "var(--ss-clay-500)",
      color: "var(--text-onbrand)",
      borderColor: "var(--ss-clay-500)",
      boxShadow: "var(--shadow-inset-glint), var(--shadow-sm)",
    },
    secondary: {
      background: hover ? "var(--surface-soft)" : "var(--surface-card)",
      color: "var(--text-strong)",
      borderColor: "var(--border-strong)",
    },
    ghost: {
      background: hover ? "var(--surface-soft)" : "transparent",
      color: "var(--text-strong)",
    },
  };

  const glint =
    (variant === "primary" || variant === "clay") ? (
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 1,
          left: "10%",
          width: hover ? "84%" : "80%",
          height: 14,
          borderRadius: 12,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.42), transparent)",
          transition: "width var(--dur-base) var(--ease-out)",
          pointerEvents: "none",
        }}
      />
    ) : null;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{ ...base, ...(variants[variant] || variants.primary), ...style }}
      {...rest}
    >
      {glint}
      {icon ? <i className={`bi bi-${icon}`} aria-hidden="true" style={{ fontSize: "1.05em" }} /> : null}
      <span style={{ position: "relative" }}>{children}</span>
      {iconRight ? <i className={`bi bi-${iconRight}`} aria-hidden="true" style={{ fontSize: "1.05em" }} /> : null}
    </button>
  );
}
