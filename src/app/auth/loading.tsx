export default function AuthLoading() {
  return (
    <div className="auth-fullpage">
      <div className="auth-fullpage-left">
        <div className="auth-brand-content">
          <div className="skeleton-shimmer" style={{ width: 160, height: 32, borderRadius: 6, marginBottom: 24 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div className="skeleton-shimmer" style={{ width: 300, height: 48, borderRadius: 10, marginBottom: 16 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div className="skeleton-shimmer" style={{ width: 360, height: 16, borderRadius: 6, marginBottom: 32 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: 280, height: 20, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
            ))}
          </div>
        </div>
      </div>
      <div className="auth-fullpage-right">
        <div className="auth-box">
          <div className="skeleton-shimmer" style={{ width: 180, height: 28, borderRadius: 6, margin: '0 auto 12px' }} aria-busy="true" aria-label="Loading…" role="status" />
          <div className="skeleton-shimmer" style={{ width: 240, height: 14, borderRadius: 6, margin: '0 auto 24px' }} aria-busy="true" aria-label="Loading…" role="status" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div className="skeleton-shimmer" style={{ flex: 1, height: 40, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ flex: 1, height: 40, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton-shimmer" style={{ width: '100%', height: 48, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ width: '100%', height: 48, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ width: '100%', height: 48, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
          </div>
        </div>
      </div>
    </div>
  )
}
