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

/** "Perenos təklif olunub" — shown on both sides while a reschedule request is pending. */
export function RescheduleBadge({ proposedScheduledAt, isOwnProposal, onAccept, onReject, accepting }: Props) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
        padding: '8px 12px', fontSize: 12.5, color: '#92400E',
      }}
    >
      <CalendarClock size={14} style={{ flexShrink: 0 }} />
      <span>
        <strong>Perenos təklif olunub</strong> — {fmt(proposedScheduledAt)}
        {isOwnProposal ? ' (sizin təklifiniz, cavab gözlənilir)' : ''}
      </span>
      {!isOwnProposal && (
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
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
