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
    <div className="ss-shell">
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      {/* sidebar placeholder */}
      <aside className="ss-sidebar" style={{ gap: 12 }}>
        <div style={{ ...bar(140, 22), marginBottom: 12 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={bar('80%')} />
        ))}
      </aside>
      <div className="ss-shell-col">
        <div className="ss-topbar" />
        <main className="ss-main">
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
