import React from "react";

export type ButtonVariant = "primary" | "clay" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Primary action button for SimpleSense. Use `primary` (signal blue) for the
 * single most important action on a view; `secondary`/`ghost` for the rest;
 * `clay` for warm marketing accents.
 *
 * @startingPoint section="Core" subtitle="Brand button with signal-blue glint" viewport="700x140"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  /** Fully rounded — used for nav & marketing CTAs. @default false */
  pill?: boolean;
  /** Bootstrap Icons name without the `bi-` prefix, shown before the label. */
  icon?: string;
  /** Bootstrap Icons name shown after the label (e.g. "arrow-right"). */
  iconRight?: string;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
