import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

const MIN_ORDERED_QTY = 5
const HIGH_RETURN_RATE = 0.25

/** Founding rule #5: SKUs whose return rate outpaces the rest of the catalog. */
export const highReturnSkuRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.high_return_sku',
  title: 'High-return SKU clustering',
  severity: 'medium',
  citation: { label: 'SimpleSense returns-integrity benchmark v0 — per-SKU return rate' },
  remediationTemplate:
    'Investigate the flagged SKU(s): sizing chart accuracy, product photography vs. actual product, and quality-control notes tied to the dominant return reason.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — one of the plan's five named ReturnLens signals; a high-return SKU is a product/listing problem, not a customer-abuse one, and needs surfacing separately from the entity-level rules.",
  detect(snapshot) {
    if (snapshot.skuStats.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No SKU-level order/return data available.',
      }
    }
    const flagged = snapshot.skuStats
      .filter((s) => s.orderedQuantity >= MIN_ORDERED_QTY && s.returnRate >= HIGH_RETURN_RATE)
      .sort((a, b) => b.returnRate - a.returnRate)
    if (flagged.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary: `No SKU with ${MIN_ORDERED_QTY}+ units ordered exceeds a ${(HIGH_RETURN_RATE * 100).toFixed(0)}% return rate.`,
          metrics: { flaggedCount: 0 },
        },
        action: 'No gap here — no outsized SKU-level return concentration.',
      }
    }
    const top = flagged[0]!
    return {
      status: 'triggered',
      evidence: {
        summary: `${flagged.length} SKU(s) return at ${(HIGH_RETURN_RATE * 100).toFixed(0)}%+ — worst is "${top.sku}" at ${(top.returnRate * 100).toFixed(0)}% (${top.returnedQuantity} of ${top.orderedQuantity} units)${top.dominantReason ? `, dominant reason: ${top.dominantReason}` : ''}.`,
        metrics: {
          flaggedCount: flagged.length,
          topSku: top.sku,
          topReturnRatePct: Math.round(top.returnRate * 1000) / 10,
          topDominantReason: top.dominantReason,
        },
      },
      action: `Investigate "${top.sku}" first${top.dominantReason ? ` — dominant reason is ${top.dominantReason}` : ''}: check sizing chart accuracy, photography, and QC notes.`,
    }
  },
}
