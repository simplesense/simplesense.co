import { MetricCard } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { MovesList } from '@/components/MovesList'
import { SyncingBanner } from '@/components/SyncingBanner'
import { PartialHistoryNotice } from '@/components/PartialHistoryNotice'
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
    <AppShell
      storeName={data.storeName}
      openMoves={data.recommendations.length + data.lockedMoveCount}
      model={data.model}
    >
      {data.isDemo ? (
        <a
          href="/connections"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--ss-info-bg)',
            color: 'var(--text-link)',
            border: '1px solid var(--ss-blue-300)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 13.5,
            marginBottom: 20,
            textDecoration: 'none',
          }}
        >
          <i className="bi bi-info-circle" />
          You're viewing demo data. Connect your Shopify store to see your own moves →
        </a>
      ) : null}
      {data.syncing ? <SyncingBanner /> : null}
      {data.needsSync ? (
        <a
          href="/connections"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--ss-warning-bg)',
            color: 'var(--ss-warning)',
            border: '1px solid var(--ss-warning)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 13.5,
            marginBottom: 20,
            textDecoration: 'none',
          }}
        >
          <i className="bi bi-exclamation-triangle" />
          Your store is connected but hasn&apos;t synced yet — run your first sync to see your moves
          →
        </a>
      ) : null}
      <PartialHistoryNotice show={data.historyLimited} />
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
          value={data.recommendations.length + data.lockedMoveCount}
          icon="compass"
          delta={data.lockedMoveCount > 0 ? `${data.lockedMoveCount} locked` : 'ranked'}
          deltaTone="primary"
        />
        {/* pareto.revenue_total = identified (non-guest) customer revenue — labeled honestly. */}
        <MetricCard
          label="Identified-customer revenue"
          value={usd(data.metrics.revenue)}
          icon="cash-coin"
        />
        <MetricCard label="Top-20% revenue share" value={pct(data.metrics.top20)} icon="people" />
        <MetricCard label="Revenue within 5 mi" value={pct(data.metrics.within5)} icon="geo-alt" />
      </div>

      <MovesList recommendations={data.recommendations} lockedCount={data.lockedMoveCount} />
    </AppShell>
  )
}
