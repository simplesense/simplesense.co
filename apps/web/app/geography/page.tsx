import { MetricCard } from '@ss/ui'
import { Badge } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { loadStoreMetrics } from '@/lib/store-metrics'
import { DemoBanner, PageHeading, MetricGrid, Panel, StatBars } from '@/components/detail'
import { PartialHistoryNotice } from '@/components/PartialHistoryNotice'
import { LockedPanel } from '@/components/locked'

export const dynamic = 'force-dynamic'

const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)

export default async function GeographyPage() {
  const m = await loadStoreMetrics()
  const physical = m.num('geo.has_physical_locations') === 1
  const region = m.json<{ region?: string }>('geo.single_region_share')
  const breakdown = m.json<{ regions?: { region: string; revenueShare: number }[] }>(
    'geo.region_breakdown',
  )
  const regionRows = (breakdown?.regions ?? []).map((r, i) => ({
    label: r.region,
    value: Math.round(r.revenueShare * 100),
    tone: i === 0 ? 'var(--action-primary)' : undefined,
  }))
  const zips = m.json<{ zips?: string[] }>('geo.top_zip_cluster_share')

  return (
    <AppShell storeName={m.storeName} openMoves={0} model="">
      <DemoBanner show={m.isDemo} />
      <PartialHistoryNotice show={m.historyLimited} />
      <PageHeading
        eyebrow="GEOGRAPHY"
        title="Where your revenue lives"
        sub={
          physical
            ? 'Physical store detected — trade-area + BOPIS view. Concentration drives local pickup & geo-fenced ads.'
            : 'Online-only — regional view. Concentration drives forward inventory & regional offers (no foot-traffic plays).'
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Badge tone={physical ? 'success' : 'neutral'} dot>
          {physical ? 'Omnichannel (physical locations)' : 'Online-only'}
        </Badge>
      </div>

      <MetricGrid>
        <MetricCard
          label="Top region share"
          value={pct(m.num('geo.single_region_share'))}
          delta={region?.region ?? undefined}
          deltaTone="primary"
          icon="geo-alt"
        />
        <MetricCard label="Regions" value={m.num('geo.region_count') ?? '—'} icon="map" />
        {physical ? (
          <MetricCard
            label="Revenue within 5 mi"
            value={pct(m.num('geo.within_5mi_revenue_share'))}
            icon="pin-map"
          />
        ) : (
          <MetricCard
            label="Top zip-cluster share"
            value={pct(m.num('geo.top_zip_cluster_share'))}
            icon="pin-map"
          />
        )}
        <MetricCard
          label="Unlocatable revenue"
          value={pct(m.num('geo.unlocatable_revenue_fraction'))}
          deltaTone="warning"
          icon="question-circle"
        />
      </MetricGrid>

      {m.detailLocked ? (
        <LockedPanel
          title="Full geographic analysis"
          copy="Regional concentration, trade-area / zip-cluster detail, and the geo moves behind them are part of Basic's geo + Pareto analysis. The headline shares above are your free teaser."
        />
      ) : (
        <>
          {regionRows.length >= 2 ? (
            <Panel title="Regional concentration">
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                Share of located revenue by region (top {regionRows.length}).
              </p>
              <StatBars rows={regionRows} valueSuffix="%" />
            </Panel>
          ) : null}

          {physical ? (
            <Panel title="Trade area">
              <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 14 }}>
                {pct(m.num('geo.within_5mi_revenue_share'))} of geocoded revenue is within 5 miles
                of a store
                {m.num('geo.geocoded_revenue_fraction') != null
                  ? ` (on ${pct(m.num('geo.geocoded_revenue_fraction'))} of revenue we could map)`
                  : ''}
                {m.num('geo.trade_area_overlap_share') != null
                  ? ` · ${pct(m.num('geo.trade_area_overlap_share'))} sits in overlapping store catchments.`
                  : '.'}
              </p>
            </Panel>
          ) : (
            <Panel title="Top zip clusters">
              <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 14 }}>
                {zips?.zips?.length
                  ? `Concentrated in ${zips.zips.join(', ')} — candidates for forward inventory / regional free-ship.`
                  : 'Not enough zip-coded orders to cluster yet.'}
              </p>
            </Panel>
          )}
        </>
      )}
    </AppShell>
  )
}
