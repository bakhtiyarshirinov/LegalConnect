import { CalendarClock, Check, X } from 'lucide-react'

interface Props {
  proposedScheduledAt: string
  /** true when the current user is the one who proposed (so they can't respond). */
  isOwnProposal: boolean
  onAccept: () => void
  onReject: () => void
  accepting?: boolean
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

export const RESCHEDULE_PROPOSED_TEXT = 'Təyin olunmuş görüş vaxtının dəyişdirilməsi barədə təklif göndərildi'

/** Shown on both sides while a reschedule request is pending. */
export function RescheduleBadge({ proposedScheduledAt, isOwnProposal, onAccept, onReject, accepting }: Props) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
        padding: '10px 12px', fontSize: 12.5, color: '#92400E', maxWidth: 420,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <CalendarClock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ lineHeight: 1.4 }}>
          <strong>{RESCHEDULE_PROPOSED_TEXT}</strong> — yeni vaxt: {fmt(proposedScheduledAt)}
          {isOwnProposal ? ' (sizin təklifiniz, cavab gözlənilir)' : ''}
        </span>
      </div>
      {!isOwnProposal && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onAccept}
            disabled={accepting}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff',
              border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 600,
              cursor: accepting ? 'default' : 'pointer', opacity: accepting ? 0.6 : 1,
            }}
          >
            <Check size={12} /> Qəbul et
          </button>
          <button
            onClick={onReject}
            disabled={accepting}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: '#fff', color: '#B91C1C',
              border: '1px solid #FCA5A5', borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 600,
              cursor: accepting ? 'default' : 'pointer', opacity: accepting ? 0.6 : 1,
            }}
          >
            <X size={12} /> Rədd et
          </button>
        </div>
      )}
    </div>
  )
}
