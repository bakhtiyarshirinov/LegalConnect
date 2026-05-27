interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #F5F5F5 25%, #EBEBEB 50%, #F5F5F5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export function AppointmentSkeleton() {
  return (
    <div
      style={{
        padding: 20,
        border: '1px solid #E8E8E8',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width={140} height={18} />
        <Skeleton width={80} height={22} borderRadius={100} />
      </div>
      <Skeleton width={200} height={14} />
      <div style={{ display: 'flex', gap: 16 }}>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={14} />
        <Skeleton width={70} height={14} />
      </div>
    </div>
  )
}
