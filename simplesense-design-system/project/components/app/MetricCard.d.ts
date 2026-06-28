import React from "react";

/**
 * Compact KPI tile for the operator dashboard: a muted label, a large value,
 * and an optional delta badge. Compose 3–4 across a metric grid row.
 *
 * @startingPoint section="App" subtitle="Dashboard KPI tile" viewport="320x120"
 */
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric name, e.g. "Conversion rate". */
  label: string;
  /** The figure, pre-formatted, e.g. "1.8%" or "$248k". */
  value: React.ReactNode;
  /** Optional change indicator, e.g. "+0.4pt". */
  delta?: React.ReactNode;
  /** Badge tone for the delta. @default "success" */
  deltaTone?: "neutral" | "primary" | "success" | "warning" | "danger" | "clay";
  /** Bootstrap Icons name (no `bi-` prefix). */
  icon?: string;
}

export function MetricCard(props: MetricCardProps): JSX.Element;
