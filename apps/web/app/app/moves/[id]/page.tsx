import { notFound } from 'next/navigation'
import { Badge } from '@ss/ui'
import { AppShell } from '@/components/AppShell'
import { MoveChecklist, MoveApply } from '@/components/move-detail-parts'
import { ExportButton } from '@/components/detail'
import { loadMoveDetail } from '@/lib/move-detail'
import { shipPlan, moveChecklist } from '@/lib/move-execution'
import { formatImpact } from '@ss/ui'

export const dynamic = 'force-dynamic'

/** Confidence donut (§3c Ring). Pure SVG, server-rendered. value in [0,1]. */
function Ring({ value, size = 64 }: { value: number; size?: number }) {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${Math.round(pct * 100)}% confidence`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border-hairline)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ss-blue-500)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={size * 0.28}
        fill="var(--text-strong)"
      >
        {Math.round(pct * 100)}
      </text>
    </svg>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 22,
      }}
    >
      <p
        className="ss-eyebrow"
        style={{
          margin: '0 0 14px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </p>
      {children}
    </section>
  )
}

export default async function MoveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await loadMoveDetail(id)
  if (!detail) notFound()

  const { rec, evidence, isDemo, storeName, exportLocked } = detail
  const sentences = rec.rationale.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  const pattern = sentences[0] ?? rec.title
  const why = sentences.slice(1).join(' ') || rec.rationale
  const impact = formatImpact(rec.impactLow, rec.impactHigh, rec.impactUnit)
  const ship = shipPlan(rec.suggestedExecution)
  const checklist = moveChecklist(rec)
  const applied =
    rec.status === 'IMPLEMENTED' ? 'IMPLEMENTED' : rec.status === 'DISMISSED' ? 'DISMISSED' : 'NONE'

  return (
    <AppShell>
      <a
        href="/app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 13.5,
          color: 'var(--text-link)',
          textDecoration: 'none',
          marginBottom: 18,
        }}
      >
        <i className="bi bi-arrow-left" /> Back to this week&apos;s moves
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          {rec.category}
        </span>
        {isDemo ? <Badge tone="primary">demo data</Badge> : null}
      </div>

      <h1
        style={{
          margin: '0 0 28px',
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: 'var(--text-strong)',
          maxWidth: '20ch',
        }}
      >
        {pattern}
      </h1>

      <div className="ss-move-grid">
        {/* Left column — evidence, why, the move */}
        <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
          <Panel label="The evidence">
            {evidence.length ? (
              <div
                style={{
                  display: 'grid',
                  gap: 1,
                  background: 'var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {evidence.map((e) => (
                  <div
                    key={e.key}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      background: 'var(--surface-card)',
                      padding: '12px 14px',
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>
                      {e.label}
                      {e.window ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {' '}
                          · {e.window}
                        </span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        color: 'var(--text-strong)',
                        flex: 'none',
                      }}
                    >
                      {e.display}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                This move is grounded in the rationale below; no single metric is cited.
              </p>
            )}
            <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              <i
                className="bi bi-shield-check"
                style={{ marginRight: 6, color: 'var(--ss-success)' }}
              />
              Every figure is computed from {isDemo ? 'the demo store' : storeName} — never
              estimated.
            </p>
          </Panel>

          <Panel label="Why this matters">
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-body)' }}>
              {why}
            </p>
          </Panel>

          <Panel label="The move">
            <MoveChecklist steps={checklist} />
          </Panel>
        </div>

        {/* Right rail — impact, confidence, apply, ship plan */}
        <div className="ss-move-rail">
          <Panel label="Expected impact">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-strong)',
                  }}
                >
                  {impact ?? 'Qualitative'}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Ranged estimate · effort {rec.effort.toLowerCase()}
                </p>
              </div>
              <div style={{ flex: 'none', textAlign: 'center' }}>
                <Ring value={rec.confidence} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  confidence
                </p>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <MoveApply moveId={rec.id} initial={applied} />
            </div>
          </Panel>

          <Panel label="How we'd ship it">
            <div style={{ display: 'grid', gap: 14 }}>
              {ship.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <i
                    className={`bi bi-${row.icon}`}
                    aria-hidden="true"
                    style={{
                      fontSize: 18,
                      color: 'var(--ss-blue-500)',
                      marginTop: 1,
                      flex: 'none',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {row.channel}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.45 }}>
                      {row.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {rec.suggestedExecution.type === 'klaviyo_segment' ? (
              <div style={{ marginTop: 16 }}>
                <ExportButton
                  href="/api/export/vip"
                  label="Download the segment (CSV)"
                  locked={exportLocked}
                />
                <p style={{ margin: '8px 2px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  The real customers behind this move — import straight into Klaviyo.
                </p>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </AppShell>
  )
}
