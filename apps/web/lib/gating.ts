import type { TierEntitlements } from '@ss/config'

/**
 * Tier gating (Slice 10) — the pure decision layer between TIERS entitlements and the
 * pages/routes that enforce them. Two principles:
 *
 * 1. SERVER-ENFORCED: every consumer of these helpers gates at the data path (dashboard
 *    loader, route handler, page render) — never CSS-hiding data that was already sent.
 * 2. DEMO IS A SHOWCASE: the shared demo store renders ungated (it's the sales demo and is
 *    labeled "demo data" everywhere) — EXCEPT deliverable actions (CSV export), which are
 *    real product value and stay tier-gated.
 */

/** How many ranked moves the free tier sees ("Top moves only") — matches the free audit's 3. */
export const FREE_TOP_MOVES = 3

export interface MovesVisibility {
  visibleCount: number
  lockedCount: number
}

/** How many open moves to show vs lock behind the upgrade card. */
export function movesVisibility(
  ent: TierEntitlements,
  isDemo: boolean,
  total: number,
): MovesVisibility {
  if (isDemo || ent.moves === 'full') return { visibleCount: total, lockedCount: 0 }
  const visibleCount = Math.min(total, FREE_TOP_MOVES)
  return { visibleCount, lockedCount: total - visibleCount }
}

/** CSV/segment exports are a deliverable — tier-gated even on the demo store. */
export function canExport(ent: TierEntitlements): boolean {
  return ent.segmentExport
}

/** Geo + Pareto detail screens (Customers/Geography/Products analytics panels). */
export function detailUnlocked(ent: TierEntitlements, isDemo: boolean): boolean {
  return isDemo || ent.geoPareto
}

/** The outcomes flywheel (Monitoring). */
export function outcomesUnlocked(ent: TierEntitlements, isDemo: boolean): boolean {
  return isDemo || ent.outcomeDepth !== 'none'
}
