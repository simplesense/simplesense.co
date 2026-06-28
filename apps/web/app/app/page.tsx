import { MetricCard } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { MovesList } from '@/components/MovesList'
import { runDemo, metricValue } from '@/lib/demo/run-demo'

const usd = (v: number | null): string =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)
const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)

export default async function MovesPage() {
  const demo = await runDemo()
  const m = demo.metrics

  return (
    <AppShell storeName={demo.storeName} openMoves={demo.recommendations.length} model={demo.model}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <MetricCard
          label="Open moves"
          value={demo.recommendations.length}
          icon="compass"
          delta="ranked"
          deltaTone="primary"
        />
        <MetricCard
          label="Trailing revenue (24m)"
          value={usd(metricValue(m, 'pareto.revenue_total'))}
          icon="cash-coin"
        />
        <MetricCard
          label="Top-20% revenue share"
          value={pct(metricValue(m, 'pareto.top20_revenue_share'))}
          icon="people"
        />
        <MetricCard
          label="Revenue within 5 mi"
          value={pct(metricValue(m, 'geo.within_5mi_revenue_share'))}
          icon="geo-alt"
        />
      </div>

      <MovesList recommendations={demo.recommendations} />
    </AppShell>
  )
}
