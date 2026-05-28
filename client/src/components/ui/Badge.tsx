import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#F5F5F5', color: '#6B6B6B', border: '1px solid #E8E8E8' },
  success: { background: '#EBFBEE', color: '#2F9E44', border: '1px solid #B2F2BB' },
  warning: { background: '#FFF9DB', color: '#E67700', border: '1px solid #FFE066' },
  error: { background: '#FFF1F0', color: '#E03131', border: '1px solid #FFCCC7' },
  info: { background: '#F0F0FF', color: '#3B5BDB', border: '1px solid #BAC8FF' },
}

const statusMap: Record<string, BadgeVariant> = {
  Pending: 'warning',
  Confirmed: 'success',
  Cancelled: 'error',
  Completed: 'info',
  Online: 'info',
  Offline: 'default',
}

export function Badge({ children, variant }: BadgeProps) {
  const resolvedVariant =
    variant ?? (typeof children === 'string' ? statusMap[children] ?? 'default' : 'default')

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        ...variantStyles[resolvedVariant],
      }}
    >
      {children}
    </span>
  )
}
