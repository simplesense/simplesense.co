import React from "react";

/**
 * Base surface container — warm-white, hairline taupe border, soft warm shadow.
 * Set `interactive` for a subtle hover lift on clickable cards.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner padding in px. @default 24 */
  padding?: number;
  /** Adds hover lift + deeper shadow. @default false */
  interactive?: boolean;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
