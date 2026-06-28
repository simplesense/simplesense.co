/* @ds-bundle: {"format":3,"namespace":"SimpleSenseDesignSystem_33cb4c","components":[{"name":"MetricCard","sourcePath":"components/app/MetricCard.jsx"},{"name":"MoveCard","sourcePath":"components/app/MoveCard.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"}],"sourceHashes":{"components/app/MetricCard.jsx":"73543a88672f","components/app/MoveCard.jsx":"5c3deb03be9d","components/core/Avatar.jsx":"bea1777a723c","components/core/Badge.jsx":"e20affd8ee3b","components/core/Button.jsx":"ba9d395e9564","components/core/Card.jsx":"ba41dd306562","components/core/Input.jsx":"931d400913bc","ui_kits/app/App.jsx":"a81d7106c4df","ui_kits/app/AuditView.jsx":"05653179434a","ui_kits/app/BillingView.jsx":"50d3610f02cd","ui_kits/app/ConnectionsView.jsx":"29f1c7761b69","ui_kits/app/CustomersView.jsx":"000f7c00a67a","ui_kits/app/DashboardView.jsx":"901cc61206ce","ui_kits/app/GeographyView.jsx":"9456a39b846c","ui_kits/app/MonitoringView.jsx":"c504713b268d","ui_kits/app/MoveDetailView.jsx":"633868b2299a","ui_kits/app/Onboarding.jsx":"061f5da0cf96","ui_kits/app/ProductsView.jsx":"33c1e936ebc9","ui_kits/app/SettingsView.jsx":"939a76183224","ui_kits/app/Sidebar.jsx":"488b75ff3eed","ui_kits/app/appData.jsx":"2ae9a45f470e","ui_kits/app/charts.jsx":"50da42af2852","ui_kits/app/ui.jsx":"a457390603d6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SimpleSenseDesignSystem_33cb4c = window.SimpleSenseDesignSystem_33cb4c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Round avatar — image or initials, sized sm/md/lg. */
function Avatar({
  src,
  name = "",
  size = "md",
  style,
  ...rest
}) {
  const sizes = {
    sm: 28,
    md: 38,
    lg: 52
  };
  const px = sizes[size] || sizes.md;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name || undefined,
    style: {
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
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials || "?");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Status / category pill. Soft tinted background by default, or `outline`.
 */
function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  dot = false,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      fg: "var(--ss-ink-soft)",
      bg: "var(--surface-soft)",
      bd: "var(--border-strong)"
    },
    primary: {
      fg: "var(--ss-blue-600)",
      bg: "var(--ss-info-bg)",
      bd: "var(--ss-blue-300)"
    },
    success: {
      fg: "var(--ss-success)",
      bg: "var(--ss-success-bg)",
      bd: "var(--ss-success)"
    },
    warning: {
      fg: "var(--ss-warning)",
      bg: "var(--ss-warning-bg)",
      bd: "var(--ss-warning)"
    },
    danger: {
      fg: "var(--ss-danger)",
      bg: "var(--ss-danger-bg)",
      bd: "var(--ss-danger)"
    },
    clay: {
      fg: "var(--ss-clay-600)",
      bg: "var(--ss-clay-100)",
      bd: "var(--ss-clay-300)"
    }
  };
  const t = tones[tone] || tones.neutral;
  const outline = variant === "outline";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      borderRadius: "var(--radius-pill)",
      color: t.fg,
      background: outline ? "transparent" : t.bg,
      border: `1px solid ${outline ? t.bd : "transparent"}`,
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: t.fg
    },
    "aria-hidden": "true"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/app/MetricCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Dashboard metric tile — label, large value, optional delta badge & icon. */
function MetricCard({
  label,
  value,
  delta,
  deltaTone = "success",
  icon,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      padding: "18px 20px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    "aria-hidden": "true",
    style: {
      color: "var(--ss-blue-500)",
      fontSize: 15
    }
  }) : null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--text-muted)",
      fontWeight: 500
    }
  }, label)), /*#__PURE__*/React.createElement("strong", {
    style: {
      display: "block",
      marginTop: 8,
      fontSize: 30,
      lineHeight: 1.1,
      color: "var(--text-strong)",
      fontWeight: 700,
      letterSpacing: "-0.01em"
    }
  }, value)), delta != null ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: deltaTone
  }, delta) : null);
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SimpleSense Button.
 * Primary carries the signature inner top glint + outline lifted from the
 * landing CTA. Press states shift color, never shrink.
 */
function Button({
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
    sm: {
      padding: "0 14px",
      height: 34,
      fontSize: 13
    },
    md: {
      padding: "0 18px",
      height: 42,
      fontSize: 14
    },
    lg: {
      padding: "0 26px",
      height: 52,
      fontSize: 16
    }
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
    overflow: "hidden"
  };
  const variants = {
    primary: {
      background: active ? "var(--ss-blue-700)" : hover ? "var(--ss-blue-600)" : "var(--ss-blue-500)",
      color: "var(--text-onbrand)",
      borderColor: active ? "var(--ss-blue-700)" : "var(--ss-blue-500)",
      boxShadow: "var(--shadow-inset-glint), var(--shadow-sm)"
    },
    clay: {
      background: active ? "var(--ss-clay-600)" : hover ? "var(--ss-clay-600)" : "var(--ss-clay-500)",
      color: "var(--text-onbrand)",
      borderColor: "var(--ss-clay-500)",
      boxShadow: "var(--shadow-inset-glint), var(--shadow-sm)"
    },
    secondary: {
      background: hover ? "var(--surface-soft)" : "var(--surface-card)",
      color: "var(--text-strong)",
      borderColor: "var(--border-strong)"
    },
    ghost: {
      background: hover ? "var(--surface-soft)" : "transparent",
      color: "var(--text-strong)"
    }
  };
  const glint = variant === "primary" || variant === "clay" ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      top: 1,
      left: "10%",
      width: hover ? "84%" : "80%",
      height: 14,
      borderRadius: 12,
      background: "linear-gradient(to bottom, rgba(255,255,255,0.42), transparent)",
      transition: "width var(--dur-base) var(--ease-out)",
      pointerEvents: "none"
    }
  }) : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      ...base,
      ...(variants[variant] || variants.primary),
      ...style
    }
  }, rest), glint, icon ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em"
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative"
    }
  }, children), iconRight ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${iconRight}`,
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em"
    }
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/app/MoveCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * MoveCard — the signature SimpleSense unit: a ranked, prescriptive
 * recommendation. Structure: rank → pattern → why → moves (✓ list) → impact.
 * This is the product's hero component; everything else is supporting cast.
 */
function MoveCard({
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
  return /*#__PURE__*/React.createElement("article", _extends({
    style: {
      position: "relative",
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-md)",
      padding: "22px 24px",
      fontFamily: "var(--font-sans)",
      overflow: "hidden",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 14
    }
  }, rank != null ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
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
      flex: "none"
    }
  }, rank) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ss-eyebrow",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--accent)"
    }
  }, category)), impact ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "success",
    dot: true
  }, impact) : null), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: 22,
      lineHeight: 1.18,
      letterSpacing: "-0.01em",
      color: "var(--text-strong)"
    }
  }, pattern), why ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "10px 0 0",
      fontSize: 14,
      lineHeight: 1.55,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, "Why \xB7 "), why) : null, moves.length ? /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "16px 0 0",
      padding: 0,
      display: "grid",
      gap: 9
    }
  }, moves.map((m, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      fontSize: 14,
      lineHeight: 1.45,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2",
    "aria-hidden": "true",
    style: {
      color: "var(--ss-success)",
      fontSize: 16,
      marginTop: 1,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", null, m)))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 20,
      paddingTop: 16,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, confidence ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-bullseye",
    "aria-hidden": "true",
    style: {
      marginRight: 6
    }
  }), confidence) : null), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "primary",
    iconRight: "arrow-right",
    onClick: onApply
  }, ctaLabel)));
}
Object.assign(__ds_scope, { MoveCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/MoveCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Warm-white surface card with hairline border and soft warm shadow. */
function Card({
  children,
  padding = 24,
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
      padding,
      transition: "box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)",
      transform: hover ? "translateY(-2px)" : "none",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input with optional leading icon and label. */
function Input({
  label,
  icon,
  id,
  hint,
  invalid = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `ss-input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: "block",
      fontFamily: "var(--font-sans)"
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-strong)",
      marginBottom: 6
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--surface-card)",
      border: `1px solid ${invalid ? "var(--ss-danger)" : focus ? "var(--ss-blue-500)" : "var(--border-strong)"}`,
      borderRadius: "var(--radius-sm)",
      padding: "0 12px",
      height: 42,
      boxShadow: focus ? "var(--focus-ring)" : "none",
      transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)"
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    "aria-hidden": "true",
    style: {
      color: "var(--text-muted)"
    }
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-strong)",
      height: "100%",
      minWidth: 0,
      ...style
    }
  }, rest))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: invalid ? "var(--ss-danger)" : "var(--text-muted)",
      marginTop: 6
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/App.jsx
try { (() => {
/* global React, ReactDOM, window */
const {
  Button
} = window.SimpleSenseDesignSystem_33cb4c;

// View components are registered on window by sibling babel scripts. Read them
// at render time (not module-eval time) so load order can't capture undefined.

function Topbar({
  onConnect
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--topbar-height)",
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "color-mix(in srgb, var(--surface-card) 90%, transparent)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 22px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-search",
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-muted)",
      fontSize: 14
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Ask about your store\u2026",
    style: {
      width: "100%",
      height: 38,
      padding: "0 12px 0 34px",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface-page)",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-strong)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 13,
      color: "var(--ss-success)",
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--ss-success)"
    }
  }), " All sources synced"), /*#__PURE__*/React.createElement("button", {
    className: "ss-icon-btn",
    "aria-label": "Notifications"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-bell"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plug",
    onClick: onConnect
  }, "Connect a source"));
}
function App() {
  const {
    Sidebar,
    AuditView,
    DashboardView,
    MonitoringView,
    CustomersView,
    GeographyView,
    ProductsView,
    ConnectionsView,
    SettingsView,
    BillingView,
    MoveDetailView
  } = window;
  const [view, setView] = React.useState("dashboard");
  const [moveId, setMoveId] = React.useState(null); // when set → detail page
  const [applied, setApplied] = React.useState({}); // shared apply state (by move id)
  const mainRef = React.useRef(null);
  const go = v => {
    setMoveId(null);
    setView(v);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };
  const openMove = id => {
    setMoveId(id);
    window.scrollTo(0, 0);
  };
  const applyMove = id => setApplied(a => ({
    ...a,
    [id]: true
  }));
  let content;
  if (moveId) {
    content = /*#__PURE__*/React.createElement(MoveDetailView, {
      moveId: moveId,
      applied: !!applied[moveId],
      onApply: () => applyMove(moveId),
      onBack: () => setMoveId(null)
    });
  } else {
    switch (view) {
      case "dashboard":
        content = /*#__PURE__*/React.createElement(DashboardView, {
          applied: applied,
          onApply: applyMove,
          onUndo: id => setApplied(a => ({
            ...a,
            [id]: false
          })),
          onOpenMove: openMove
        });
        break;
      case "audit":
        content = /*#__PURE__*/React.createElement(AuditView, {
          onNavigate: go
        });
        break;
      case "monitor":
        content = /*#__PURE__*/React.createElement(MonitoringView, {
          onOpenMove: openMove
        });
        break;
      case "customers":
        content = /*#__PURE__*/React.createElement(CustomersView, {
          onOpenMove: openMove
        });
        break;
      case "geo":
        content = /*#__PURE__*/React.createElement(GeographyView, {
          onOpenMove: openMove
        });
        break;
      case "products":
        content = /*#__PURE__*/React.createElement(ProductsView, {
          onOpenMove: openMove
        });
        break;
      case "connections":
        content = /*#__PURE__*/React.createElement(ConnectionsView, null);
        break;
      case "settings":
        content = /*#__PURE__*/React.createElement(SettingsView, null);
        break;
      case "billing":
        content = /*#__PURE__*/React.createElement(BillingView, null);
        break;
      default:
        content = /*#__PURE__*/React.createElement(DashboardView, {
          applied: applied,
          onApply: applyMove,
          onUndo: id => setApplied(a => ({
            ...a,
            [id]: false
          })),
          onOpenMove: openMove
        });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: moveId ? "dashboard" : view,
    onSelect: go
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "var(--sidebar-width)",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    onConnect: () => go("connections")
  }), /*#__PURE__*/React.createElement("main", {
    ref: mainRef,
    style: {
      padding: "26px 28px",
      maxWidth: "var(--container-max)",
      margin: "0 auto"
    }
  }, content)));
}

// Mount only once every dependency has registered. Babel executes the
// type="text/babel" src scripts in fetch-completion order (NOT DOM order),
// so we poll until every view component, the data/chart/ui globals, AND the
// design-system bundle are present before the first (and only) render. App
// provably renders clean once these exist, so no retry/boundary is needed.
const REQUIRED = ["Sidebar", "AuditView", "DashboardView", "MonitoringView", "CustomersView", "GeographyView", "ProductsView", "ConnectionsView", "SettingsView", "BillingView", "MoveDetailView", "SS_DATA", "SSCharts", "SSUI"];
function ssReady() {
  const ns = window.SimpleSenseDesignSystem_33cb4c;
  if (!ns || !ns.Button || !ns.MoveCard) return false;
  return REQUIRED.every(n => window[n]);
}
function mountApp() {
  if (!ssReady()) {
    setTimeout(mountApp, 30);
    return;
  }
  const rootEl = document.getElementById("root");
  if (!window.__ssRoot) window.__ssRoot = ReactDOM.createRoot(rootEl);
  window.__ssRoot.render(/*#__PURE__*/React.createElement(App, null));
  // Self-heal: React 18's async commit can no-op the very first render during
  // babel's staggered script eval. If nothing committed, render again until it
  // sticks (App provably renders once deps are present, so this converges fast).
  let tries = 0;
  (function verify() {
    if (rootEl.children.length > 0 || tries++ > 60) return;
    window.__ssRoot.render(/*#__PURE__*/React.createElement(App, null));
    setTimeout(verify, 50);
  })();
}
mountApp();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AuditView.jsx
try { (() => {
/* global React */
const {
  Card,
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
const CATS = [{
  label: "Acquisition efficiency",
  score: 72,
  tone: "warning",
  note: "CAC up 14% QoQ on Meta"
}, {
  label: "Retention & repeat",
  score: 84,
  tone: "success",
  note: "Repeat rate climbing"
}, {
  label: "Conversion path",
  score: 61,
  tone: "danger",
  note: "Checkout drop-off on mobile"
}, {
  label: "Inventory health",
  score: 68,
  tone: "warning",
  note: "4 hero SKUs at risk"
}, {
  label: "Profit visibility",
  score: 90,
  tone: "success",
  note: "Landed cost + ad spend mapped"
}];
function Ring({
  score
}) {
  const r = 34,
    c = 2 * Math.PI * r,
    off = c * (1 - score / 100);
  const col = score >= 80 ? "var(--ss-success)" : score >= 67 ? "var(--ss-warning)" : "var(--ss-danger)";
  return /*#__PURE__*/React.createElement("svg", {
    width: "92",
    height: "92",
    viewBox: "0 0 92 92"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "46",
    r: r,
    fill: "none",
    stroke: "var(--surface-soft)",
    strokeWidth: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "46",
    r: r,
    fill: "none",
    stroke: col,
    strokeWidth: "8",
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: off,
    transform: "rotate(-90 46 46)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "46",
    y: "50",
    textAnchor: "middle",
    fontFamily: "var(--font-display)",
    fontSize: "26",
    fill: "var(--text-strong)"
  }, score));
}
function AuditView({
  onNavigate
}) {
  const overall = 71;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ss-eyebrow",
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--accent)"
    }
  }, "Free audit \xB7 complete"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 38,
      letterSpacing: "-0.015em",
      lineHeight: 1.05,
      margin: "6px 0"
    }
  }, "Store audit"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--text-body)",
      fontSize: 15
    }
  }, "3.2 years of history read across Shopify, GA4, Meta and Klaviyo.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      gap: 18,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 26,
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Ring, {
    score: overall
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 18,
      margin: "14px 0 4px"
    }
  }, "Operator score"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      color: "var(--text-muted)",
      fontSize: 13.5,
      lineHeight: 1.5
    }
  }, "Solid foundation with three high-value gaps. Fixing conversion and inventory unlocks most of the upside."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconRight: "arrow-right",
    style: {
      width: "100%"
    },
    onClick: () => onNavigate && onNavigate("dashboard")
  }, "See this week's moves")), /*#__PURE__*/React.createElement(Card, {
    padding: 8
  }, CATS.map((cat, i) => /*#__PURE__*/React.createElement("div", {
    key: cat.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "16px 16px",
      borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      fontFamily: "var(--font-display)",
      fontSize: 24,
      color: "var(--text-strong)"
    }
  }, cat.score), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, cat.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, cat.note), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 3,
      background: "var(--surface-soft)",
      marginTop: 8,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${cat.score}%`,
      height: "100%",
      borderRadius: 3,
      background: cat.tone === "success" ? "var(--ss-success)" : cat.tone === "warning" ? "var(--ss-warning)" : "var(--ss-danger)"
    }
  }))), /*#__PURE__*/React.createElement(Badge, {
    tone: cat.tone
  }, cat.tone === "success" ? "Strong" : cat.tone === "warning" ? "Improve" : "Fix"))))));
}
window.AuditView = AuditView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AuditView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/BillingView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
const PLANS = [{
  id: "free",
  name: "Free audit",
  price: {
    mo: 0,
    yr: 0
  },
  tag: "One-time",
  blurb: "See the gaps. No card required.",
  features: ["Full store audit", "Operator score", "Top 3 gaps identified", "1 data source"],
  cta: "Current free tier"
}, {
  id: "basic",
  name: "Basic",
  price: {
    mo: 49,
    yr: 39
  },
  tag: null,
  blurb: "Weekly moves for a focused store.",
  features: ["Everything in Free", "Weekly ranked moves", "2 data sources", "Email digest", "12 months history"],
  cta: "Downgrade"
}, {
  id: "pro",
  name: "Pro",
  price: {
    mo: 129,
    yr: 99
  },
  tag: "Current",
  blurb: "The full co-pilot, all sources.",
  features: ["Everything in Basic", "All data sources", "Unlimited history", "Real-time alerts + SMS", "Auto-apply moves", "Priority support"],
  cta: "Current plan"
}];
function PlanCard({
  p,
  cycle,
  current
}) {
  const price = p.price[cycle];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "var(--surface-card)",
      border: current ? "1.5px solid var(--ss-blue-500)" : "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: current ? "var(--shadow-md)" : "var(--shadow-xs)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, p.tag && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 16,
      right: 16,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: current ? "var(--ss-blue-700)" : "var(--text-muted)",
      background: current ? "var(--ss-blue-50)" : "var(--surface-soft)",
      padding: "4px 9px",
      borderRadius: "var(--radius-pill)"
    }
  }, p.tag), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 19,
      color: "var(--text-strong)"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, p.blurb)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 44,
      color: "var(--text-strong)",
      lineHeight: 1
    }
  }, "$", price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, price === 0 ? "" : `/mo${cycle === "yr" ? ", billed yearly" : ""}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, p.features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      fontSize: 13.5,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ss-success)",
      marginTop: 1
    }
  }, "\u2713"), f))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 6
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: current ? "secondary" : p.id === "pro" ? "primary" : "ghost",
    style: {
      width: "100%"
    },
    disabled: current
  }, p.cta)));
}
function BillingView() {
  const {
    ViewHeader,
    Panel,
    SegToggle,
    Stat
  } = window.SSUI;
  const [cycle, setCycle] = React.useState("mo");
  const invoices = [{
    date: "Jun 22, 2026",
    amt: "$129.00",
    status: "Paid"
  }, {
    date: "May 22, 2026",
    amt: "$129.00",
    status: "Paid"
  }, {
    date: "Apr 22, 2026",
    amt: "$129.00",
    status: "Paid"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Account \xB7 Billing",
    title: "Plans & billing",
    sub: "Start free with the audit. Upgrade when the moves are paying for themselves."
  }, /*#__PURE__*/React.createElement(SegToggle, {
    value: cycle,
    onChange: setCycle,
    options: [{
      id: "mo",
      label: "Monthly"
    }, {
      id: "yr",
      label: "Yearly · save 23%"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16,
      marginBottom: 26,
      alignItems: "stretch"
    }
  }, PLANS.map(p => /*#__PURE__*/React.createElement(PlanCard, {
    key: p.id,
    p: p,
    cycle: cycle,
    current: p.id === "pro"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.3fr",
      gap: 18,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "This cycle"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Moves applied",
    value: "14",
    delta: "this month",
    deltaTone: "success"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Est. lift captured",
    value: "$31k",
    delta: "from applied moves",
    deltaTone: "clay"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, "At $129/mo, Pro has returned ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--ss-success)"
    }
  }, "~240\xD7"), " its cost this month."))), /*#__PURE__*/React.createElement(Panel, {
    title: "Invoices",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      icon: "download"
    }, "Download all"),
    padding: 0,
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement("tbody", null, invoices.map((iv, i) => /*#__PURE__*/React.createElement("tr", {
    key: iv.date,
    style: {
      borderTop: i ? "1px solid var(--border-hairline)" : "none"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "14px 20px",
      color: "var(--text-strong)",
      fontWeight: 500
    }
  }, iv.date), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "14px 14px",
      fontFamily: "var(--font-ui-display)",
      fontWeight: 600
    }
  }, iv.amt), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "14px 14px"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, iv.status)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "14px 20px",
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "var(--text-link)",
      fontSize: 13,
      textDecoration: "none",
      fontWeight: 500
    }
  }, "PDF")))))))));
}
window.BillingView = BillingView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/BillingView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ConnectionsView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
function ConnectionCard({
  c,
  state,
  onConnect
}) {
  const status = state || c.status;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-xs)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 46,
      height: 46,
      borderRadius: "var(--radius-md)",
      background: `color-mix(in srgb, ${c.color} 12%, var(--surface-card))`,
      color: c.color,
      fontSize: 22,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${c.icon}`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 16,
      color: "var(--text-strong)"
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, c.desc)), status === "connected" && /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Connected"), status === "connecting" && /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    dot: true
  }, "Connecting\u2026")), status === "connected" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 13,
      borderTop: "1px solid var(--border-hairline)",
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-clock-history",
    style: {
      marginRight: 6
    }
  }), "Since ", c.since), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: "var(--text-body)"
    }
  }, c.records)), status === "connecting" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 13,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 3,
      background: "var(--surface-soft)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "60%",
      height: "100%",
      background: "var(--ss-warning)",
      borderRadius: 3,
      animation: "ssLoad 1.1s var(--ease-in-out) infinite alternate"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      marginTop: 8
    }
  }, "Reading account history\u2026")), status === "available" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 13,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    icon: "plug",
    style: {
      width: "100%"
    },
    onClick: () => onConnect(c.id)
  }, "Connect ", c.name)));
}
function ConnectionsView() {
  const {
    ViewHeader,
    Panel,
    Grounded
  } = window.SSUI;
  const {
    connections
  } = window.SS_DATA;
  const [states, setStates] = React.useState({});
  const connect = id => {
    setStates(s => ({
      ...s,
      [id]: "connecting"
    }));
    setTimeout(() => setStates(s => ({
      ...s,
      [id]: "connected"
    })), 2200);
  };
  const connected = connections.filter(c => (states[c.id] || c.status) === "connected");
  const available = connections.filter(c => c.status === "available");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Account \xB7 Connections",
    title: "Your data sources",
    sub: "SimpleSense reads \u2014 never writes without your say-so. The more it can see, the sharper the moves."
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, connected.length, " connected")), /*#__PURE__*/React.createElement("style", null, `@keyframes ssLoad { from { transform: translateX(-30%) } to { transform: translateX(30%) } }`), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8,
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 15,
      color: "var(--text-strong)"
    }
  }, "Connected"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 14,
      marginBottom: 26
    }
  }, connections.filter(c => c.status === "connected" || states[c.id]).map(c => /*#__PURE__*/React.createElement(ConnectionCard, {
    key: c.id,
    c: c,
    state: states[c.id],
    onConnect: connect
  }))), available.some(c => !states[c.id]) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8,
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 15,
      color: "var(--text-strong)"
    }
  }, "Available to add"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 14,
      marginBottom: 24
    }
  }, available.filter(c => !states[c.id]).map(c => /*#__PURE__*/React.createElement(ConnectionCard, {
    key: c.id,
    c: c,
    onConnect: connect
  })))), /*#__PURE__*/React.createElement(Panel, {
    padding: 18,
    style: {
      background: "var(--surface-inset)"
    }
  }, /*#__PURE__*/React.createElement(Grounded, {
    icon: "shield-lock"
  }, "Read-only by default. SimpleSense pulls history to find moves; it only writes back (segments, Flows, audiences) when you apply a move.")));
}
window.ConnectionsView = ConnectionsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ConnectionsView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/CustomersView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
function CustomersView({
  onOpenMove
}) {
  const {
    ParetoChart,
    CohortHeatmap,
    BarRows
  } = window.SSCharts;
  const {
    ViewHeader,
    Panel,
    SectionLabel,
    Stat,
    Grounded,
    SegToggle
  } = window.SSUI;
  const {
    customers
  } = window.SS_DATA;
  const [cohortMode, setCohortMode] = React.useState("retention");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Understand \xB7 Customers",
    title: "Customer economics",
    sub: "Who actually drives the revenue, how long they stay, and where the next dollar is hiding."
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "download"
  }, "Export segments")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Total customers",
    value: customers.total.toLocaleString(),
    sub: "all-time"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "VIP segment (top 20%)",
    value: customers.vip.toLocaleString(),
    delta: "71% of revenue",
    deltaTone: "primary"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Avg LTV",
    value: "$" + customers.avgLtv,
    delta: "+8% YoY",
    deltaTone: "success"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "VIP LTV",
    value: "$" + customers.vipLtv,
    delta: "3.5\xD7 average",
    deltaTone: "clay"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 18,
      alignItems: "start",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "The Pareto reality",
    sub: "Share of revenue by customer decile, with the cumulative curve."
  }, /*#__PURE__*/React.createElement(ParetoChart, {
    deciles: customers.paretoDeciles,
    height: 264
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement(Grounded, {
    icon: "lightning-charge"
  }, "Your top two deciles \u2014 1,240 customers \u2014 generate 71% of revenue. There's a move here: ", /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenMove("pareto"),
    style: {
      border: "none",
      background: "none",
      padding: 0,
      color: "var(--text-link)",
      fontWeight: 600,
      cursor: "pointer",
      font: "inherit"
    }
  }, "build the VIP flow \u2192")))), /*#__PURE__*/React.createElement(Panel, {
    title: "Segments",
    sub: "Auto-defined from order behavior."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, customers.segments.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.name
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, s.name), /*#__PURE__*/React.createElement(Badge, {
    tone: s.tone
  }, s.count.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 4,
      background: "var(--surface-soft)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${s.rev}%`,
      height: "100%",
      borderRadius: 4,
      background: s.tone === "primary" ? "var(--ss-blue-500)" : s.tone === "success" ? "var(--ss-success)" : s.tone === "warning" ? "var(--ss-warning)" : "var(--ss-ink-soft)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 5,
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, s.rev, "% of revenue"), /*#__PURE__*/React.createElement("span", null, "$", s.ltv, " LTV"))))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Cohort retention",
    sub: "% of each acquisition month still buying, by months since first order.",
    right: /*#__PURE__*/React.createElement(SegToggle, {
      size: "sm",
      value: cohortMode,
      onChange: setCohortMode,
      options: [{
        id: "retention",
        label: "Retention"
      }, {
        id: "revenue",
        label: "Revenue"
      }]
    })
  }, /*#__PURE__*/React.createElement(CohortHeatmap, {
    rows: customers.cohorts
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Grounded, null, "Spring cohorts (Mar\u2013Jun) retain ~10pt better than winter \u2014 your local, repeat-driven base is getting stickier."))));
}
window.CustomersView = CustomersView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/CustomersView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DashboardView.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React, window */
const {
  MoveCard,
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;

// Only the props MoveCard reads — avoids spreading data fields onto the DOM.
const moveProps = m => ({
  rank: m.rank,
  category: m.category,
  pattern: m.pattern,
  why: m.why,
  moves: m.moves,
  impact: m.impact,
  confidence: m.confidence
});

/* Richer KPI tile with sparkline (extends the MetricCard idea). */
function KpiTile({
  k
}) {
  const {
    Sparkline
  } = window.SSCharts;
  const tones = {
    success: "var(--ss-success)",
    warning: "var(--ss-warning)",
    danger: "var(--ss-danger)",
    clay: "var(--ss-clay-500)",
    primary: "var(--ss-blue-600)"
  };
  const colorByTone = {
    success: "var(--ss-chart-2)",
    warning: "var(--ss-chart-3)",
    clay: "var(--ss-chart-4)",
    primary: "var(--ss-chart-1)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-xs)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      fontWeight: 500
    }
  }, k.label), /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${k.icon}`,
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: "-0.02em",
      lineHeight: 1,
      color: "var(--text-strong)"
    }
  }, k.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: tones[k.deltaTone] || "var(--ss-success)",
      marginTop: 5
    }
  }, k.delta)), /*#__PURE__*/React.createElement(Sparkline, {
    data: k.spark,
    color: colorByTone[k.deltaTone] || "var(--ss-chart-1)",
    width: 84,
    height: 32
  })));
}

/* Compact one-line move row used in Focus queue / Briefing. */
function MoveRow({
  m,
  applied,
  onApply,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-hairline)",
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 30,
      height: 30,
      flexShrink: 0,
      borderRadius: "var(--radius-sm)",
      background: applied ? "var(--ss-success-bg)" : "var(--ss-blue-50)",
      color: applied ? "var(--ss-success)" : "var(--ss-blue-600)",
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 14
    }
  }, applied ? /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2",
    style: {
      fontSize: 16
    }
  }) : m.rank), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      cursor: "pointer"
    },
    onClick: () => onOpen(m.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, m.category), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--text-strong)",
      fontWeight: 500,
      marginTop: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, m.pattern)), /*#__PURE__*/React.createElement(Badge, {
    tone: "clay"
  }, m.impact), applied ? /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Applied") : /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => onApply(m.id)
  }, "Apply"));
}
function DashboardView({
  onOpenMove,
  applied = {},
  onApply,
  onUndo
}) {
  const {
    ViewHeader,
    Panel,
    SegToggle,
    SectionLabel,
    Grounded
  } = window.SSUI;
  const {
    moves,
    kpis
  } = window.SS_DATA;
  const [layout, setLayout] = React.useState(() => localStorage.getItem("ss_dash_layout") || "digest");
  const setL = id => {
    setLayout(id);
    localStorage.setItem("ss_dash_layout", id);
  };
  const apply = id => onApply(id);
  const undo = id => onUndo(id);
  const remaining = moves.filter(m => !applied[m.id]).length;
  const hero = moves[0],
    rest = moves.slice(1);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Monday digest \xB7 June 22",
    title: "This week's moves",
    sub: `Ranked by expected impact. ${remaining} of ${moves.length} still to action.`
  }, /*#__PURE__*/React.createElement(SegToggle, {
    value: layout,
    onChange: setL,
    options: [{
      id: "digest",
      label: "Digest",
      icon: "list-ul"
    }, {
      id: "focus",
      label: "Focus",
      icon: "bullseye"
    }, {
      id: "briefing",
      label: "Briefing",
      icon: "file-text"
    }]
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "download"
  }, "Export to Klaviyo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 14,
      marginBottom: 26
    }
  }, kpis.map(k => /*#__PURE__*/React.createElement(KpiTile, {
    key: k.label,
    k: k
  }))), layout === "digest" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, moves.map(m => applied[m.id] ? /*#__PURE__*/React.createElement(AppliedRow, {
    key: m.rank,
    m: m,
    onUndo: () => undo(m.id)
  }) : /*#__PURE__*/React.createElement("div", {
    key: m.rank,
    onClick: e => {
      if (!e.target.closest("button")) onOpenMove(m.id);
    },
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(MoveCard, _extends({}, moveProps(m), {
    ctaLabel: "Apply this move",
    onApply: () => apply(m.id)
  }))))), layout === "focus" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 20,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Do this first"), applied[hero.id] ? /*#__PURE__*/React.createElement(AppliedRow, {
    m: hero,
    onUndo: () => undo(hero.id),
    big: true
  }) : /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      if (!e.target.closest("button")) onOpenMove(hero.id);
    },
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(MoveCard, _extends({}, moveProps(hero), {
    ctaLabel: "Apply this move",
    onApply: () => apply(hero.id)
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
    right: `${rest.filter(m => !applied[m.id]).length} queued`
  }, "Then"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, rest.map(m => /*#__PURE__*/React.createElement(MoveRow, {
    key: m.rank,
    m: m,
    applied: applied[m.id],
    onApply: apply,
    onOpen: onOpenMove
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 18
  }, /*#__PURE__*/React.createElement(Grounded, null, "Every move is grounded in your own numbers. Next digest lands Monday, 6:00 AM."))))), layout === "briefing" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      gap: 20,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    style: {
      position: "sticky",
      top: 88
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ss-eyebrow",
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--accent)",
      marginBottom: 8
    }
  }, "The week in one read"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 21,
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
      color: "var(--text-strong)",
      margin: "0 0 14px"
    }
  }, "Your demand is local, your best customers are under-served, and four heroes are about to run dry."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      paddingTop: 14,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "Lift on the table"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--ss-clay-600)",
      fontFamily: "var(--font-ui-display)"
    }
  }, "$72k / mo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "Moves to action"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-strong)",
      fontFamily: "var(--font-ui-display)"
    }
  }, remaining, " of ", moves.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "Avg confidence"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--ss-success)",
      fontFamily: "var(--font-ui-display)"
    }
  }, "92%")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, moves.map(m => /*#__PURE__*/React.createElement(MoveRow, {
    key: m.rank,
    m: m,
    applied: applied[m.id],
    onApply: apply,
    onOpen: onOpenMove
  })), /*#__PURE__*/React.createElement(Grounded, {
    icon: "shield-check"
  }, "Grounded in 3.2 years of Shopify, GA4, Meta & Klaviyo history."))));
}
function AppliedRow({
  m,
  onUndo,
  big
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: big ? "22px 24px" : "18px 22px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-xs)",
      opacity: 0.9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-sm)",
      background: "var(--ss-success-bg)",
      color: "var(--ss-success)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2",
    style: {
      fontSize: 18
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, m.category), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 18,
      color: "var(--text-strong)",
      marginTop: 2
    }
  }, m.pattern)), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Applied"), /*#__PURE__*/React.createElement("button", {
    onClick: onUndo,
    style: {
      border: "none",
      background: "transparent",
      color: "var(--text-muted)",
      cursor: "pointer",
      fontSize: 13
    }
  }, "Undo"));
}
window.DashboardView = DashboardView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DashboardView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/GeographyView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
function GeographyView({
  onOpenMove
}) {
  const {
    GeoConcentration,
    BarRows
  } = window.SSCharts;
  const {
    ViewHeader,
    Panel,
    Stat,
    Grounded
  } = window.SSUI;
  const {
    geo
  } = window.SS_DATA;
  const [radius, setRadius] = React.useState(5);
  // pct within radius grows with radius (diminishing) — illustrative
  const pctAt = r => Math.min(96, Math.round(58 + Math.log2(r + 1) * 14));
  const pct = radius === 5 ? geo.withinRadius : pctAt(radius);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Understand \xB7 Geography",
    title: "Where your demand actually lives",
    sub: "Your customers are far more concentrated than your ad spend assumes. That gap is money."
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "bullseye",
    onClick: () => onOpenMove("geo")
  }, "See the geo move")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.3fr 1fr",
      gap: 18,
      alignItems: "start",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Concentration around your stores",
    sub: "Each dot is a customer; clay markers are your two locations."
  }, /*#__PURE__*/React.createElement(GeoConcentration, {
    height: 320,
    pct: pct,
    radiusMiles: radius
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "14px 16px",
      background: "var(--surface-inset)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, "Radius"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 15,
      color: "var(--ss-blue-600)"
    }
  }, radius, " mi \xB7 ", pct, "% of customers")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "2",
    max: "25",
    value: radius,
    onChange: e => setRadius(+e.target.value),
    style: {
      width: "100%",
      accentColor: "var(--ss-blue-500)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 11,
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "2 mi"), /*#__PURE__*/React.createElement("span", null, "25 mi")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Within 5 miles",
    value: geo.withinRadius + "%",
    delta: "3,452 customers",
    deltaTone: "primary"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "National prospecting",
    value: "$6.1k",
    delta: "0.4% match",
    deltaTone: "danger",
    sub: "per month, mostly wasted"
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Customers by region"
  }, /*#__PURE__*/React.createElement(BarRows, {
    items: geo.regions.map(r => ({
      label: r.name,
      pct: r.pct,
      value: r.pct + "%",
      tone: r.tone
    }))
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 18,
    style: {
      background: "var(--ss-blue-50)",
      border: "1px solid var(--ss-blue-100)"
    }
  }, /*#__PURE__*/React.createElement(Grounded, {
    icon: "lightning-charge"
  }, "You're paying national rates for a local audience. Geo-fencing to 5 miles and turning on pickup is worth ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--ss-clay-600)"
    }
  }, "+$4\u20137k / mo"), ". ", /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenMove("geo"),
    style: {
      border: "none",
      background: "none",
      padding: 0,
      color: "var(--text-link)",
      fontWeight: 600,
      cursor: "pointer",
      font: "inherit"
    }
  }, "Open the move \u2192"))))));
}
window.GeographyView = GeographyView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/GeographyView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MonitoringView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
const alertTone = {
  danger: {
    bg: "var(--ss-danger-bg)",
    fg: "var(--ss-danger)"
  },
  warning: {
    bg: "var(--ss-warning-bg)",
    fg: "var(--ss-warning)"
  },
  success: {
    bg: "var(--ss-success-bg)",
    fg: "var(--ss-success)"
  },
  neutral: {
    bg: "var(--surface-soft)",
    fg: "var(--ss-ink-soft)"
  }
};
function MonitoringView({
  onOpenMove
}) {
  const {
    TrendLine,
    Ring
  } = window.SSCharts;
  const {
    ViewHeader,
    Panel,
    Stat,
    Grounded
  } = window.SSUI;
  const {
    monitoring
  } = window.SS_DATA;
  const [live, setLive] = React.useState(monitoring.pulse);
  // gently animate the "live" pulse numbers
  React.useEffect(() => {
    const t = setInterval(() => setLive(p => ({
      orders: p.orders + (Math.random() < 0.4 ? 1 : 0),
      revenue: p.revenue + Math.round(Math.random() * 120),
      sessions: p.sessions + Math.round(Math.random() * 8),
      conv: p.conv
    })), 2600);
    return () => clearInterval(t);
  }, []);
  const labels = ["12a", "4a", "8a", "12p", "4p", "8p", "now"];
  const sampled = [0, 4, 8, 12, 16, 20, 23].map(h => monitoring.sessions24h[h]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Operate \xB7 Monitoring",
    title: "Store health, live",
    sub: "The pulse of the store right now, with anything worth your attention pushed to the top."
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Live \xB7 all sources synced")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      gap: 18,
      alignItems: "start",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Ring, {
    score: monitoring.health,
    size: 120,
    stroke: 10,
    label: "HEALTH"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 16,
      marginTop: 12,
      color: "var(--text-strong)"
    }
  }, "Strong & steady"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      margin: "6px 0 0",
      lineHeight: 1.5
    }
  }, "No critical issues. One inventory alert needs a decision today.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Orders today",
    value: live.orders,
    delta: "live",
    deltaTone: "success"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Revenue today",
    value: "$" + live.revenue.toLocaleString(),
    delta: "live",
    deltaTone: "success"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Sessions",
    value: live.sessions.toLocaleString(),
    delta: "live",
    deltaTone: "primary"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Conversion",
    value: live.conv + "%",
    delta: "+0.1pt",
    deltaTone: "success"
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Sessions \xB7 last 24 hours",
    sub: "Hourly, across all traffic sources."
  }, /*#__PURE__*/React.createElement(TrendLine, {
    series: [sampled],
    labels: labels,
    height: 180,
    colors: ["var(--ss-chart-1)"]
  })))), /*#__PURE__*/React.createElement(Panel, {
    title: "Alert feed",
    sub: "Ranked by urgency. SimpleSense only surfaces what crosses a threshold.",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      icon: "sliders"
    }, "Thresholds")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 2
    }
  }, monitoring.alerts.map((a, i) => {
    const t = alertTone[a.tone];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 6px",
        borderTop: i ? "1px solid var(--border-hairline)" : "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "grid",
        placeItems: "center",
        width: 38,
        height: 38,
        flexShrink: 0,
        borderRadius: "var(--radius-sm)",
        background: t.bg,
        color: t.fg
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `bi bi-${a.icon}`,
      style: {
        fontSize: 17
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text-strong)"
      }
    }, a.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-muted)",
        marginTop: 2
      }
    }, a.source, " \xB7 ", a.time)), a.tone === "danger" && /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => onOpenMove("inventory")
    }, "Act"));
  }))));
}
window.MonitoringView = MonitoringView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MonitoringView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MoveDetailView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
function EvidenceViz({
  id
}) {
  const {
    ParetoChart,
    GeoConcentration,
    BarRows
  } = window.SSCharts;
  const {
    customers,
    geo,
    products
  } = window.SS_DATA;
  if (id === "geo") return /*#__PURE__*/React.createElement(GeoConcentration, {
    height: 300,
    pct: geo.withinRadius,
    radiusMiles: geo.radiusMiles
  });
  if (id === "pareto") return /*#__PURE__*/React.createElement(ParetoChart, {
    deciles: customers.paretoDeciles,
    height: 260
  });
  // inventory → days of cover for the 4 at-risk SKUs
  const atRisk = products.filter(p => p.risk === "danger").map(p => ({
    label: p.name,
    pct: Math.min(100, p.cover / 30 * 100),
    value: p.cover + "d",
    tone: "danger"
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      marginBottom: 14
    }
  }, "Days of inventory cover \xB7 reorder threshold 14d"), /*#__PURE__*/React.createElement(BarRows, {
    items: atRisk
  }));
}
function MoveDetailView({
  moveId,
  onBack,
  applied,
  onApply
}) {
  const {
    Ring
  } = window.SSCharts;
  const {
    Panel,
    SectionLabel,
    Grounded
  } = window.SSUI;
  const {
    moves
  } = window.SS_DATA;
  const m = moves.find(x => x.id === moveId) || moves[0];
  const [checks, setChecks] = React.useState({});
  const toggle = i => setChecks(c => ({
    ...c,
    [i]: !c[i]
  }));
  const doneCount = m.moves.filter((_, i) => checks[i]).length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      border: "none",
      background: "transparent",
      color: "var(--text-muted)",
      cursor: "pointer",
      fontSize: 13.5,
      fontWeight: 500,
      padding: 0,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-arrow-left"
  }), " Back to this week's moves"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 40,
      height: 40,
      borderRadius: "var(--radius-md)",
      background: "var(--ss-blue-500)",
      color: "#fff",
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 20,
      boxShadow: "var(--shadow-inset-glint)"
    }
  }, m.rank), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--accent)"
    }
  }, m.category)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 40,
      letterSpacing: "-0.02em",
      lineHeight: 1.08,
      margin: "0 0 22px",
      maxWidth: "20ch"
    }
  }, m.pattern), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 20,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "The evidence",
    sub: "Straight from your own numbers \u2014 no assumptions added."
  }, /*#__PURE__*/React.createElement(EvidenceViz, {
    id: m.id
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 16,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement(Grounded, {
    icon: "bar-chart-line"
  }, m.evidence))), /*#__PURE__*/React.createElement(Panel, {
    title: "Why this matters"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-body)"
    }
  }, m.why)), /*#__PURE__*/React.createElement(Panel, {
    title: "The move",
    sub: `${doneCount} of ${m.moves.length} steps done`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 2
    }
  }, m.moves.map((step, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => toggle(i),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: "13px 8px",
      border: "none",
      borderTop: i ? "1px solid var(--border-hairline)" : "none",
      background: "transparent",
      textAlign: "left",
      cursor: "pointer",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 24,
      height: 24,
      flexShrink: 0,
      borderRadius: "var(--radius-xs)",
      border: checks[i] ? "none" : "1.5px solid var(--border-strong)",
      background: checks[i] ? "var(--ss-success)" : "transparent",
      color: "#fff",
      transition: "all var(--dur-fast)"
    }
  }, checks[i] && /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2",
    style: {
      fontSize: 15
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      color: checks[i] ? "var(--text-muted)" : "var(--text-strong)",
      textDecoration: checks[i] ? "line-through" : "none"
    }
  }, step)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18,
      position: "sticky",
      top: 88
    }
  }, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      fontWeight: 500
    }
  }, "Expected impact"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 40,
      letterSpacing: "-0.02em",
      color: "var(--ss-clay-600)",
      lineHeight: 1.05,
      margin: "4px 0 6px"
    }
  }, m.impact), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginBottom: 18
    }
  }, "Ranged, not falsely precise. Modeled on your trailing-12-month figures."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 0",
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement(Ring, {
    score: m.confidencePct,
    size: 64,
    stroke: 6,
    color: "var(--ss-success)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, "Confidence"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, m.confidence))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "grid",
      gap: 10
    }
  }, applied ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "check2",
    style: {
      width: "100%"
    },
    disabled: true
  }, "Applied this move") : /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "lightning-charge",
    style: {
      width: "100%"
    },
    onClick: onApply
  }, "Apply this move"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "calendar-event",
    style: {
      width: "100%"
    }
  }, "Schedule for later"))), /*#__PURE__*/React.createElement(Panel, {
    title: "How we'd ship it"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, [{
    icon: "shopify",
    t: "Shopify Flow",
    d: "Automations created on apply"
  }, {
    icon: "envelope-paper",
    t: "Klaviyo",
    d: "Segment pushed automatically"
  }, {
    icon: "bullseye",
    t: "Meta & Google",
    d: "Audience + radius updated"
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 32,
      height: 32,
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-soft)",
      color: "var(--ss-blue-600)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${r.icon}`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, r.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, r.d)))))))));
}
window.MoveDetailView = MoveDetailView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MoveDetailView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Onboarding.jsx
try { (() => {
/* global React, window */
const SOURCES = [{
  id: "ga4",
  name: "Google Analytics 4",
  desc: "Sessions, funnels, attribution",
  icon: "graph-up",
  color: "#cd8420"
}, {
  id: "meta",
  name: "Meta Ads",
  desc: "Spend, CAC, campaigns",
  icon: "bullseye",
  color: "#0871e7"
}, {
  id: "klaviyo",
  name: "Klaviyo",
  desc: "Email & SMS, segments",
  icon: "envelope-paper",
  color: "#c25a3c"
}];
const READ_STAGES = ["Reading 18,402 orders…", "Mapping 6,204 customers…", "Aligning GA4 sessions & spend…", "Scoring product velocity…", "Finding the patterns that matter…"];
function Stepper({
  step
}) {
  const steps = ["Connect Shopify", "Add sources", "Read history", "Your audit"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 0,
      marginBottom: 40
    }
  }, steps.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 26,
      height: 26,
      borderRadius: "50%",
      flexShrink: 0,
      fontSize: 12.5,
      fontWeight: 700,
      fontFamily: "var(--font-ui-display)",
      background: i < step ? "var(--ss-success)" : i === step ? "var(--ss-blue-500)" : "var(--surface-soft)",
      color: i <= step ? "#fff" : "var(--text-muted)",
      boxShadow: i === step ? "var(--shadow-inset-glint)" : "none"
    }
  }, i < step ? /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2"
  }) : i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: i === step ? 600 : 500,
      color: i <= step ? "var(--text-strong)" : "var(--text-muted)",
      whiteSpace: "nowrap"
    }
  }, s)), i < steps.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1.5,
      margin: "0 12px",
      background: i < step ? "var(--ss-success)" : "var(--border-strong)",
      minWidth: 18
    }
  }))));
}
function Onboarding() {
  const {
    Button,
    Badge
  } = window.SimpleSenseDesignSystem_33cb4c;
  const [step, setStep] = React.useState(0);
  const [shopifyState, setShopifyState] = React.useState("idle"); // idle | connecting | done
  const [sources, setSources] = React.useState({});
  const [readPct, setReadPct] = React.useState(0);
  const [readStage, setReadStage] = React.useState(0);
  const connectShopify = () => {
    setShopifyState("connecting");
    setTimeout(() => {
      setShopifyState("done");
      setTimeout(() => setStep(1), 700);
    }, 2200);
  };
  const connectSource = id => {
    setSources(s => ({
      ...s,
      [id]: "connecting"
    }));
    setTimeout(() => setSources(s => ({
      ...s,
      [id]: "done"
    })), 1600);
  };

  // history-reading animation
  React.useEffect(() => {
    if (step !== 2) return;
    setReadPct(0);
    setReadStage(0);
    const t = setInterval(() => {
      setReadPct(p => {
        const next = Math.min(100, p + 2);
        setReadStage(Math.min(READ_STAGES.length - 1, Math.floor(next / 100 * READ_STAGES.length)));
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => setStep(3), 600);
        }
        return next;
      });
    }, 70);
    return () => clearInterval(t);
  }, [step]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px 0",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-sm)",
      background: "var(--ss-blue-500)",
      color: "#fff",
      fontFamily: "var(--font-display)",
      fontSize: 21,
      boxShadow: "var(--shadow-inset-glint)"
    }
  }, "S"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 23,
      letterSpacing: "-0.01em",
      color: "var(--text-strong)"
    }
  }, "SimpleSense")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 560,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(Stepper, {
    step: step
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-md)",
      padding: "38px 38px 34px"
    }
  }, step === 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "clay"
  }, "Step 1 \xB7 the only required one"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 38,
      letterSpacing: "-0.02em",
      lineHeight: 1.08,
      margin: "16px 0 10px"
    }
  }, "Let's read your store."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15.5,
      lineHeight: 1.6,
      color: "var(--text-body)",
      margin: "0 0 28px"
    }
  }, "Connect Shopify and SimpleSense reads your full order history \u2014 then tells you the three highest-ROI moves to make this week. No setup, no dashboards to build."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: 18,
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-hairline)",
      background: "var(--surface-inset)",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 48,
      height: 48,
      borderRadius: "var(--radius-md)",
      background: "color-mix(in srgb, #1f8a5b 12%, #fff)",
      color: "#1f8a5b",
      fontSize: 24
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-bag-check"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 16,
      color: "var(--text-strong)"
    }
  }, "Shopify"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "Orders, products, customers, inventory")), shopifyState === "done" && /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Connected")), shopifyState === "connecting" ? /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      width: "100%"
    },
    disabled: true
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-arrow-repeat",
    style: {
      marginRight: 8,
      animation: "ssSpin 0.9s linear infinite"
    }
  }), " Authorizing with Shopify\u2026") : /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    icon: "bag-check",
    style: {
      width: "100%"
    },
    onClick: connectShopify
  }, "Connect Shopify"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-shield-lock",
    style: {
      color: "var(--ss-blue-500)"
    }
  }), " Read-only. We never write to your store without you applying a move.")), step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "primary"
  }, "Step 2 \xB7 optional, but sharper"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 32,
      letterSpacing: "-0.02em",
      lineHeight: 1.13,
      margin: "16px 0 24px"
    }
  }, "The more it sees, the sharper the moves."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-body)",
      margin: "0 0 24px"
    }
  }, "Add the rest of your stack so SimpleSense can connect spend to revenue. You can always do this later."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12,
      marginBottom: 26
    }
  }, SOURCES.map(s => {
    const st = sources[s.id];
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-hairline)",
        background: "var(--surface-card)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "grid",
        placeItems: "center",
        width: 42,
        height: 42,
        borderRadius: "var(--radius-md)",
        background: `color-mix(in srgb, ${s.color} 12%, #fff)`,
        color: s.color,
        fontSize: 20
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `bi bi-${s.icon}`
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-ui-display)",
        fontWeight: 700,
        fontSize: 15,
        color: "var(--text-strong)"
      }
    }, s.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-muted)"
      }
    }, s.desc)), st === "done" ? /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Connected") : st === "connecting" ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--ss-warning)",
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "bi bi-arrow-repeat",
      style: {
        marginRight: 6,
        animation: "ssSpin 0.9s linear infinite"
      }
    }), "Connecting") : /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => connectSource(s.id)
    }, "Connect"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: "arrow-right",
    style: {
      flex: 1
    },
    onClick: () => setStep(2)
  }, "Read my history"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg",
    onClick: () => setStep(2)
  }, "Skip"))), step === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 96,
      height: 96,
      margin: "0 auto 24px"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "96",
    height: "96",
    viewBox: "0 0 96 96"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "48",
    cy: "48",
    r: "42",
    fill: "none",
    stroke: "var(--surface-soft)",
    strokeWidth: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "48",
    cy: "48",
    r: "42",
    fill: "none",
    stroke: "var(--ss-blue-500)",
    strokeWidth: "6",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 42,
    strokeDashoffset: 2 * Math.PI * 42 * (1 - readPct / 100),
    transform: "rotate(-90 48 48)",
    style: {
      transition: "stroke-dashoffset 0.1s linear"
    }
  }), /*#__PURE__*/React.createElement("text", {
    x: "48",
    y: "54",
    textAnchor: "middle",
    fontFamily: "var(--font-display)",
    fontSize: "26",
    fill: "var(--text-strong)"
  }, readPct))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 32,
      letterSpacing: "-0.02em",
      margin: "0 0 10px"
    }
  }, "Reading 3.2 years of history"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: "var(--text-body)",
      margin: "0 0 4px",
      minHeight: 24,
      transition: "opacity 0.2s"
    }
  }, READ_STAGES[readStage]), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      margin: "8px 0 0"
    }
  }, "This usually takes under a minute. Hang tight.")), step === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 60,
      height: 60,
      margin: "0 auto 18px",
      borderRadius: "50%",
      background: "var(--ss-success-bg)",
      color: "var(--ss-success)",
      fontSize: 30
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-check2"
  })), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "Audit complete"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 36,
      letterSpacing: "-0.02em",
      lineHeight: 1.14,
      margin: "14px auto 14px",
      maxWidth: "15ch"
    }
  }, "We found 3 moves worth ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "var(--ss-clay-500)"
    }
  }, "$72k a month.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-body)",
      margin: "0 0 26px",
      maxWidth: "44ch",
      marginInline: "auto"
    }
  }, "Your demand is local, your best customers are under-served, and four heroes are about to run dry. Here's your first week."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 12,
      marginBottom: 28
    }
  }, [{
    n: "82%",
    l: "local customers"
  }, {
    n: "71%",
    l: "rev from top 20%"
  }, {
    n: "11d",
    l: "to stockout"
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.l,
    style: {
      padding: "14px 8px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-inset)",
      border: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 26,
      color: "var(--text-strong)"
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-muted)"
    }
  }, s.l)))), /*#__PURE__*/React.createElement("a", {
    href: "index.html",
    style: {
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: "arrow-right",
    style: {
      width: "100%"
    }
  }, "Enter SimpleSense")))), step === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 22,
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, "Already connected? ", /*#__PURE__*/React.createElement("a", {
    href: "index.html",
    style: {
      color: "var(--text-link)",
      textDecoration: "none",
      fontWeight: 600
    }
  }, "Go to your moves \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      width: "100%",
      height: 120,
      backgroundImage: "url(../../assets/img/footer-blossom.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center 30%",
      opacity: 0.5,
      maskImage: "linear-gradient(to bottom, transparent, #000)",
      WebkitMaskImage: "linear-gradient(to bottom, transparent, #000)"
    }
  }), /*#__PURE__*/React.createElement("style", null, `@keyframes ssSpin { to { transform: rotate(360deg) } }`));
}
function mountOnboarding() {
  const ns = window.SimpleSenseDesignSystem_33cb4c;
  if (!ns || !ns.Button || !ns.Badge) {
    setTimeout(mountOnboarding, 30);
    return;
  }
  const obRoot = document.getElementById("root");
  if (!window.__obRoot) window.__obRoot = ReactDOM.createRoot(obRoot);
  window.__obRoot.render(/*#__PURE__*/React.createElement(Onboarding, null));
  let tries = 0;
  (function verify() {
    if (obRoot.children.length > 0 || tries++ > 60) return;
    window.__obRoot.render(/*#__PURE__*/React.createElement(Onboarding, null));
    setTimeout(verify, 50);
  })();
}
mountOnboarding();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProductsView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button
} = window.SimpleSenseDesignSystem_33cb4c;
const riskMeta = {
  danger: {
    tone: "danger",
    label: "Reorder now"
  },
  watch: {
    tone: "warning",
    label: "Watch"
  },
  ok: {
    tone: "success",
    label: "Healthy"
  }
};
function ProductsView({
  onOpenMove
}) {
  const {
    ViewHeader,
    Panel,
    Stat,
    Grounded,
    SegToggle
  } = window.SSUI;
  const {
    products
  } = window.SS_DATA;
  const [filter, setFilter] = React.useState("all");
  const [reordered, setReordered] = React.useState({});
  const rows = products.filter(p => filter === "all" ? true : filter === "risk" ? p.risk === "danger" : p.risk === "ok" || p.risk === "watch");
  const atRisk = products.filter(p => p.risk === "danger");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Understand \xB7 Products",
    title: "SKU economics",
    sub: "Margin, velocity and inventory risk for every product \u2014 so a peak-week stockout never surprises you."
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "download"
  }, "Export CSV")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Active SKUs",
    value: "184",
    sub: "across 12 collections"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Avg margin",
    value: "61%",
    delta: "+2pt",
    deltaTone: "success"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "At-risk SKUs",
    value: atRisk.length,
    delta: "~11 days cover",
    deltaTone: "danger"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Revenue at risk",
    value: "$18k",
    delta: "hero SKUs",
    deltaTone: "clay"
  }))), atRisk.length > 0 && /*#__PURE__*/React.createElement(Panel, {
    padding: 18,
    style: {
      marginBottom: 18,
      background: "var(--ss-danger-bg)",
      border: "1px solid color-mix(in srgb, var(--ss-danger) 30%, transparent)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-exclamation-triangle-fill",
    style: {
      fontSize: 22,
      color: "var(--ss-danger)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 16,
      color: "var(--text-strong)"
    }
  }, "4 hero SKUs stock out in ~11 days"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-body)"
    }
  }, "They carry 28% of revenue. Lead time is 18 days \u2014 reorder today.")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "lightning-charge",
    onClick: () => onOpenMove("inventory")
  }, "Open inventory move"))), /*#__PURE__*/React.createElement(Panel, {
    title: "All products",
    right: /*#__PURE__*/React.createElement(SegToggle, {
      size: "sm",
      value: filter,
      onChange: setFilter,
      options: [{
        id: "all",
        label: "All"
      }, {
        id: "risk",
        label: "At risk"
      }, {
        id: "healthy",
        label: "Healthy"
      }]
    }),
    padding: 0,
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      textAlign: "left",
      color: "var(--text-muted)",
      fontSize: 11.5,
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 22px",
      fontWeight: 600
    }
  }, "Product"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 14px",
      fontWeight: 600,
      textAlign: "right"
    }
  }, "Price"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 14px",
      fontWeight: 600,
      textAlign: "right"
    }
  }, "Margin"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 14px",
      fontWeight: 600,
      textAlign: "right"
    }
  }, "Units / day"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 14px",
      fontWeight: 600
    }
  }, "Days of cover"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 14px",
      fontWeight: 600,
      textAlign: "right"
    }
  }, "Rev share"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "12px 22px",
      fontWeight: 600
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((p, i) => {
    const rm = riskMeta[p.risk];
    const coverPct = Math.min(100, p.cover / 40 * 100);
    const coverCol = p.cover <= 14 ? "var(--ss-danger)" : p.cover <= 30 ? "var(--ss-warning)" : "var(--ss-success)";
    return /*#__PURE__*/React.createElement("tr", {
      key: p.sku,
      style: {
        borderTop: "1px solid var(--border-hairline)"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 22px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        color: "var(--text-strong)"
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-muted)"
      }
    }, p.sku)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 14px",
        textAlign: "right",
        fontFamily: "var(--font-ui-display)",
        fontWeight: 600
      }
    }, "$", p.price), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 14px",
        textAlign: "right",
        color: p.margin >= 60 ? "var(--ss-success)" : "var(--text-body)",
        fontWeight: 600
      }
    }, p.margin, "%"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 14px",
        textAlign: "right",
        fontFamily: "var(--font-ui-display)",
        fontWeight: 600
      }
    }, p.velocity), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 14px",
        minWidth: 130
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: "var(--surface-soft)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${coverPct}%`,
        height: "100%",
        background: coverCol,
        borderRadius: 3
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: coverCol,
        minWidth: 30
      }
    }, p.cover, "d"))), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 14px",
        textAlign: "right",
        color: "var(--text-muted)"
      }
    }, p.revShare, "%"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "13px 22px",
        textAlign: "right"
      }
    }, p.risk === "danger" ? reordered[p.sku] ? /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Reordered") : /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => setReordered(r => ({
        ...r,
        [p.sku]: true
      }))
    }, "Reorder") : /*#__PURE__*/React.createElement(Badge, {
      tone: rm.tone
    }, rm.label)));
  }))))));
}
window.ProductsView = ProductsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProductsView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/SettingsView.jsx
try { (() => {
/* global React, window */
const {
  Badge,
  Button,
  Avatar,
  Input
} = window.SimpleSenseDesignSystem_33cb4c;
function Toggle({
  on,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange(!on),
    "aria-pressed": on,
    style: {
      width: 42,
      height: 24,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 2,
      flexShrink: 0,
      background: on ? "var(--ss-blue-500)" : "var(--border-strong)",
      transition: "background var(--dur-fast)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "var(--shadow-xs)",
      transform: on ? "translateX(18px)" : "translateX(0)",
      transition: "transform var(--dur-fast) var(--ease-out)"
    }
  }));
}
function Row({
  title,
  desc,
  children,
  first
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "16px 0",
      borderTop: first ? "none" : "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, title), desc && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, desc)), children);
}
function SettingsView() {
  const {
    ViewHeader,
    Panel,
    SegToggle
  } = window.SSUI;
  const {
    store,
    team
  } = window.SS_DATA;
  const [tab, setTab] = React.useState("account");
  const [prefs, setPrefs] = React.useState({
    digest: true,
    alerts: true,
    weekly: true,
    sms: false,
    autoApply: false
  });
  const [day, setDay] = React.useState("monday");
  const set = k => v => setPrefs(p => ({
    ...p,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ViewHeader, {
    eyebrow: "Account \xB7 Settings",
    title: "Settings",
    sub: "Your store, your team, and how SimpleSense talks to you."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(SegToggle, {
    value: tab,
    onChange: setTab,
    options: [{
      id: "account",
      label: "Account",
      icon: "shop"
    }, {
      id: "team",
      label: "Team",
      icon: "people"
    }, {
      id: "digest",
      label: "Digest & alerts",
      icon: "bell"
    }]
  })), tab === "account" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      alignItems: "start",
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Store profile"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Store name",
    defaultValue: store.name
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Category",
    defaultValue: store.category
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-strong)",
      marginBottom: 7
    }
  }, "Locations"), store.locations.map(l => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontSize: 13.5,
      color: "var(--text-body)",
      padding: "7px 0"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-geo-alt",
    style: {
      color: "var(--ss-clay-500)"
    }
  }), l))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    style: {
      justifySelf: "start"
    }
  }, "Save changes"))), /*#__PURE__*/React.createElement(Panel, {
    title: "Plan"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      color: "var(--text-strong)"
    }
  }, "Pro"), /*#__PURE__*/React.createElement(Badge, {
    tone: "primary"
  }, "Current")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      lineHeight: 1.6,
      marginBottom: 16
    }
  }, "All sources, weekly moves, unlimited history, priority support. Renews Jul 22, 2026."), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: "arrow-right"
  }, "Manage plan & billing"))), tab === "team" && /*#__PURE__*/React.createElement(Panel, {
    title: "Team members",
    sub: "Owners and operators can apply moves; viewers see read-only.",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      icon: "person-plus"
    }, "Invite"),
    style: {
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid"
    }
  }, team.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.email,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: "13px 0",
      borderTop: i ? "1px solid var(--border-hairline)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, m.name, " ", m.you && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      fontWeight: 400
    }
  }, "\xB7 you")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, m.email)), /*#__PURE__*/React.createElement(Badge, {
    tone: m.role === "Owner" ? "primary" : m.role === "Operator" ? "success" : "neutral"
  }, m.role))))), tab === "digest" && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Weekly digest",
    sub: "Your ranked moves, delivered."
  }, /*#__PURE__*/React.createElement(Row, {
    first: true,
    title: "Send the Monday digest",
    desc: "The week's ranked moves by email."
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: prefs.digest,
    onChange: set("digest")
  })), /*#__PURE__*/React.createElement(Row, {
    title: "Delivery day"
  }, /*#__PURE__*/React.createElement(SegToggle, {
    size: "sm",
    value: day,
    onChange: setDay,
    options: [{
      id: "monday",
      label: "Mon"
    }, {
      id: "wednesday",
      label: "Wed"
    }, {
      id: "friday",
      label: "Fri"
    }]
  })), /*#__PURE__*/React.createElement(Row, {
    title: "Weekly summary recap",
    desc: "A Friday note on what moved after applied moves."
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: prefs.weekly,
    onChange: set("weekly")
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Alerts",
    sub: "Real-time, only when something crosses a threshold."
  }, /*#__PURE__*/React.createElement(Row, {
    first: true,
    title: "Critical alerts",
    desc: "Stockouts, conversion drops, CAC spikes."
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: prefs.alerts,
    onChange: set("alerts")
  })), /*#__PURE__*/React.createElement(Row, {
    title: "SMS for critical only",
    desc: "Text me when revenue is genuinely at risk."
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: prefs.sms,
    onChange: set("sms")
  })), /*#__PURE__*/React.createElement(Row, {
    title: "Auto-apply high-confidence moves",
    desc: "Let SimpleSense ship moves above 95% confidence."
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: prefs.autoApply,
    onChange: set("autoApply")
  })))));
}
window.SettingsView = SettingsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/SettingsView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Sidebar.jsx
try { (() => {
/* global React */
const {
  Avatar
} = window.SimpleSenseDesignSystem_33cb4c;
const NAV = [{
  group: "Operate",
  items: [{
    id: "dashboard",
    label: "This week's moves",
    icon: "compass",
    badge: "3"
  }, {
    id: "audit",
    label: "Store audit",
    icon: "clipboard-data"
  }, {
    id: "monitor",
    label: "Monitoring",
    icon: "activity"
  }]
}, {
  group: "Understand",
  items: [{
    id: "customers",
    label: "Customers",
    icon: "people"
  }, {
    id: "geo",
    label: "Geography",
    icon: "geo-alt"
  }, {
    id: "products",
    label: "Products",
    icon: "box-seam"
  }]
}, {
  group: "Account",
  items: [{
    id: "connections",
    label: "Connections",
    icon: "plug"
  }, {
    id: "billing",
    label: "Plans & billing",
    icon: "credit-card"
  }, {
    id: "settings",
    label: "Settings",
    icon: "gear"
  }]
}];
function Sidebar({
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "fixed",
      inset: "0 auto 0 0",
      width: "var(--sidebar-width)",
      background: "var(--surface-card)",
      borderRight: "1px solid var(--border-hairline)",
      display: "flex",
      flexDirection: "column",
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 20px 16px",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 32,
      height: 32,
      borderRadius: "var(--radius-sm)",
      background: "var(--ss-blue-500)",
      color: "#fff",
      fontFamily: "var(--font-display)",
      fontSize: 20,
      boxShadow: "var(--shadow-inset-glint)"
    }
  }, "S"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      letterSpacing: "-0.01em",
      color: "var(--text-strong)"
    }
  }, "SimpleSense")), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: 12,
      overflowY: "auto",
      flex: 1
    }
  }, NAV.map(sec => /*#__PURE__*/React.createElement("div", {
    key: sec.group,
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      padding: "0 10px 8px"
    }
  }, sec.group), sec.items.map(it => {
    const on = active === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onSelect(it.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        textAlign: "left",
        padding: "9px 10px",
        margin: "2px 0",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        background: on ? "var(--ss-blue-50)" : "transparent",
        color: on ? "var(--ss-blue-700)" : "var(--ss-ink-soft)",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: on ? 600 : 500,
        transition: "background var(--dur-fast)"
      },
      onMouseEnter: e => {
        if (!on) e.currentTarget.style.background = "var(--surface-soft)";
      },
      onMouseLeave: e => {
        if (!on) e.currentTarget.style.background = "transparent";
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `bi bi-${it.icon}`,
      style: {
        fontSize: 16,
        color: on ? "var(--ss-blue-500)" : "var(--text-muted)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        background: "var(--ss-clay-500)",
        borderRadius: "var(--radius-pill)",
        padding: "1px 7px"
      }
    }, it.badge) : null);
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderTop: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Maple Oak",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-strong)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Maple & Oak Goods"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-muted)"
    }
  }, "Pro \xB7 Shopify")), /*#__PURE__*/React.createElement("i", {
    className: "bi bi-chevron-expand",
    style: {
      color: "var(--text-muted)"
    }
  })));
}
window.Sidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/appData.jsx
try { (() => {
/* global window */
/* ============================================================
   SimpleSense — shared demo data model.
   One coherent store ("Maple & Oak Goods") that every view reads
   from, so the app feels like a single real account. Exposed on
   window.SS_DATA. For the Claude Code handoff this is the explicit
   data contract behind the screens.
   ============================================================ */

const store = {
  name: "Maple & Oak Goods",
  plan: "Pro",
  platform: "Shopify",
  category: "Home & Lifestyle",
  locations: ["Portland, OR — Pearl District", "Portland, OR — Hawthorne"],
  history: "3.2 years",
  sources: ["Shopify", "GA4", "Meta Ads", "Klaviyo"]
};

// The three signature moves (Pattern → Why → Move → Impact), enriched for deep-dives.
const moves = [{
  rank: 1,
  id: "geo",
  category: "Geographic concentration",
  pattern: "82% of your customers live within 5 miles of your two stores.",
  why: "You're paying national ad rates to reach an audience that is effectively local — and never offering them pickup.",
  moves: ["Geo-fence Meta & Google to a 5-mile radius", "Turn on local pickup (BOPIS) via Shopify Flow", "Shift budget from national spray to local high-intent"],
  impact: "+$4–7k / mo",
  impactLow: 4000,
  impactHigh: 7000,
  confidence: "Grounded in 3.2 yrs of order data",
  confidencePct: 92,
  evidence: "Of 4,210 customers with a deliverable address, 3,452 sit inside the 5-mile ring around your two stores. National prospecting spend is $6.1k/mo against a 0.4% match rate."
}, {
  rank: 2,
  id: "pareto",
  category: "Pareto customer economics",
  pattern: "Your top 20% of customers drive 71% of revenue — most came from one channel.",
  why: "These buyers are under-served. There's no VIP path, and the channel that produced them is under-funded.",
  moves: ["Build the top-20% Klaviyo segment (auto-defined)", "Launch a VIP flow: early access + private sales", "Double down on the channel that produced them"],
  impact: "+$3–5k / mo",
  impactLow: 3000,
  impactHigh: 5000,
  confidence: "1,240 customers in segment",
  confidencePct: 88,
  evidence: "1,240 customers (the top quintile) generated $612k of your $862k trailing-12-mo revenue. 64% were first acquired through Klaviyo-driven email, your lowest-spend channel."
}, {
  rank: 3,
  id: "inventory",
  category: "Inventory risk",
  pattern: "Four hero SKUs will stock out in ~11 days at the current sell-through.",
  why: "These four products carry 28% of revenue. A stockout during your peak week is the most expensive thing on this list.",
  moves: ["Reorder the 4 flagged SKUs today", "Pause paid traffic pointing at at-risk variants", "Set a low-stock Flow alert at 14 days of cover"],
  impact: "Protects ~$18k",
  impactLow: 18000,
  impactHigh: 18000,
  confidence: "Velocity from last 90 days",
  confidencePct: 95,
  evidence: "Wool Throw — Oat, Ceramic Mug Set, Linen Apron and Beeswax Candle x6 sell a combined 47 units/day with 512 units on hand: 10.9 days of cover. Lead time is 18 days."
}];

// KPI tiles for the dashboard.
const kpis = [{
  label: "Conversion rate",
  value: "1.8%",
  delta: "+0.4pt",
  deltaTone: "success",
  icon: "graph-up-arrow",
  spark: [1.2, 1.3, 1.25, 1.4, 1.5, 1.55, 1.7, 1.8]
}, {
  label: "Repeat revenue",
  value: "38%",
  delta: "+5pt",
  deltaTone: "success",
  icon: "arrow-repeat",
  spark: [30, 31, 33, 32, 34, 36, 37, 38]
}, {
  label: "Est. lift on table",
  value: "$72k",
  delta: "3 moves",
  deltaTone: "clay",
  icon: "lightning-charge",
  spark: [40, 48, 52, 55, 60, 66, 70, 72]
}, {
  label: "Refund rate",
  value: "3.1%",
  delta: "Watch",
  deltaTone: "warning",
  icon: "arrow-counterclockwise",
  spark: [2.4, 2.5, 2.6, 2.7, 2.9, 3.0, 3.0, 3.1]
}];

// Customers — Pareto deciles (share of revenue per customer decile) + cohort retention.
const customers = {
  total: 6204,
  vip: 1240,
  avgLtv: 139,
  vipLtv: 494,
  // revenue share by decile (top decile first)
  paretoDeciles: [41, 17, 13, 9, 7, 5, 4, 2, 1.4, 0.6],
  // cohort retention heatmap: rows = acquisition month, cols = months since (0..5)
  cohorts: [{
    label: "Jan",
    row: [100, 47, 38, 33, 30, 28]
  }, {
    label: "Feb",
    row: [100, 44, 36, 31, 28, 26]
  }, {
    label: "Mar",
    row: [100, 51, 42, 37, 34, 31]
  }, {
    label: "Apr",
    row: [100, 49, 40, 35, 32, null]
  }, {
    label: "May",
    row: [100, 52, 43, 38, null, null]
  }, {
    label: "Jun",
    row: [100, 55, 46, null, null, null]
  }],
  segments: [{
    name: "VIP — top 20%",
    count: 1240,
    rev: 71,
    ltv: 494,
    tone: "primary"
  }, {
    name: "Loyal repeat",
    count: 1612,
    rev: 18,
    ltv: 168,
    tone: "success"
  }, {
    name: "One-time",
    count: 2890,
    rev: 9,
    ltv: 58,
    tone: "neutral"
  }, {
    name: "At-risk lapsing",
    count: 462,
    rev: 2,
    ltv: 121,
    tone: "warning"
  }]
};

// Geography — concentration around the two stores.
const geo = {
  withinRadius: 82,
  radiusMiles: 5,
  localCustomers: 3452,
  nationalSpend: 6100,
  regions: [{
    name: "Portland metro",
    pct: 82,
    customers: 3452,
    tone: "primary"
  }, {
    name: "Salem / Eugene",
    pct: 7,
    customers: 295,
    tone: "success"
  }, {
    name: "Seattle / Tacoma",
    pct: 5,
    customers: 210,
    tone: "neutral"
  }, {
    name: "Bay Area",
    pct: 3,
    customers: 126,
    tone: "neutral"
  }, {
    name: "Rest of US",
    pct: 3,
    customers: 127,
    tone: "neutral"
  }]
};

// Products — SKU economics & inventory risk.
const products = [{
  name: "Wool Throw — Oat",
  sku: "WT-OAT",
  price: 128,
  margin: 61,
  velocity: 14,
  stock: 142,
  cover: 10,
  revShare: 9,
  risk: "danger"
}, {
  name: "Ceramic Mug Set (4)",
  sku: "CM-S4",
  price: 64,
  margin: 58,
  velocity: 19,
  stock: 168,
  cover: 9,
  revShare: 8,
  risk: "danger"
}, {
  name: "Linen Apron",
  sku: "LN-APR",
  price: 48,
  margin: 66,
  velocity: 9,
  stock: 96,
  cover: 11,
  revShare: 6,
  risk: "danger"
}, {
  name: "Beeswax Candle x6",
  sku: "BW-C6",
  price: 42,
  margin: 72,
  velocity: 12,
  stock: 106,
  cover: 9,
  revShare: 5,
  risk: "danger"
}, {
  name: "Cutting Board — Walnut",
  sku: "CB-WAL",
  price: 89,
  margin: 54,
  velocity: 6,
  stock: 410,
  cover: 68,
  revShare: 7,
  risk: "ok"
}, {
  name: "Cotton Throw Pillow",
  sku: "CT-PIL",
  price: 38,
  margin: 63,
  velocity: 8,
  stock: 520,
  cover: 65,
  revShare: 4,
  risk: "ok"
}, {
  name: "Stoneware Bowl Set",
  sku: "SW-BWL",
  price: 72,
  margin: 56,
  velocity: 5,
  stock: 288,
  cover: 58,
  revShare: 4,
  risk: "ok"
}, {
  name: "Hand Towel — Pair",
  sku: "HT-PR",
  price: 24,
  margin: 68,
  velocity: 11,
  stock: 640,
  cover: 58,
  revShare: 3,
  risk: "watch"
}];

// Monitoring — live store health + alert feed.
const monitoring = {
  health: 94,
  pulse: {
    orders: 38,
    revenue: 4820,
    sessions: 1294,
    conv: 1.9
  },
  // last 24h hourly sessions (sparkline)
  sessions24h: [22, 18, 14, 11, 9, 8, 12, 26, 41, 58, 67, 72, 78, 81, 76, 70, 66, 71, 84, 92, 88, 74, 55, 38],
  alerts: [{
    tone: "danger",
    icon: "exclamation-triangle",
    title: "Wool Throw — Oat dips below 14 days of cover",
    time: "12 min ago",
    source: "Inventory"
  }, {
    tone: "warning",
    icon: "graph-down-arrow",
    title: "Mobile checkout drop-off up 6pt week-over-week",
    time: "1 hr ago",
    source: "GA4"
  }, {
    tone: "success",
    icon: "check-circle",
    title: "Meta CAC fell to $19.40 — below your $24 target",
    time: "3 hrs ago",
    source: "Meta Ads"
  }, {
    tone: "neutral",
    icon: "arrow-repeat",
    title: "Klaviyo synced 1,240-customer VIP segment",
    time: "5 hrs ago",
    source: "Klaviyo"
  }, {
    tone: "warning",
    icon: "cash-stack",
    title: "Refund rate ticked to 3.1% — watch, not yet flagged",
    time: "8 hrs ago",
    source: "Shopify"
  }]
};

// Connections — data sources.
const connections = [{
  id: "shopify",
  name: "Shopify",
  desc: "Orders, products, customers, inventory",
  status: "connected",
  since: "Mar 2023",
  icon: "bag-check",
  records: "18,402 orders",
  color: "#1f8a5b"
}, {
  id: "ga4",
  name: "Google Analytics 4",
  desc: "Sessions, funnels, attribution",
  status: "connected",
  since: "Mar 2023",
  icon: "graph-up",
  records: "3.1M events",
  color: "#cd8420"
}, {
  id: "meta",
  name: "Meta Ads",
  desc: "Spend, CAC, campaign performance",
  status: "connected",
  since: "Apr 2023",
  icon: "bullseye",
  records: "$74k spend",
  color: "#0871e7"
}, {
  id: "klaviyo",
  name: "Klaviyo",
  desc: "Email & SMS flows, segments",
  status: "connected",
  since: "May 2023",
  icon: "envelope-paper",
  records: "42 flows",
  color: "#c25a3c"
}, {
  id: "gads",
  name: "Google Ads",
  desc: "Search & shopping spend",
  status: "available",
  since: null,
  icon: "google",
  records: null,
  color: "#0871e7"
}, {
  id: "tiktok",
  name: "TikTok Ads",
  desc: "Spend & conversions",
  status: "available",
  since: null,
  icon: "tiktok",
  records: null,
  color: "#211c15"
}];

// Team for settings.
const team = [{
  name: "Maple Oak",
  email: "maple@mapleoak.co",
  role: "Owner",
  you: true
}, {
  name: "Devin Park",
  email: "devin@mapleoak.co",
  role: "Operator"
}, {
  name: "Sam Reyes",
  email: "sam@mapleoak.co",
  role: "Viewer"
}];
window.SS_DATA = {
  store,
  moves,
  kpis,
  customers,
  geo,
  products,
  monitoring,
  connections,
  team
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/appData.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/charts.jsx
try { (() => {
/* global React, window */
/* ============================================================
   SimpleSense — chart primitives (warm, calm data-viz).
   Pure SVG, no deps. Colors come from the data-viz tokens.
   Exposed on window.SSCharts.
   ============================================================ */

const C = {
  blue: "var(--ss-chart-1)",
  green: "var(--ss-chart-2)",
  amber: "var(--ss-chart-3)",
  clay: "var(--ss-chart-4)",
  plum: "var(--ss-chart-5)",
  grid: "var(--border-hairline)",
  soft: "var(--surface-soft)",
  ink: "var(--text-strong)",
  muted: "var(--text-muted)"
};

/* Small inline sparkline — area + line. */
function Sparkline({
  data = [],
  color = C.blue,
  width = 120,
  height = 34,
  fill = true
}) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [i / (data.length - 1) * width, height - 3 - (d - min) / span * (height - 6)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = "sp" + Math.random().toString(36).slice(2, 7);
  return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: "block"
    }
  }, fill && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.18"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${gid})`
  })), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}

/* Larger line chart with baseline grid + optional second series. */
function TrendLine({
  series = [],
  labels = [],
  height = 220,
  colors = [C.blue, C.clay],
  format = v => v
}) {
  const W = 720,
    pad = {
      l: 38,
      r: 14,
      t: 14,
      b: 26
    };
  const all = series.flat();
  const max = Math.max(...all) * 1.08,
    min = Math.min(0, ...all);
  const span = max - min || 1;
  const x = (i, n) => pad.l + i / (n - 1) * (W - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const ticks = 4;
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${W} ${height}`,
    style: {
      display: "block"
    }
  }, Array.from({
    length: ticks + 1
  }).map((_, i) => {
    const v = min + span * i / ticks,
      yy = y(v);
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("line", {
      x1: pad.l,
      y1: yy,
      x2: W - pad.r,
      y2: yy,
      stroke: C.grid,
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("text", {
      x: pad.l - 8,
      y: yy + 3.5,
      textAnchor: "end",
      fontSize: "11",
      fill: C.muted,
      fontFamily: "var(--font-sans)"
    }, format(Math.round(v))));
  }), labels.map((lb, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: x(i, labels.length),
    y: height - 8,
    textAnchor: "middle",
    fontSize: "11",
    fill: C.muted,
    fontFamily: "var(--font-sans)"
  }, lb)), series.map((s, si) => {
    const d = s.map((v, i) => `${i ? "L" : "M"}${x(i, s.length).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return /*#__PURE__*/React.createElement("g", {
      key: si
    }, /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: colors[si],
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }), s.map((v, i) => /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x(i, s.length),
      cy: y(v),
      r: "3",
      fill: "var(--surface-card)",
      stroke: colors[si],
      strokeWidth: "2"
    })));
  }));
}

/* Pareto chart — revenue bars per decile + cumulative % line. */
function ParetoChart({
  deciles = [],
  height = 260
}) {
  const W = 720,
    pad = {
      l: 40,
      r: 40,
      t: 18,
      b: 34
    };
  const n = deciles.length;
  const max = Math.max(...deciles) * 1.1;
  const bw = (W - pad.l - pad.r) / n;
  let cum = 0;
  const cumPts = [];
  deciles.forEach((d, i) => {
    cum += d;
    cumPts.push([pad.l + bw * i + bw / 2, pad.t + (1 - cum / 100) * (height - pad.t - pad.b)]);
  });
  const y = v => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const line = cumPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  // highlight where cumulative crosses ~71 (top 2 deciles)
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${W} ${height}`,
    style: {
      display: "block"
    }
  }, [0, 25, 50, 75, 100].map(t => {
    const yy = pad.t + (1 - t / 100) * (height - pad.t - pad.b);
    return /*#__PURE__*/React.createElement("line", {
      key: t,
      x1: pad.l,
      y1: yy,
      x2: W - pad.r,
      y2: yy,
      stroke: C.grid,
      strokeWidth: "1"
    });
  }), deciles.map((d, i) => {
    const h = d / max * (height - pad.t - pad.b);
    const hot = i < 2;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: pad.l + bw * i + bw * 0.16,
      y: y(d),
      width: bw * 0.68,
      height: h,
      rx: "3",
      fill: hot ? C.blue : C.soft
    }), /*#__PURE__*/React.createElement("text", {
      x: pad.l + bw * i + bw / 2,
      y: height - 12,
      textAnchor: "middle",
      fontSize: "10",
      fill: C.muted,
      fontFamily: "var(--font-sans)"
    }, i + 1, "0%"));
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: C.clay,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), cumPts.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p[0],
    cy: p[1],
    r: "3.2",
    fill: "var(--surface-card)",
    stroke: C.clay,
    strokeWidth: "2"
  })), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: cumPts[1][0],
    y1: cumPts[1][1],
    x2: cumPts[1][0],
    y2: pad.t,
    stroke: C.clay,
    strokeWidth: "1",
    strokeDasharray: "3 3",
    opacity: "0.6"
  }), /*#__PURE__*/React.createElement("text", {
    x: cumPts[1][0] + 6,
    y: pad.t + 12,
    fontSize: "12",
    fill: C.clay,
    fontWeight: "700",
    fontFamily: "var(--font-sans)"
  }, "71% of revenue")));
}

/* Cohort retention heatmap. rows: [{label, row:[..]}] values 0-100 or null. */
function CohortHeatmap({
  rows = [],
  cols = ["M0", "M1", "M2", "M3", "M4", "M5"]
}) {
  const cell = v => {
    if (v == null) return {
      bg: "transparent",
      fg: "transparent",
      txt: ""
    };
    const t = v / 100;
    // blend cream → blue by intensity
    const bg = `color-mix(in srgb, var(--ss-blue-500) ${Math.round(8 + t * 78)}%, var(--surface-card))`;
    const fg = t > 0.42 ? "#fff" : "var(--text-body)";
    return {
      bg,
      fg,
      txt: v + "%"
    };
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `48px repeat(${cols.length}, 1fr)`,
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("div", null), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      textAlign: "center",
      fontSize: 11,
      color: C.muted,
      fontWeight: 600,
      paddingBottom: 2
    }
  }, c)), rows.map(r => /*#__PURE__*/React.createElement(React.Fragment, {
    key: r.label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      fontSize: 12,
      color: C.muted,
      fontWeight: 600
    }
  }, r.label), r.row.map((v, i) => {
    const s = cell(v);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        height: 34,
        borderRadius: 6,
        background: s.bg,
        color: s.fg,
        display: "grid",
        placeItems: "center",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "var(--font-ui-display)",
        border: v == null ? "1px dashed var(--border-hairline)" : "none"
      }
    }, s.txt);
  }))));
}

/* Horizontal bar rows for rankings/distributions. items: [{label, pct, value, tone}] */
function BarRows({
  items = [],
  showValue = true
}) {
  const tones = {
    primary: C.blue,
    success: C.green,
    warning: C.amber,
    danger: C.clay,
    neutral: "var(--ss-ink-soft)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.label,
    style: {
      display: "grid",
      gridTemplateColumns: "150px 1fr auto",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-strong)",
      fontWeight: 500,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, it.label), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 9,
      borderRadius: 5,
      background: C.soft,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${it.pct}%`,
      height: "100%",
      borderRadius: 5,
      background: tones[it.tone] || C.blue,
      transition: "width var(--dur-base) var(--ease-out)"
    }
  })), showValue && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.muted,
      fontFamily: "var(--font-ui-display)",
      fontWeight: 600,
      minWidth: 56,
      textAlign: "right"
    }
  }, it.value ?? it.pct + "%"))));
}

/* Donut / progress ring. */
function Ring({
  score = 0,
  size = 92,
  stroke = 8,
  color,
  label
}) {
  const r = size / 2 - stroke,
    c = 2 * Math.PI * r,
    off = c * (1 - score / 100);
  const col = color || (score >= 80 ? C.green : score >= 67 ? C.amber : C.clay);
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: C.soft,
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: col,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: off,
    transform: `rotate(-90 ${size / 2} ${size / 2})`,
    style: {
      transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)"
    }
  }), /*#__PURE__*/React.createElement("text", {
    x: size / 2,
    y: size / 2 + (label ? -2 : 6),
    textAnchor: "middle",
    fontFamily: "var(--font-ui-display)",
    fontWeight: "700",
    fontSize: size * 0.28,
    fill: C.ink
  }, score), label && /*#__PURE__*/React.createElement("text", {
    x: size / 2,
    y: size / 2 + 14,
    textAnchor: "middle",
    fontSize: "9.5",
    fill: C.muted,
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.08em"
  }, label));
}

/* Stylized geo-concentration plot: concentric radius rings + clustered dots.
   Abstract (not a real map) — on-brand, painterly. */
function GeoConcentration({
  height = 320,
  radiusMiles = 5,
  pct = 82
}) {
  const W = 520,
    cx = W / 2,
    cy = height / 2;
  const rings = [0.92, 0.66, 0.4]; // outer→inner as fraction of maxR
  const maxR = Math.min(W, height) / 2 - 14;
  // deterministic-ish dots: dense cluster near center + a few outliers
  const dots = React.useMemo(() => {
    const out = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 140; i++) {
      const local = rnd() < pct / 100;
      const rr = local ? maxR * 0.36 * Math.sqrt(rnd()) : maxR * (0.62 + rnd() * 0.34);
      const a = rnd() * Math.PI * 2;
      out.push({
        x: cx + Math.cos(a) * rr,
        y: cy + Math.sin(a) * rr * 0.78,
        local
      });
    }
    return out;
  }, [height, pct]);
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${W} ${height}`,
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "geoGlow",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--ss-blue-500)",
    stopOpacity: "0.14"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--ss-blue-500)",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("ellipse", {
    cx: cx,
    cy: cy,
    rx: maxR * 0.5,
    ry: maxR * 0.42,
    fill: "url(#geoGlow)"
  }), rings.map((f, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: i,
    cx: cx,
    cy: cy,
    rx: maxR * f,
    ry: maxR * f * 0.78,
    fill: "none",
    stroke: i === 1 ? "var(--ss-blue-500)" : C.grid,
    strokeWidth: i === 1 ? 1.5 : 1,
    strokeDasharray: i === 1 ? "5 4" : "none",
    opacity: i === 1 ? 0.7 : 1
  })), dots.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: d.x,
    cy: d.y,
    r: d.local ? 3.1 : 2.4,
    fill: d.local ? "var(--ss-blue-500)" : "var(--ss-muted)",
    opacity: d.local ? 0.82 : 0.5
  })), [[-0.12, -0.04], [0.12, 0.06]].map(([dx, dy], i) => /*#__PURE__*/React.createElement("g", {
    key: i,
    transform: `translate(${cx + maxR * dx},${cy + maxR * dy})`
  }, /*#__PURE__*/React.createElement("circle", {
    r: "7",
    fill: "var(--ss-clay-500)",
    stroke: "#fff",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    r: "13",
    fill: "none",
    stroke: "var(--ss-clay-500)",
    strokeWidth: "1.5",
    opacity: "0.4"
  }))), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy - maxR * 0.78 + 4,
    textAnchor: "middle",
    fontSize: "11.5",
    fontWeight: "700",
    fill: "var(--ss-blue-700)",
    fontFamily: "var(--font-sans)"
  }, radiusMiles, "-mile radius \xB7 ", pct, "%"));
}
window.SSCharts = {
  Sparkline,
  TrendLine,
  ParetoChart,
  CohortHeatmap,
  BarRows,
  Ring,
  GeoConcentration
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/charts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ui.jsx
try { (() => {
/* global React, window */
/* ============================================================
   SimpleSense — shared view layout primitives.
   Keeps every operator-app screen consistent: editorial header,
   labeled section, panel, segmented toggle. Exposed on window.SSUI.
   ============================================================ */

/* Editorial page header — eyebrow + serif title + sub, optional action. */
function ViewHeader({
  eyebrow,
  title,
  sub,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "ss-eyebrow",
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--accent)"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 38,
      letterSpacing: "-0.015em",
      lineHeight: 1.05,
      margin: "6px 0 6px"
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--text-body)",
      fontSize: 15,
      maxWidth: "64ch"
    }
  }, sub)), children && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, children));
}

/* Section label above a block of content. */
function SectionLabel({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      margin: "0 0 12px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: "-0.01em",
      color: "var(--text-strong)",
      margin: 0
    }
  }, children), right && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, right));
}

/* A titled panel built on the Card surface (no dependency on Card to stay flexible). */
function Panel({
  title,
  sub,
  right,
  padding = 22,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-xs)",
      padding,
      ...style
    }
  }, (title || right) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 15.5,
      color: "var(--text-strong)"
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, sub)), right), children);
}

/* Segmented control (pill). options: [{id,label}] */
function SegToggle({
  options = [],
  value,
  onChange,
  size = "md"
}) {
  const pad = size === "sm" ? "5px 12px" : "7px 15px";
  const fs = size === "sm" ? 12.5 : 13.5;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      background: "var(--surface-soft)",
      padding: 3,
      borderRadius: "var(--radius-pill)",
      gap: 2
    }
  }, options.map(o => {
    const on = o.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => onChange(o.id),
      style: {
        border: "none",
        cursor: "pointer",
        padding: pad,
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)",
        fontSize: fs,
        fontWeight: on ? 600 : 500,
        background: on ? "var(--surface-card)" : "transparent",
        color: on ? "var(--text-strong)" : "var(--text-muted)",
        boxShadow: on ? "var(--shadow-xs)" : "none",
        transition: "all var(--dur-fast)",
        display: "inline-flex",
        alignItems: "center",
        gap: 7
      }
    }, o.icon && /*#__PURE__*/React.createElement("i", {
      className: `bi bi-${o.icon}`,
      style: {
        fontSize: fs + 1
      }
    }), o.label);
  }));
}

/* Inline stat — label over a serif value, optional delta. */
function Stat({
  label,
  value,
  delta,
  deltaTone = "success",
  sub
}) {
  const tones = {
    success: "var(--ss-success)",
    warning: "var(--ss-warning)",
    danger: "var(--ss-danger)",
    clay: "var(--ss-clay-500)",
    primary: "var(--ss-blue-600)",
    neutral: "var(--text-muted)"
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      fontWeight: 500,
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui-display)",
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: "-0.02em",
      color: "var(--text-strong)",
      lineHeight: 1
    }
  }, value), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: tones[deltaTone]
    }
  }, delta)), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, sub));
}

/* Evidence / grounding note line — the brand's "show your working". */
function Grounded({
  children,
  icon = "shield-check"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      fontSize: 13,
      color: "var(--text-muted)",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    style: {
      color: "var(--ss-blue-500)",
      marginTop: 2,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", null, children));
}
window.SSUI = {
  ViewHeader,
  SectionLabel,
  Panel,
  SegToggle,
  Stat,
  Grounded
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ui.jsx", error: String((e && e.message) || e) }); }

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.MoveCard = __ds_scope.MoveCard;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

})();
