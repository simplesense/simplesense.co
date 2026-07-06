import type { Metadata } from 'next'
import { MoveCard, recommendationToMove } from '@ss/ui'
import { buildAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const audit = await buildAudit(slug)
  const title = audit.headline
  const description = `${audit.moves.length} prescriptive moves grounded in real store data — the front door to Simple Sense.`
  return {
    title,
    description,
    openGraph: { title: `${title} · Simple Sense Audit`, description },
    twitter: { title: `${title} · Simple Sense Audit`, description },
  }
}

export default async function AuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const audit = await buildAudit(slug)

  return (
    <main style={{ background: 'var(--surface-page)', minHeight: '100dvh' }}>
      {/* Brand bar so a cold visitor from a shared link has chrome + a path forward. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '20px 24px 0',
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: 'var(--text-strong)',
            textDecoration: 'none',
          }}
        >
          Simple Sense
        </a>
        <a
          href="/sign-up"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--text-onbrand)',
            background: 'var(--action-primary)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
          }}
        >
          Get your free audit
        </a>
      </header>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 96px' }}>
        {/* header */}
        <p className="ss-eyebrow" style={{ margin: 0 }}>
          SIMPLE SENSE AUDIT
        </p>
        <h1
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: 'var(--text-strong)',
            maxWidth: '18ch',
          }}
        >
          {audit.headline}
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: '1.0625rem',
            color: 'var(--text-body)',
            maxWidth: '60ch',
          }}
        >
          {audit.generatedNote}
        </p>

        {/* grounded headline stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            margin: '36px 0 48px',
          }}
        >
          {audit.stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '18px 20px',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</p>
              <strong
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  lineHeight: 1.05,
                  color: 'var(--text-strong)',
                }}
              >
                {s.value}
              </strong>
            </div>
          ))}
        </div>

        {/* curated moves (read-only — no apply on the public page) */}
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: '0 0 16px',
          }}
        >
          Your top {audit.moves.length} moves
        </h2>
        <div style={{ display: 'grid', gap: 20 }}>
          {audit.moves.map((rec, i) => (
            <MoveCard key={rec.id} {...recommendationToMove(rec, i + 1)} />
          ))}
        </div>

        {/* wedge CTA */}
        <div
          style={{
            marginTop: 48,
            padding: '32px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              color: 'var(--text-strong)',
            }}
          >
            This is just the front door.
          </p>
          <p style={{ margin: '8px auto 20px', maxWidth: '52ch', color: 'var(--text-body)' }}>
            Sign up free and connect your store to get the full ranked list every week — with
            one-click actions and measured lift on every move you apply.
          </p>
          <a
            href="/sign-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--action-primary)',
              color: 'var(--text-onbrand)',
              padding: '0 24px',
              height: 48,
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              boxShadow: 'var(--shadow-inset-glint), var(--shadow-sm)',
              textDecoration: 'none',
            }}
          >
            Get your own audit — free <i className="bi bi-arrow-right" />
          </a>
        </div>

        <p
          style={{ marginTop: 32, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}
        >
          No customer data is shown on this page · every figure is grounded in {audit.storeName}
          &apos;s real numbers.
        </p>
      </div>
    </main>
  )
}
