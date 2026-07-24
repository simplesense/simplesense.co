import { prisma, DEMO } from '@ss/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Founder-only lead list for the intelligence-audit modules (COMPOUND_ENGINEERING_PLAN.md
 * S5). Gated on "signed in via Clerk, not the demo org" — today that's exactly one person
 * (Satya; Clerk is dev-only and no real merchant has an account yet). This is NOT a real
 * admin-role check and must be replaced with one before any other real customer exists —
 * flagged in PARKING_LOT.md, not silently assumed safe long-term.
 */
export default async function AuditIntakesPage() {
  const { orgId } = await getSession()
  if (orgId === DEMO.orgId) {
    return (
      <div style={{ padding: 48, fontFamily: 'sans-serif' }}>
        <p>Sign in to view this page.</p>
      </div>
    )
  }

  const intakes = await prisma.auditIntake.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div
      style={{ padding: '48px 32px', maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Audit intakes</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 13 }}>
        {intakes.length} submission{intakes.length === 1 ? '' : 's'} total.
      </p>
      {intakes.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px 12px' }}>Date</th>
              <th style={{ padding: '8px 12px' }}>Module</th>
              <th style={{ padding: '8px 12px' }}>Company</th>
              <th style={{ padding: '8px 12px' }}>Contact</th>
              <th style={{ padding: '8px 12px' }}>Email</th>
              <th style={{ padding: '8px 12px' }}>Status</th>
              <th style={{ padding: '8px 12px' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {intakes.map((i) => (
              <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  {i.createdAt.toISOString().slice(0, 10)}
                </td>
                <td style={{ padding: '8px 12px' }}>{i.module}</td>
                <td style={{ padding: '8px 12px' }}>{i.companyName}</td>
                <td style={{ padding: '8px 12px' }}>{i.contactName}</td>
                <td style={{ padding: '8px 12px' }}>
                  <a href={`mailto:${i.email}`}>{i.email}</a>
                </td>
                <td style={{ padding: '8px 12px' }}>{i.status}</td>
                <td style={{ padding: '8px 12px', maxWidth: 260 }}>{i.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
