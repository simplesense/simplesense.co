/**
 * Honesty notice: when `read_all_orders` isn't granted, Shopify caps order reads to the last
 * ~60 days, so the analysis is NOT the full trailing-24-months. We say so plainly rather than
 * presenting a truncated window as complete (Prime Directive — never imply data we don't have).
 */
export function PartialHistoryNotice({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: 'var(--ss-warning-bg)',
        color: 'var(--ss-warning)',
        border: '1px solid var(--ss-warning)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        fontSize: 13,
        lineHeight: 1.5,
        marginBottom: 20,
      }}
    >
      <i className="bi bi-clock-history" style={{ marginTop: 2, flex: 'none' }} />
      <span>
        Showing roughly the <strong>last 60 days</strong> of orders. Shopify limits order history
        until <code>read_all_orders</code> is approved — request it in your Partner dashboard to
        unlock the full <strong>24-month</strong> analysis. Until then, trend and cohort figures
        reflect a partial window.
      </span>
    </div>
  )
}
