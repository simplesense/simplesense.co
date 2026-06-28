import type { Metric } from './types'

/** The kinds of noteworthy patterns we turn into prescriptions. */
export type SignalType =
  | 'vip_pareto'
  | 'geo_focus'
  | 'bopis_local'
  | 'regional_inventory'
  | 'discount_dependency'
  | 'aov_freeship'
  | 'sku_margin_kill'
  | 'retention_gap'

export type Severity = 'low' | 'med' | 'high'

export interface Signal {
  type: SignalType
  /** The metric whose value crossed the threshold. */
  metricKey: string
  /** Value that triggered the signal (already grounded — copied from the metric). */
  value: number
  severity: Severity
  /** All metric keys this signal references — the grounding allow-list for Stage 3. */
  metricKeys: string[]
  /** Non-PII context for the LLM (e.g. region, has_physical_locations, threshold). */
  context: Record<string, unknown>
}

/** Tunable thresholds. Canonical values live in packages/config; these are the defaults. */
export interface Thresholds {
  /** top-20% revenue share above which there's a VIP/Pareto opportunity. */
  vipTop20Share: number
  /** single-region revenue share above which there's a geo-focus opportunity. */
  geoSingleRegionShare: number
  /** within-radius revenue share above which BOPIS/foot-traffic is worth it (physical). */
  bopisWithinRadiusShare: number
  /** top zip-cluster share above which regional inventory/offers help (online). */
  regionalTopZipShare: number
  /** discount revenue share above which discount dependency is a margin risk. */
  discountRevenueShare: number
  /** repeat-purchase rate below which there's a retention gap. */
  retentionRepeatRate: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  vipTop20Share: 0.65,
  geoSingleRegionShare: 0.5,
  bopisWithinRadiusShare: 0.6,
  regionalTopZipShare: 0.5,
  discountRevenueShare: 0.4,
  retentionRepeatRate: 0.3,
}

function overSeverity(value: number, threshold: number): Severity {
  if (value >= threshold * 1.2) return 'high'
  if (value >= threshold * 1.08) return 'med'
  return 'low'
}

function underSeverity(value: number, threshold: number): Severity {
  if (value <= threshold * 0.5) return 'high'
  if (value <= threshold * 0.8) return 'med'
  return 'low'
}

/** A usable (non-insufficient) numeric metric, or undefined. */
function usable(map: Map<string, Metric>, key: string): Metric | undefined {
  const m = map.get(key)
  if (!m || m.insufficientData || m.valueNumeric == null) return undefined
  return m
}

/**
 * Stage 2 — pure signal detection. Marks metrics noteworthy using config thresholds.
 * Deterministic and side-effect free; output order is stable (rule order).
 * The geo signal honors `has_physical_locations` so Stage 3 picks BOPIS vs regional.
 */
export function detectSignals(
  metrics: Metric[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Signal[] {
  const map = new Map(metrics.map((m) => [m.key, m]))
  const signals: Signal[] = []

  // VIP / Pareto
  const top20 = usable(map, 'pareto.top20_revenue_share')
  if (top20 && (top20.valueNumeric as number) > thresholds.vipTop20Share) {
    const v = top20.valueNumeric as number
    signals.push({
      type: 'vip_pareto',
      metricKey: top20.key,
      value: v,
      severity: overSeverity(v, thresholds.vipTop20Share),
      metricKeys: [
        'pareto.top20_revenue_share',
        'pareto.top20_customer_count',
        'pareto.revenue_total',
      ].filter((k) => map.has(k)),
      context: { threshold: thresholds.vipTop20Share },
    })
  }

  // Geo concentration → focus, then BOPIS (physical) or regional (online)
  const region = usable(map, 'geo.single_region_share')
  const hasPhysical = (map.get('geo.has_physical_locations')?.valueNumeric ?? 0) === 1
  if (region && (region.valueNumeric as number) > thresholds.geoSingleRegionShare) {
    const v = region.valueNumeric as number
    const rj = (region.valueJson ?? {}) as { region?: string }
    signals.push({
      type: 'geo_focus',
      metricKey: region.key,
      value: v,
      severity: overSeverity(v, thresholds.geoSingleRegionShare),
      metricKeys: ['geo.single_region_share', 'geo.has_physical_locations'].filter((k) =>
        map.has(k),
      ),
      context: {
        region: rj.region,
        has_physical_locations: hasPhysical,
        threshold: thresholds.geoSingleRegionShare,
      },
    })
  }

  if (hasPhysical) {
    const within = usable(map, 'geo.within_5mi_revenue_share')
    if (within && (within.valueNumeric as number) > thresholds.bopisWithinRadiusShare) {
      const v = within.valueNumeric as number
      signals.push({
        type: 'bopis_local',
        metricKey: within.key,
        value: v,
        severity: overSeverity(v, thresholds.bopisWithinRadiusShare),
        metricKeys: ['geo.within_5mi_revenue_share', 'geo.has_physical_locations'].filter((k) =>
          map.has(k),
        ),
        context: {
          has_physical_locations: true,
          action_type: 'bopis',
          threshold: thresholds.bopisWithinRadiusShare,
        },
      })
    }
  } else {
    const zip = usable(map, 'geo.top_zip_cluster_share')
    if (zip && (zip.valueNumeric as number) > thresholds.regionalTopZipShare) {
      const v = zip.valueNumeric as number
      signals.push({
        type: 'regional_inventory',
        metricKey: zip.key,
        value: v,
        severity: overSeverity(v, thresholds.regionalTopZipShare),
        metricKeys: ['geo.top_zip_cluster_share', 'geo.has_physical_locations'].filter((k) =>
          map.has(k),
        ),
        context: {
          has_physical_locations: false,
          action_type: 'regional_inventory',
          threshold: thresholds.regionalTopZipShare,
        },
      })
    }
  }

  // Discount dependency
  const disc = usable(map, 'discount.revenue_share_discounted')
  if (disc && (disc.valueNumeric as number) > thresholds.discountRevenueShare) {
    const v = disc.valueNumeric as number
    signals.push({
      type: 'discount_dependency',
      metricKey: disc.key,
      value: v,
      severity: overSeverity(v, thresholds.discountRevenueShare),
      metricKeys: ['discount.revenue_share_discounted', 'discount.avg_discount_rate'].filter((k) =>
        map.has(k),
      ),
      context: { threshold: thresholds.discountRevenueShare },
    })
  }

  // AOV / free-ship: opportunity when the threshold sits below AOV (customers clear it easily)
  const gap = usable(map, 'aov.freeship_gap')
  const gapJson = (gap?.valueJson ?? {}) as { position?: string; aov?: number }
  if (gap && gapJson.position === 'below') {
    signals.push({
      type: 'aov_freeship',
      metricKey: gap.key,
      value: gap.valueNumeric as number,
      severity: 'med',
      metricKeys: ['aov.freeship_gap', 'aov.value', 'aov.freeship_threshold'].filter((k) =>
        map.has(k),
      ),
      context: { position: 'below', aov: gapJson.aov },
    })
  }

  // Money-losing SKUs
  const neg = usable(map, 'sku_margin.negative_margin_sku_count')
  if (neg && (neg.valueNumeric as number) >= 1) {
    const v = neg.valueNumeric as number
    signals.push({
      type: 'sku_margin_kill',
      metricKey: neg.key,
      value: v,
      severity: v >= 3 ? 'high' : v >= 2 ? 'med' : 'low',
      metricKeys: [
        'sku_margin.negative_margin_sku_count',
        'sku_margin.worst_sku_margin',
        'sku_margin.gross_margin_rate',
      ].filter((k) => map.has(k)),
      context: {},
    })
  }

  // Retention gap
  const repeat = usable(map, 'cohort.repeat_purchase_rate')
  if (repeat && (repeat.valueNumeric as number) < thresholds.retentionRepeatRate) {
    const v = repeat.valueNumeric as number
    signals.push({
      type: 'retention_gap',
      metricKey: repeat.key,
      value: v,
      severity: underSeverity(v, thresholds.retentionRepeatRate),
      metricKeys: [
        'cohort.repeat_purchase_rate',
        'cohort.time_to_second_order_median_days',
        'rfm.at_risk_count',
      ].filter((k) => map.has(k)),
      context: { threshold: thresholds.retentionRepeatRate },
    })
  }

  return signals
}
