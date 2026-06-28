import React from "react";

/** Round avatar — image or initials, sized sm/md/lg. */
export function Avatar({ src, name = "", size = "md", style, ...rest }) {
  const sizes = { sm: 28, md: 38, lg: 52 };
  const px = sizes[size] || sizes.md;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      title={name || undefined}
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: px,
        height: px,
        borderRadius: "50%",
        background: "var(--ss-clay-100)",
        color: "var(--ss-clay-600)",
        border: "1px solid var(--border-hairline)",
        fontFamily: "var(--font-sans)",
        fontSize: px * 0.36,
        fontWeight: 700,
        overflow: "hidden",
        flex: "none",
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
