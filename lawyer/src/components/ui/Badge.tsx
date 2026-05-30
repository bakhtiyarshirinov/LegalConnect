import { type AppointmentStatus } from '../../api/appointments'

interface BadgeProps { status: AppointmentStatus }

const config: Record<AppointmentStatus, { bg: string; color: string; border: string }> = {
  Pending:   { bg: '#FFF9DB', color: '#E67700', border: '#FFE066' },
  Confirmed: { bg: '#EBFBEE', color: '#2F9E44', border: '#B2F2BB' },
  Cancelled: { bg: '#FFF1F0', color: '#E03131', border: '#FFCCC7' },
  Completed: { bg: '#F0F0FF', color: '#3B5BDB', border: '#BAC8FF' },
}

export function Badge({ status }: BadgeProps) {
  const { bg, color, border } = config[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
      background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {status}
    </span>
  )
}
