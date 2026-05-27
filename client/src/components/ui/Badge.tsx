import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#F5F5F5', color: '#6B6B6B', border: '1px solid #E8E8E8' },
  success: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  warning: { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  error: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  info: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
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
