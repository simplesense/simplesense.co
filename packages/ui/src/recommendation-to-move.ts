import type { Recommendation } from '@ss/core'
import type { MoveCardProps } from './components/MoveCard'

/** 1200 → "1.2k", 950 → "950", 12000 → "12k". */
function abbreviate(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1000) {
    const k = n / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `${Math.round(n)}`
}

/** Format a grounded impact range as the MoveCard badge string, or undefined if 0. */
export function formatImpact(low: number, high: number, unit: string): string | undefined {
  if (low === 0 && high === 0) return undefined
  const suffix = /month/i.test(unit) ? '/mo' : ''
  const prefix = /USD/i.test(unit) ? '$' : ''
  return `+${prefix}${abbreviate(low)}–${prefix ? '' : ''}${abbreviate(high)}${suffix}`
}

/** Humanize the structured execution into one concrete action bullet. */
function executionMove(ex: Recommendation['suggestedExecution']): string {
  const spec = ex.spec as Record<string, unknown>
  switch (ex.type) {
    case 'klaviyo_segment':
      return `Build the Klaviyo segment (${String(spec.definition ?? 'targeted cohort')})`
    case 'meta_geofence':
      return `Geo-fence Meta & Google to a ${String(spec.radius_miles ?? 5)}-mile radius`
    case 'shopify_flow':
      return 'Automate it with a Shopify Flow'
    case 'manual':
      return 'Run this as an operator playbook this week'
    default:
      return 'Apply via the recommended channel'
  }
}

/**
 * Map a grounded Recommendation (§7/§8) to MoveCard props (§19). The card's structure
 * IS Pattern → Why → Move → Impact, so this is a faithful projection, not new content:
 * the finding (first rationale sentence) → pattern, the rest → why, the action title +
 * execution → the ✓ moves, the impact range → the badge, confidence → confidence.
 */
export function recommendationToMove(rec: Recommendation, rank?: number): MoveCardProps {
  const sentences = rec.rationale.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  const pattern = sentences[0] ?? rec.title
  const why = sentences.slice(1).join(' ')
  const moves = Array.from(new Set([rec.title, executionMove(rec.suggestedExecution)]))
  return {
    rank,
    category: rec.category,
    pattern,
    why: why || undefined,
    moves,
    impact: formatImpact(rec.impactLow, rec.impactHigh, rec.impactUnit),
    confidence: `${Math.round(rec.confidence * 100)}% confidence`,
  }
}
