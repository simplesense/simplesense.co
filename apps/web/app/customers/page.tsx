import { MetricCard, ParetoChart, type ParetoPoint } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { PartialHistoryNotice } from '@/components/PartialHistoryNotice'
import { LockedPanel } from '@/components/locked'
import { loadStoreMetrics } from '@/lib/store-metrics'
import {
  DemoBanner,
  PageHeading,
  MetricGrid,
  Panel,
  StatBars,
  ExportButton,
} from '@/components/detail'

export const dynamic = 'force-dynamic'

const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)
const n = (v: number | null): string => (v == null ? '—' : Math.round(v).toLocaleString())
const days = (v: number | null): string => (v == null ? '—' : `${v} days`)

export default async function CustomersPage() {
  const m = await loadStoreMetrics()
  const top20 = m.num('pareto.top20_revenue_share')
  const top20Count = m.num('pareto.top20_customer_count')

  // Cumulative revenue concentration at the measured percentiles → a grounded Lorenz curve.
  const concentration: ParetoPoint[] = (
    [
      [0.01, m.num('pareto.top1_revenue_share')],
      [0.05, m.num('pareto.top5_revenue_share')],
      [0.1, m.num('pareto.top10_revenue_share')],
      [0.2, top20],
    ] as const
  )
    .filter(([, share]) => share != null)
    .map(([customerFraction, share]) => ({ customerFraction, revenueShare: share as number }))

  return (
    <AppShell storeName={m.storeName} openMoves={0} model="">
      <DemoBanner show={m.isDemo} />
      <PartialHistoryNotice show={m.historyLimited} />
      <PageHeading
        eyebrow="CUSTOMERS"
        title="Customer concentration & segments"
        sub={
          top20 != null && top20Count != null
            ? `Your top ${n(top20Count)} customers drive ${pct(top20)} of revenue — the VIP base to protect.`
            : 'Pareto, VIP and RFM detail from your latest analysis.'
        }
        action={
          <ExportButton href="/api/export/vip" label="Export VIP segment" locked={m.exportLocked} />
        }
      />

      <MetricGrid>
        <MetricCard
          label="Total customers"
          value={n(m.num('pareto.customer_count'))}
          icon="people"
        />
        <MetricCard label="Top-20% revenue share" value={pct(top20)} icon="graph-up-arrow" />
        <MetricCard
          label="Repeat-purchase rate"
          value={pct(m.num('cohort.repeat_purchase_rate'))}
          icon="arrow-repeat"
        />
        <MetricCard
          label="Median time to 2nd order"
          value={days(m.num('cohort.time_to_second_order_median_days'))}
          icon="clock"
        />
      </MetricGrid>

      {m.detailLocked ? (
        <LockedPanel
          title="Full customer economics"
          copy="The concentration curve, RFM segments, and retention funnel — computed from your own orders — are part of Basic's geo + Pareto analysis. The headline numbers above are your free teaser."
        />
      ) : null}

      {!m.detailLocked && concentration.length >= 2 ? (
        <Panel title="Revenue concentration">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <ParetoChart points={concentration} />
            <div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-body)' }}>
                The blue curve is your real revenue concentration; the dashed line is what perfectly
                even spending would look like. The wider the gap, the more your revenue leans on a
                few customers.
              </p>
              {top20 != null ? (
                <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
                  Top 20% of customers ·{' '}
                  <strong style={{ color: 'var(--text-strong)' }}>{pct(top20)}</strong> of revenue
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {!m.detailLocked ? (
        <>
          <Panel title="RFM segments">
            <StatBars
              rows={[
                {
                  label: 'Champions',
                  value: m.num('rfm.champions_count'),
                  tone: 'var(--ss-success)',
                },
                { label: 'Loyal', value: m.num('rfm.loyal_count') },
                { label: 'Repeat', value: m.num('rfm.repeat_count') },
                { label: 'One-time', value: m.num('rfm.one_time_count') },
                { label: 'At risk', value: m.num('rfm.at_risk_count'), tone: 'var(--ss-warning)' },
                { label: 'Dormant', value: m.num('rfm.dormant_count'), tone: 'var(--ss-muted)' },
              ]}
            />
          </Panel>

          <Panel title="Retention funnel">
            <StatBars
              rows={[
                { label: 'New customers', value: m.num('cohort.new_customer_count') },
                { label: 'Active (in window)', value: m.num('rfm.active_count') },
                {
                  label: '2nd→3rd conversion %',
                  value:
                    m.num('cohort.second_to_third_conversion') != null
                      ? Math.round((m.num('cohort.second_to_third_conversion') as number) * 100)
                      : null,
                  tone: 'var(--ss-clay-500)',
                },
              ]}
            />
          </Panel>
        </>
      ) : null}
    </AppShell>
  )
}
