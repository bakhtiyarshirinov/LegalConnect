interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton width={52} height={52} borderRadius={26} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width={70} height={26} borderRadius={13} />
        <Skeleton width={90} height={26} borderRadius={13} />
      </div>
      <Skeleton height={36} borderRadius={10} />
    </div>
  )
}
