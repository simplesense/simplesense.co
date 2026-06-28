import React from "react";

/**
 * The signature SimpleSense component: a ranked, prescriptive recommendation.
 * Follows the brand's content unit — Pattern → Why → Move(s) → Impact. Use it
 * anywhere the product tells the operator what to change next.
 *
 * @startingPoint section="App" subtitle="Prescriptive recommendation card" viewport="520x420"
 */
export interface MoveCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Priority rank shown in the serif chip, e.g. 1. */
  rank?: number | string;
  /** Eyebrow category, e.g. "Geographic concentration". @default "Move" */
  category?: string;
  /** The non-obvious finding, grounded in the merchant's numbers. Rendered in display serif. */
  pattern: React.ReactNode;
  /** One-line reasoning behind the call. */
  why?: React.ReactNode;
  /** Prescribed actions, each rendered as a ✓ line. */
  moves?: React.ReactNode[];
  /** Expected impact range badge, e.g. "+$4–7k / mo". */
  impact?: React.ReactNode;
  /** Confidence / grounding note shown in the footer. */
  confidence?: React.ReactNode;
  /** Primary CTA label. @default "Apply this move" */
  ctaLabel?: string;
  onApply?: () => void;
}

export function MoveCard(props: MoveCardProps): JSX.Element;
