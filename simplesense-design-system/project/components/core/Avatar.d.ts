import React from "react";

/** Circular avatar showing an image, or initials derived from `name`. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Falls back to initials when omitted. */
  src?: string;
  /** Full name — used for initials and the title attribute. */
  name?: string;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}

export function Avatar(props: AvatarProps): JSX.Element;
