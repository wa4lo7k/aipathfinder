export default function ResumeLoading() {
  return (
    <div className="min-h-screen" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div className="skeleton-shimmer" style={{ width: 20, height: 20, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div className="skeleton-shimmer" style={{ width: 200, height: 28, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="skeleton-card" style={{ minHeight: 300, marginBottom: 20 }}>
              <div className="skeleton-shimmer" style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 16 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div style={{
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 48,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: 160, height: 16, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: 120, height: 12, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
              </div>
            </div>
            <div className="skeleton-card" style={{ minHeight: 200 }}>
              <div className="skeleton-shimmer" style={{ width: 120, height: 20, borderRadius: 6, marginBottom: 16 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer" style={{ width: i % 2 === 0 ? '100%' : '80%', height: 48, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
                ))}
              </div>
            </div>
          </div>
          <div className="skeleton-card" style={{ minHeight: 500 }}>
            <div className="skeleton-shimmer" style={{ width: 160, height: 20, borderRadius: 6, margin: '0 auto 32px' }} aria-busy="true" aria-label="Loading…" role="status" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton-shimmer" style={{ width: '100%', height: 80, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: '100%', height: 60, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: '100%', height: 60, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: '100%', height: 60, borderRadius: 12 }} aria-busy="true" aria-label="Loading…" role="status" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
