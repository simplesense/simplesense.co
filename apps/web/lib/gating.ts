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

/**
 * The FIXED set of move ids the tier may see, from the run's FULL ranked list (all statuses,
 * stable order). Returns null = unrestricted (paid tier or the demo showcase).
 *
 * The set must be fixed per run — anchored to rank positions, not to whatever is currently
 * open — or "Not now" becomes a paging cursor: dismissing a visible move would promote the
 * next locked one into view, letting a free org enumerate the entire list through the UI.
 * With a fixed set, dismissing a top move yields FEWER visible moves, never new ones.
 */
export function entitledMoveIds(
  ent: TierEntitlements,
  isDemo: boolean,
  rankedRunIds: readonly string[],
): Set<string> | null {
  if (isDemo || ent.moves === 'full') return null
  return new Set(rankedRunIds.slice(0, FREE_TOP_MOVES))
}

export interface MovesVisibility<T> {
  visible: T[]
  lockedCount: number
}

/** Split the OPEN moves into the entitled visible slice + the count locked behind the plan. */
export function splitOpenMoves<T extends { id: string }>(
  entitled: Set<string> | null,
  open: readonly T[],
): MovesVisibility<T> {
  if (!entitled) return { visible: [...open], lockedCount: 0 }
  const visible = open.filter((r) => entitled.has(r.id))
  return { visible, lockedCount: open.length - visible.length }
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
