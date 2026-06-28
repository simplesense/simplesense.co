import type { Recommendation } from '@ss/core'
import { runDemo, metricValue } from './run-demo'

export interface AuditStat {
  label: string
  value: string
}

export interface PublicAudit {
  storeName: string
  slug: string
  headline: string
  generatedNote: string
  /** Curated highest-conviction subset. Carries no customer PII (aggregate metrics only). */
  moves: Recommendation[]
  stats: AuditStat[]
}

const usd = (v: number | null): string =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)
const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)

/**
 * Build the public Audit payload (Slice 8 wedge): the 2–3 highest-conviction moves plus
 * a few grounded headline stats. Deliberately contains NO raw customer PII — only
 * aggregate, computed metrics and the prescriptive copy. The page renders this
 * unauthenticated, so this is the trust boundary.
 */
export async function buildAudit(slug: string): Promise<PublicAudit> {
  const demo = await runDemo()
  const moves = demo.recommendations.slice(0, 3)
  const stats: AuditStat[] = [
    {
      label: 'Trailing revenue (24m)',
      value: usd(metricValue(demo.metrics, 'pareto.revenue_total')),
    },
    {
      label: 'Top-20% revenue share',
      value: pct(metricValue(demo.metrics, 'pareto.top20_revenue_share')),
    },
    {
      label: 'Revenue within 5 miles',
      value: pct(metricValue(demo.metrics, 'geo.within_5mi_revenue_share')),
    },
    {
      label: 'Repeat-purchase rate',
      value: pct(metricValue(demo.metrics, 'cohort.repeat_purchase_rate')),
    },
  ]
  return {
    storeName: demo.storeName,
    slug,
    headline: `${demo.storeName}: your highest-conviction moves`,
    generatedNote:
      'A free, grounded snapshot from Simple Sense — every number earned from your own store data.',
    moves,
    stats,
  }
}

/**
 * Guard for the public surface: returns the list of PII-looking leaks in a payload
 * (emails, or raw customer ids). Used by the Slice 8 PII-leakage test.
 */
export function findPiiLeaks(payload: unknown): string[] {
  const json = JSON.stringify(payload)
  const leaks: string[] = []
  const emails = json.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g)
  if (emails) leaks.push(...emails)
  return leaks
}
