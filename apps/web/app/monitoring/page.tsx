import { prisma, getOrgStore, DEMO } from '@ss/db'
import { listOutcomes } from '@ss/jobs'
import { Badge } from '@ss/ui'
import { getSession } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export const dynamic = 'force-dynamic'

const fmt = (v: number | null): string => (v == null ? '—' : v.toLocaleString())

export default async function MonitoringPage() {
  const { orgId } = await getSession()
  const store = await getOrgStore(prisma, orgId, DEMO.storeId)
  const outcomes = store ? await listOutcomes(prisma, store.id) : []

  return (
    <AppShell storeName={DEMO.storeName} openMoves={0} model="">
      <p className="ss-eyebrow" style={{ margin: 0 }}>
        MONITORING
      </p>
      <h1
        style={{
          margin: '4px 0 8px',
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
        }}
      >
        The flywheel
      </h1>
      <p style={{ marginTop: 0, color: 'var(--text-body)', maxWidth: '60ch' }}>
        When you apply a move, Simple Sense captures the baseline of its tracked metric and measures
        the lift after a {30}-day window — so prescriptions get sharper with proof, not opinions.
      </p>

      {outcomes.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginTop: 16,
          }}
        >
          <i className="bi bi-activity" style={{ fontSize: 26, color: 'var(--action-primary)' }} />
          <p style={{ marginTop: 12 }}>
            No moves applied yet. Apply a move on “This week’s moves” and it shows up here,
            measuring.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {outcomes.map((o) => (
            <div
              key={o.id}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span className="ss-eyebrow" style={{ color: 'var(--accent)' }}>
                  {o.recommendation.category}
                </span>
                <p style={{ margin: '4px 0 0', color: 'var(--text-strong)', fontWeight: 600 }}>
                  {o.recommendation.title}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  baseline {fmt(o.baselineValue)}
                  {o.measuredValue != null
                    ? ` → measured ${fmt(o.measuredValue)}`
                    : ` · measuring (${o.measurementWindowDays}d window)`}
                </p>
              </div>
              {o.status === 'MEASURED' ? (
                <Badge tone={(o.liftValue ?? 0) >= 0 ? 'success' : 'danger'} dot>
                  {(o.liftValue ?? 0) >= 0 ? '+' : ''}
                  {fmt(o.liftValue)} lift
                </Badge>
              ) : o.status === 'INCONCLUSIVE' ? (
                <Badge tone="neutral">inconclusive</Badge>
              ) : (
                <Badge tone="primary" dot>
                  measuring
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
