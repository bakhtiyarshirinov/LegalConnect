import { Edit2, Trash2, CalendarClock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { SlotDto } from '../../api/slots'

interface Props {
  slot: SlotDto | null
  busy?: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function fmtRange(slot: SlotDto) {
  const s = new Date(slot.startTime)
  const e = new Date(slot.endTime)
  return s.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ', ' + s.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) +
    ' – ' + e.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Click-on-event menu, Google-Calendar style: click a slot in the grid → this opens
 * with "Redaktə et" / "Sil" for a free slot. A BOOKED slot only shows read-only
 * info — it can't be edited or deleted from here (item 9): the client already has
 * a confirmed appointment against it.
 */
export function SlotActionsPopover({ slot, busy, onClose, onEdit, onDelete }: Props) {
  if (!slot) return null

  return (
    <Modal open={!!slot} onClose={onClose} title={slot.isBooked ? 'Rezerv edilmiş slot' : 'Slot'} width={340}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <CalendarClock size={18} color="#6B6B6B" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>{fmtRange(slot)}</span>
        </div>

        {slot.isBooked ? (
          <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>
            Bu vaxta artıq müştəri görüş təyin edib. Rezerv edilmiş slotlar bu ekrandan
            redaktə və ya silinə bilməz — dəyişiklik üçün "Görüşlər" bölməsindən həmin
            görüşü ləğv edin.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={onEdit} disabled={busy}>
              <Edit2 size={14} /> Redaktə et
            </Button>
            <Button variant="danger" fullWidth loading={busy} onClick={onDelete}>
              <Trash2 size={14} /> Sil
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
