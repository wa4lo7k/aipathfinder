export default function SetupLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 40 }}>
      <div className="skeleton-shimmer" style={{ width: 160, height: 28, borderRadius: 6, marginBottom: 48 }} aria-busy="true" aria-label="Loading…" role="status" />
      <div className="skeleton-shimmer" style={{ width: 200, height: 200, borderRadius: '50%', marginBottom: 32 }} aria-busy="true" aria-label="Loading…" role="status" />
      <div className="skeleton-shimmer" style={{ width: 280, height: 20, borderRadius: 6, marginBottom: 8 }} aria-busy="true" aria-label="Loading…" role="status" />
      <div className="skeleton-shimmer" style={{ width: 200, height: 14, borderRadius: 6, marginBottom: 40 }} aria-busy="true" aria-label="Loading…" role="status" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ width: '100%', height: 44, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
        ))}
      </div>
    </div>
  )
}
