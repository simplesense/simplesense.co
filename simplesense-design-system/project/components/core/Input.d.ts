import React from "react";

/** Single-line text input with optional label, leading icon and hint. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the control. */
  label?: string;
  /** Bootstrap Icons name (no `bi-` prefix) shown inside, leading. */
  icon?: string;
  /** Helper or error text below the field. */
  hint?: string;
  /** Error styling. @default false */
  invalid?: boolean;
}

export function Input(props: InputProps): JSX.Element;
