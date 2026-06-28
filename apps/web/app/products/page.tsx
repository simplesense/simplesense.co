import { MetricCard } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { loadStoreMetrics } from '@/lib/store-metrics'
import { DemoBanner, PageHeading, MetricGrid, Panel, ExportButton } from '@/components/detail'
import { PartialHistoryNotice } from '@/components/PartialHistoryNotice'

export const dynamic = 'force-dynamic'

const pct = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 100)}%`)
const usd = (v: number | null): string =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)

export default async function ProductsPage() {
  const m = await loadStoreMetrics()
  const hasMargin = m.num('sku_margin.gross_margin_rate') != null
  const worst = m.json<{ title?: string; productId?: string }>('sku_margin.worst_sku_margin')
  const pair = m.json<{ titles?: string[] }>('affinity.top_pair_support')

  return (
    <AppShell storeName={m.storeName} openMoves={0} model="">
      <DemoBanner show={m.isDemo} />
      <PartialHistoryNotice show={m.historyLimited} />
      <PageHeading
        eyebrow="PRODUCTS"
        title="Per-SKU margin & affinity"
        sub="True margin net of discounts (where product cost is known), money-losing SKUs, and what sells together."
        action={<ExportButton href="/api/export/sku" label="Export SKU economics" />}
      />

      <MetricGrid>
        <MetricCard
          label="Gross margin rate"
          value={pct(m.num('sku_margin.gross_margin_rate'))}
          icon="graph-up-arrow"
        />
        <MetricCard
          label="Money-losing SKUs"
          value={m.num('sku_margin.negative_margin_sku_count') ?? '—'}
          deltaTone="danger"
          icon="exclamation-triangle"
        />
        <MetricCard
          label="Discount revenue share"
          value={pct(m.num('discount.revenue_share_discounted'))}
          icon="tag"
        />
        <MetricCard label="Avg order value" value={usd(m.num('aov.value'))} icon="cash-coin" />
      </MetricGrid>

      {!hasMargin ? (
        <Panel title="Unlock margin analysis">
          <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 14 }}>
            Add product costs in Shopify (Products → variant → Cost per item). Once cost is set,
            Simple Sense computes true per-SKU margin and flags money-losing products — until then
            it stays "insufficient" rather than guessing.
          </p>
        </Panel>
      ) : (m.num('sku_margin.negative_margin_sku_count') ?? 0) > 0 ? (
        <Panel title="Worst-margin SKU">
          <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 14 }}>
            <strong style={{ color: 'var(--text-strong)' }}>{worst?.title ?? 'A SKU'}</strong> is
            losing {usd(Math.abs(m.num('sku_margin.worst_sku_margin') ?? 0))} per unit after
            discounts — reprice, bundle, or retire it.
          </p>
        </Panel>
      ) : null}

      <Panel title="Frequently bought together">
        <p style={{ margin: 0, color: 'var(--text-body)', fontSize: 14 }}>
          {pair?.titles?.length === 2
            ? `${pair.titles[0]} + ${pair.titles[1]} — co-purchased in ${m.num('affinity.top_pair_support')} orders. A natural bundle or cross-sell.`
            : 'Not enough multi-product orders to surface a cross-sell pair yet.'}
        </p>
      </Panel>
    </AppShell>
  )
}
