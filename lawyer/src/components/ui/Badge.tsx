import { type AppointmentStatus } from '../../api/appointments'

interface BadgeProps {
  status: AppointmentStatus
}

const config: Record<AppointmentStatus, { bg: string; color: string; label: string }> = {
  Pending: { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  Confirmed: { bg: '#DCFCE7', color: '#15803D', label: 'Confirmed' },
  Cancelled: { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled' },
  Completed: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Completed' },
}

export function Badge({ status }: BadgeProps) {
  const { bg, color, label } = config[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  )
}
