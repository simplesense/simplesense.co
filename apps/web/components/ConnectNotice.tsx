/** Human-readable banners after an OAuth round-trip (success `?connected=`, or `?error=<code>`). */
const ERRORS: Record<string, string> = {
  state: 'Your connection attempt expired. Please start again from the button below.',
  hmac: "We couldn't verify that response came from Shopify. Please try connecting again.",
  auth: 'Please sign in to SimpleSense before connecting your store.',
  shop: 'That store domain looked invalid. Enter your-store.myshopify.com and retry.',
  config: 'Shopify connect is not configured on the server yet.',
  exchange: "Shopify wouldn't complete the connection. Please try again.",
}

export function ConnectNotice({
  connectedShop,
  error,
}: {
  connectedShop?: string
  error?: string
}) {
  if (connectedShop) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--ss-success-bg)',
          color: 'var(--ss-success)',
          border: '1px solid var(--ss-success)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          fontSize: 13.5,
          marginBottom: 20,
        }}
      >
        <i className="bi bi-check2-circle" aria-hidden="true" />
        <span>
          <strong>{connectedShop}</strong> connected. Click <strong>Sync now</strong> below to pull
          your history and see your first moves.
        </span>
      </div>
    )
  }
  if (error) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--ss-warning-bg)',
          color: 'var(--ss-warning)',
          border: '1px solid var(--ss-warning)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          fontSize: 13.5,
          marginBottom: 20,
        }}
      >
        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
        <span>{ERRORS[error] ?? 'That connection attempt failed. Please try again.'}</span>
      </div>
    )
  }
  return null
}
