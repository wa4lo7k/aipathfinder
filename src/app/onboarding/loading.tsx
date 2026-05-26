export default function OnboardingLoading() {
  return (
    <div id="page-onboarding" className="page active">
      <div className="auth-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      <div className="onboard-shell">
        <div className="onboard-box">
          <div className="pf-progress-wrap" style={{ marginBottom: 16 }}>
            <div className="skeleton-shimmer" style={{ width: '50%', height: 4, borderRadius: 2 }} aria-busy="true" aria-label="Loading…" role="status" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="skeleton-shimmer" style={{ width: 100, height: 32, borderRadius: 6, margin: '0 auto 12px' }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ width: 200, height: 28, borderRadius: 6, margin: '0 auto 8px' }} aria-busy="true" aria-label="Loading…" role="status" />
            <div className="skeleton-shimmer" style={{ width: 300, height: 14, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div className="skeleton-card" style={{ minHeight: 280 }}>
              <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px' }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: '50%', height: 20, borderRadius: 6, margin: '0 auto 12px' }} aria-busy="true" aria-label="Loading…" role="status" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton-shimmer" style={{ width: '90%', height: 12, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '70%', height: 12, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
              </div>
            </div>
            <div className="skeleton-card" style={{ minHeight: 280 }}>
              <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px' }} aria-busy="true" aria-label="Loading…" role="status" />
              <div className="skeleton-shimmer" style={{ width: '50%', height: 20, borderRadius: 6, margin: '0 auto 12px' }} aria-busy="true" aria-label="Loading…" role="status" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton-shimmer" style={{ width: '90%', height: 12, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
                <div className="skeleton-shimmer" style={{ width: '70%', height: 12, borderRadius: 6, margin: '0 auto' }} aria-busy="true" aria-label="Loading…" role="status" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
