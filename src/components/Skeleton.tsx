'use client'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundMap = { sm: '6px', md: '10px', lg: '16px', full: '50%' }
  return (
    <div
      aria-busy="true"
      aria-label="Loading…"
      role="status"
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: roundMap[rounded],
      }}
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading…" role="status" className={`skeleton-card ${className}`}>
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="50%" />
    </div>
  )
}

export function SkeletonParagraph({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading…" role="status" className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  )
}

export function SkeletonChatBubble({ align = 'left', className = '' }: { align?: 'left' | 'right'; className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading…"
      role="status"
      className={`chat-msg ${align === 'right' ? 'chat-msg-user' : 'chat-msg-ai'} ${className}`}
      style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}
    >
      <SkeletonAvatar size={32} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={40} width="70%" rounded="lg" />
        <Skeleton height={16} width="30%" rounded="sm" />
      </div>
    </div>
  )
}

export function SkeletonSidebarItem({ className = '' }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading…"
      role="status"
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
    >
      <Skeleton width={18} height={18} rounded="sm" />
      <Skeleton height={14} width="70%" />
    </div>
  )
}

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading…" role="status" className={`dash-stat-card ${className}`}>
      <Skeleton width={22} height={22} rounded="sm" />
      <Skeleton height={28} width={60} />
      <Skeleton height={12} width={100} />
    </div>
  )
}
