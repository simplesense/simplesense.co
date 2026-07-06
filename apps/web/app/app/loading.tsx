/** Streams instantly while the dashboard's data (and first-load LLM analysis) resolves. */
export default function DashboardLoading() {
  const bar = (w: string | number, h = 14): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 6,
    background: 'var(--surface-soft)',
    animation: 'ss-pulse 1.3s ease-in-out infinite',
  })
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--surface-page)' }}>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      {/* sidebar placeholder */}
      <aside
        style={{
          width: '16.5rem',
          flex: 'none',
          borderRight: '1px solid var(--border-hairline)',
          background: 'var(--surface-card)',
          padding: '24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ ...bar(140, 22), marginBottom: 12 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={bar('80%')} />
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: '4rem', borderBottom: '1px solid var(--border-hairline)' }} />
        <main style={{ maxWidth: 1500, margin: '0 auto', padding: '32px 28px' }}>
          <div style={{ ...bar(180, 12), marginBottom: 10 }} />
          <div style={{ ...bar(320, 34), marginBottom: 28 }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 96,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--surface-card)',
                  animation: 'ss-pulse 1.3s ease-in-out infinite',
                }}
              />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 150,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-hairline)',
                background: 'var(--surface-card)',
                marginBottom: 20,
                animation: 'ss-pulse 1.3s ease-in-out infinite',
              }}
            />
          ))}
        </main>
      </div>
    </div>
  )
}
