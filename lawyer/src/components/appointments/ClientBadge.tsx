interface ClientBadgeProps {
  /** Backend LawyerAppointmentDto.clientFullName. May be missing for legacy rows. */
  fullName?: string
  /** Optional secondary line under the name (e.g. formatted date). */
  subtitle?: string
  /** Visual size of the avatar circle. */
  size?: number
}

/**
 * Avatar (initial of the client's name, or "?" when unknown) + the client's name.
 * Same initial-avatar convention used in the chat list.
 */
export function ClientBadge({ fullName, subtitle, size = 36 }: ClientBadgeProps) {
  const name = fullName?.trim() ?? ''
  const initial = name ? name[0].toUpperCase() : '?'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        aria-hidden
        style={{
          width: size, height: size, borderRadius: '50%', background: '#F5F5F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 600, color: '#0A0A0A', flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
          {name || 'Naməlum müştəri'}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
