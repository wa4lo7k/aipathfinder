import { SkeletonParagraph } from '@/components/Skeleton'

export default function HomeLoading() {
  return (
    <div className="min-h-screen" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
          <div className="skeleton-shimmer" style={{ width: 140, height: 28, borderRadius: 6 }} aria-busy="true" aria-label="Loading…" role="status" />
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="skeleton-shimmer" style={{ width: 80, height: 36, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ width: 100, height: 36, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="skeleton-shimmer" style={{ width: 480, height: 48, borderRadius: 10, margin: '0 auto 16px' }} aria-busy="true" aria-label="Loading…" role="status" />
          <div className="skeleton-shimmer" style={{ width: 320, height: 20, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} aria-busy="true" aria-label="Loading…" role="status" />
              <SkeletonParagraph lines={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
