import type { Metric } from './types'

interface MetricOpts {
  valueJson?: unknown
  unit?: string
  window?: string
  note?: string
}

/** Build a computed Metric. */
export function metric(key: string, valueNumeric: number, opts: MetricOpts = {}): Metric {
  return { key, valueNumeric, ...opts }
}

/**
 * Build an "insufficient data" Metric — value is null and the flag is set, so the
 * engine/UI can say "not enough order history to compute X" instead of showing a
 * fabricated number (Prime Directive #1).
 */
export function insufficient(key: string, note: string, opts: MetricOpts = {}): Metric {
  return { key, valueNumeric: null, insufficientData: true, note, ...opts }
}
