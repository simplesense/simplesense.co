import type { Metric, RawRecommendation, Severity, Signal } from '@ss/core'
import type { EngineInput, LlmClient, LlmResult } from './types'

/**
 * Deterministic, fully-grounded stand-in for the LLM. Used in dev/tests and whenever no
 * ANTHROPIC_API_KEY is set, so the whole pipeline runs end-to-end with zero credentials.
 * Every number it writes traces to a cited metric, so its output passes Stage-4 grounding.
 */
export class MockLlmClient implements LlmClient {
  synthesize(input: EngineInput): Promise<LlmResult> {
    const m = input.metrics
    const present = new Set(input.signals.map((s) => s.type))
    const recs: RawRecommendation[] = []
    for (const s of input.signals) {
      // avoid a duplicate generic geo move when a specific geo signal exists
      if (
        s.type === 'geo_focus' &&
        (present.has('bopis_local') || present.has('regional_inventory'))
      )
        continue
      const rec = build(s, m)
      if (rec) recs.push(rec)
    }
    return Promise.resolve({ recommendations: recs, tokensUsed: 0, model: 'mock' })
  }
}

function val(metrics: Metric[], key: string): number | null {
  const found = metrics.find((x) => x.key === key)
  return found && !found.insufficientData ? found.valueNumeric : null
}

/** Keep only evidence ids that are present and usable (never cite insufficient metrics). */
function evidence(metrics: Metric[], keys: string[]): string[] {
  return keys.filter((k) => {
    const found = metrics.find((x) => x.key === k)
    return !!found && !found.insufficientData && found.valueNumeric != null
  })
}

const pct = (v: number): number => Math.round(v * 100)
const money = (v: number): number => Math.round(v)
const conf = (sev: Severity): number => (sev === 'high' ? 0.85 : sev === 'med' ? 0.72 : 0.6)

/** Monthly impact band from total revenue (window is 24 months). 0 range if ungrounded. */
function monthlyImpact(
  metrics: Metric[],
  lowFrac: number,
  highFrac: number,
): { low: number; high: number } {
  const rev = val(metrics, 'pareto.revenue_total')
  if (rev == null) return { low: 0, high: 0 }
  const monthly = rev / 24
  return { low: money(monthly * lowFrac), high: money(monthly * highFrac) }
}

function build(s: Signal, m: Metric[]): RawRecommendation | null {
  switch (s.type) {
    case 'vip_pareto': {
      const share = val(m, 'pareto.top20_revenue_share')
      if (share == null) return null
      const imp = monthlyImpact(m, 0.01, 0.02)
      return {
        category: 'VIP / retention',
        title: 'Build your top-20% VIP segment and launch a VIP flow',
        rationale: `Your top 20% of customers drive ${pct(share)}% of revenue. Build that exact segment, launch a VIP flow (early access, private sales, higher touch), and double down on the channel that produced them.`,
        evidence_metric_ids: evidence(m, [
          'pareto.top20_revenue_share',
          'pareto.top20_customer_count',
          'pareto.revenue_total',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'LOW',
        confidence: conf(s.severity),
        suggested_execution: {
          type: 'klaviyo_segment',
          spec: { definition: 'top_20_pct_by_spend' },
        },
      }
    }
    case 'bopis_local': {
      const within = val(m, 'geo.within_5mi_revenue_share')
      if (within == null) return null
      const imp = monthlyImpact(m, 0.01, 0.02)
      return {
        category: 'Geo / acquisition',
        title: 'Geo-fence ads to a 5-mile radius and turn on local pickup',
        rationale: `${pct(within)}% of your geocoded revenue ships within 5 miles of your stores. Geo-fence Meta and Google to that radius, turn on local pickup / BOPIS, and shift budget from national spray to local high-intent.`,
        evidence_metric_ids: evidence(m, [
          'geo.within_5mi_revenue_share',
          'geo.has_physical_locations',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'MED',
        confidence: conf(s.severity),
        suggested_execution: {
          type: 'meta_geofence',
          spec: { radius_miles: 5, enable_bopis: true },
        },
      }
    }
    case 'regional_inventory': {
      const zip = val(m, 'geo.top_zip_cluster_share')
      if (zip == null) return null
      const imp = monthlyImpact(m, 0.005, 0.015)
      return {
        category: 'Geo / acquisition',
        title: 'Place forward inventory in your top revenue zip clusters',
        rationale: `${pct(zip)}% of revenue concentrates in your top zip clusters where you hold no local inventory. Place forward inventory or a second 3PL node there, run regional free-ship offers, and tighten regional ad targeting.`,
        evidence_metric_ids: evidence(m, [
          'geo.top_zip_cluster_share',
          'geo.has_physical_locations',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'HIGH',
        confidence: conf(s.severity),
        suggested_execution: { type: 'manual', spec: { action: 'regional_inventory_placement' } },
      }
    }
    case 'geo_focus': {
      const share = val(m, 'geo.single_region_share')
      if (share == null) return null
      const physical = (s.context.has_physical_locations as boolean) === true
      const imp = monthlyImpact(m, 0.005, 0.015)
      return {
        category: 'Geo / acquisition',
        title: 'Concentrate spend on your dominant region',
        rationale: physical
          ? `${pct(share)}% of revenue comes from a single region. Concentrate local marketing and pickup options there.`
          : `${pct(share)}% of revenue comes from a single region. Tighten regional ad targeting and consider regional inventory and shipping offers.`,
        evidence_metric_ids: evidence(m, ['geo.single_region_share', 'geo.has_physical_locations']),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'MED',
        confidence: conf(s.severity),
        suggested_execution: {
          type: 'manual',
          spec: { action: physical ? 'local_focus' : 'regional_targeting' },
        },
      }
    }
    case 'discount_dependency': {
      const share = val(m, 'discount.revenue_share_discounted')
      if (share == null) return null
      const imp = monthlyImpact(m, 0.01, 0.025)
      return {
        category: 'Returns / margin',
        title: 'Wean revenue off blanket discount codes',
        rationale: `${pct(share)}% of revenue is tied to discount codes. Trim blanket codes, gate discounts behind email capture or first-order only, and protect margin with targeted offers.`,
        evidence_metric_ids: evidence(m, [
          'discount.revenue_share_discounted',
          'discount.avg_discount_rate',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'MED',
        confidence: conf(s.severity),
        suggested_execution: { type: 'manual', spec: { action: 'tighten_discount_policy' } },
      }
    }
    case 'aov_freeship': {
      const aov = val(m, 'aov.value')
      if (aov == null) return null
      const imp = monthlyImpact(m, 0.005, 0.012)
      return {
        category: 'AOV / shipping',
        title: 'Raise your free-shipping threshold toward AOV',
        rationale: `Your free-shipping threshold sits below your $${money(aov)} average order value. Raise it toward AOV to nudge basket size without hurting conversion.`,
        evidence_metric_ids: evidence(m, [
          'aov.value',
          'aov.freeship_threshold',
          'aov.freeship_gap',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'LOW',
        confidence: conf(s.severity),
        suggested_execution: { type: 'shopify_flow', spec: { action: 'raise_freeship_threshold' } },
      }
    }
    case 'sku_margin_kill': {
      const n = val(m, 'sku_margin.negative_margin_sku_count')
      if (n == null) return null
      const imp = monthlyImpact(m, 0.003, 0.008)
      return {
        category: 'Returns / margin',
        title: 'Reprice or retire SKUs that sell below cost',
        rationale: `${n} SKU(s) sell below cost after discounts. Reprice, bundle, or retire them to stop the margin bleed.`,
        evidence_metric_ids: evidence(m, [
          'sku_margin.negative_margin_sku_count',
          'sku_margin.worst_sku_margin',
          'sku_margin.gross_margin_rate',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'LOW',
        confidence: conf(s.severity),
        suggested_execution: { type: 'manual', spec: { action: 'reprice_or_retire' } },
      }
    }
    case 'retention_gap': {
      const repeat = val(m, 'cohort.repeat_purchase_rate')
      if (repeat == null) return null
      const imp = monthlyImpact(m, 0.01, 0.02)
      return {
        category: 'Lifecycle / timing',
        title: 'Launch a post-purchase flow to lift repeat rate',
        rationale: `Only ${pct(repeat)}% of customers buy again. Launch a post-purchase and replenishment flow timed to your median reorder interval to lift repeat rate.`,
        evidence_metric_ids: evidence(m, [
          'cohort.repeat_purchase_rate',
          'cohort.time_to_second_order_median_days',
        ]),
        impact_low: imp.low,
        impact_high: imp.high,
        impact_unit: 'USD/month',
        effort: 'MED',
        confidence: conf(s.severity),
        suggested_execution: {
          type: 'klaviyo_segment',
          spec: { definition: 'post_purchase_flow' },
        },
      }
    }
    default:
      return null
  }
}
