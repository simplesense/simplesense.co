import React from "react";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "clay";

/**
 * Compact status or category pill. Soft tinted fill by default; `outline` for
 * a lighter weight. Pair with `dot` for inline status.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "neutral" */
  tone?: BadgeTone;
  /** @default "soft" */
  variant?: "soft" | "outline";
  /** Show a leading status dot. @default false */
  dot?: boolean;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
