import { prisma } from '@ss/db'
import { latestRunId } from '@ss/jobs'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Step {
  n: number
  title: string
  body: string
  done: boolean
  active: boolean
  cta?: { label: string; href: string }
}

/**
 * At-a-glance progress rail (design system, 2026-08-01). Driven entirely by the same
 * real `done`/`active` flags the cards below use — derived from whether a store is
 * actually connected, an analysis run actually exists, and a recommendation has actually
 * been acted on. The design's own version animated a fake "Reading 18,402 orders…"
 * counter; that is exactly the kind of invented progress this product doesn't ship.
 */
function Stepper({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'contents' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 26,
                height: 26,
                flex: 'none',
                borderRadius: '50%',
                fontSize: 12.5,
                fontWeight: 700,
                background: s.done
                  ? 'var(--ss-success)'
                  : s.active
                    ? 'var(--action-primary)'
                    : 'var(--surface-soft)',
                color: s.done || s.active ? '#fff' : 'var(--text-muted)',
                boxShadow: s.active ? 'var(--shadow-inset-glint)' : 'none',
              }}
            >
              {s.done ? <i className="bi bi-check2" aria-hidden="true" /> : s.n}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: s.active ? 600 : 500,
                whiteSpace: 'nowrap',
                color: s.done || s.active ? 'var(--text-strong)' : 'var(--text-muted)',
              }}
            >
              {s.title}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <div
              aria-hidden="true"
              style={{
                flex: 1,
                height: 1.5,
                minWidth: 16,
                margin: '0 12px',
                background: s.done ? 'var(--ss-success)' : 'var(--border-strong)',
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default async function OnboardingPage() {
  const { orgId } = await getSession()
  const connected = await prisma.store.findFirst({
    where: { orgId, accessTokenEnc: { not: null } },
    orderBy: { createdAt: 'desc' },
  })
  const hasRun = connected ? Boolean(await latestRunId(prisma, connected.id)) : false
  const acted = connected
    ? (await prisma.recommendation.count({
        where: { storeId: connected.id, status: { not: 'NEW' } },
      })) > 0
    : false

  const steps: Step[] = [
    {
      n: 1,
      title: 'Connect your Shopify store',
      body: 'A one-click, read-only connection. We ingest your order history securely.',
      done: Boolean(connected),
      active: !connected,
      cta: connected ? undefined : { label: 'Connect Shopify', href: '/connections' },
    },
    {
      n: 2,
      title: 'Sync & analyze',
      body: 'Pull your history and run the grounded analysis — your first moves, ranked by impact.',
      done: hasRun,
      active: Boolean(connected) && !hasRun,
      cta: connected && !hasRun ? { label: 'Sync now', href: '/connections' } : undefined,
    },
    {
      n: 3,
      title: "See this week's moves",
      body: 'Open your ranked, grounded list. Apply one and we measure the lift.',
      done: acted,
      active: hasRun && !acted,
      cta: { label: hasRun ? 'Open your moves' : 'Preview with demo data', href: '/app' },
    },
  ]

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--surface-page)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: 'min(620px, 100%)' }}>
        <p className="ss-eyebrow" style={{ margin: 0 }}>
          SIMPLE SENSE
        </p>
        <h1
          style={{
            margin: '6px 0 6px',
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--text-strong)',
          }}
        >
          Let&apos;s find your next moves.
        </h1>
        <p style={{ margin: '0 0 28px', color: 'var(--text-body)' }}>
          Three steps to a ranked, grounded list — every number earned from your own data.
        </p>

        <Stepper steps={steps} />

        <div style={{ display: 'grid', gap: 14 }}>
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                background: 'var(--surface-card)',
                border: `1px solid ${s.active ? 'var(--action-primary)' : 'var(--border-hairline)'}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: 20,
                opacity: s.active || s.done ? 1 : 0.7,
              }}
            >
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 32,
                  height: 32,
                  flex: 'none',
                  borderRadius: '50%',
                  background: s.done
                    ? 'var(--ss-success)'
                    : s.active
                      ? 'var(--action-primary)'
                      : 'var(--surface-soft)',
                  color: s.done || s.active ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {s.done ? <i className="bi bi-check2" /> : s.n}
              </span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: 'var(--text-strong)' }}>{s.title}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-body)' }}>
                  {s.body}
                </p>
              </div>
              {s.cta ? (
                <a
                  href={s.cta.href}
                  style={{
                    flex: 'none',
                    alignSelf: 'center',
                    background: s.active ? 'var(--action-primary)' : 'transparent',
                    color: s.active ? 'var(--text-onbrand)' : 'var(--text-link)',
                    border: s.active ? 'none' : '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 14px',
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: s.active ? 'var(--shadow-inset-glint), var(--shadow-sm)' : 'none',
                  }}
                >
                  {s.cta.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 22, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          <a href="/app" style={{ color: 'var(--text-link)' }}>
            Skip — explore with demo data →
          </a>
        </p>
      </div>
    </main>
  )
}
