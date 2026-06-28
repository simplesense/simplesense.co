import { roundTo, clamp01 } from './math'

export type MeasuredStatus = 'MEASURED' | 'INCONCLUSIVE'

export interface LiftResult {
  liftValue: number | null
  liftConfidence: number | null
  status: MeasuredStatus
}

/** Relative change below this is treated as noise, not a real lift. */
const NOISE_FLOOR = 0.05

/**
 * Compute the measured lift of an implemented move: the change in its tracked metric from
 * baseline (at implementation) to measured (after the attribution window). Pure + grounded:
 * returns INCONCLUSIVE when there's no baseline or the change is within the noise floor,
 * rather than overclaiming a result (Prime Directive #1 applied to the flywheel).
 */
export function computeLift(baseline: number | null, measured: number | null): LiftResult {
  if (baseline == null || measured == null) {
    return { liftValue: null, liftConfidence: null, status: 'INCONCLUSIVE' }
  }
  const lift = roundTo(measured - baseline, 4)
  if (baseline === 0) {
    return measured === 0
      ? { liftValue: 0, liftConfidence: null, status: 'INCONCLUSIVE' }
      : { liftValue: lift, liftConfidence: 0.5, status: 'MEASURED' }
  }
  const rel = (measured - baseline) / Math.abs(baseline)
  if (Math.abs(rel) < NOISE_FLOOR) {
    return { liftValue: lift, liftConfidence: roundTo(Math.abs(rel), 4), status: 'INCONCLUSIVE' }
  }
  return {
    liftValue: lift,
    liftConfidence: clamp01(roundTo(Math.min(1, Math.abs(rel) * 2), 4)),
    status: 'MEASURED',
  }
}
