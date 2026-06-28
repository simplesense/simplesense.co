import { MetricCard } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { MovesList } from '@/components/MovesList'
import { getDashboard } from '@/lib/dashboard'

// Always render fresh from the DB (recommendations change as the user applies/dismisses).
export const dynamic = 'force-dynamic'

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
  const data = await getDashboard()

  return (
    <AppShell storeName={data.storeName} openMoves={data.recommendations.length} model={data.model}>
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
          value={data.recommendations.length}
          icon="compass"
          delta="ranked"
          deltaTone="primary"
        />
        <MetricCard
          label="Trailing revenue (24m)"
          value={usd(data.metrics.revenue)}
          icon="cash-coin"
        />
        <MetricCard label="Top-20% revenue share" value={pct(data.metrics.top20)} icon="people" />
        <MetricCard label="Revenue within 5 mi" value={pct(data.metrics.within5)} icon="geo-alt" />
      </div>

      <MovesList recommendations={data.recommendations} />
    </AppShell>
  )
}
