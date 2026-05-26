import { SkeletonStatCard } from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <div id="page-dashboard" className="page active">
      <div className="dash-layout">
        <aside className="sidebar" style={{ padding: 20 }}>
          <div className="skeleton-shimmer" style={{ width: 120, height: 24, borderRadius: 6, marginBottom: 32 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <div className="skeleton-shimmer" style={{ width: 18, height: 18, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '70%', height: 14, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
              </div>
            ))}
          </div>
        </aside>
        <main className="dash-main">
          <div className="dash-topbar" style={{ marginBottom: 24 }}>
            <div>
              <div className="skeleton-shimmer" style={{ width: 200, height: 28, borderRadius: 6, marginBottom: 8 }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: 300, height: 16, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
            </div>
          </div>
          <div className="dash-stats" style={{ marginBottom: 28 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ minHeight: 160 }}>
                <div className="skeleton-shimmer" style={{ width: 20, height: 20, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '60%', height: 18, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '100%', height: 12, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '80%', height: 12, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
