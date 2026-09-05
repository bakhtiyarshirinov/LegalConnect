import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface Props {
  open: boolean
  /** The new time the user dragged the appointment to (already snapped to the grid). */
  newTime: Date | null
  counterpartyName?: string
  onClose: () => void
  /** Rejects → modal stays open, caller shows the toast. Resolves → modal closes. */
  onConfirm: (reason: string | undefined) => Promise<unknown>
}

function fmt(d: Date) {
  return d.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ', ' + d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Confirms a drag-and-drop reschedule proposal. Dragging alone never sends a request —
 * only clicking "Sorğu göndər" here does (POST /appointments/{id}/propose-reschedule).
 * Cancelling leaves the appointment untouched; its calendar block re-renders at the
 * original slot since position is derived from server data, never from drag state.
 */
export function ProposeRescheduleModal({ open, newTime, counterpartyName, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setReason(''); setBusy(false) }
  }, [open])

  const close = () => { if (!busy) onClose() }

  const submit = async () => {
    if (busy) return
    if (!newTime) {
      // Defensive — should never happen (the modal only opens with a target time), but a
      // silent no-op here is exactly the "button does nothing" bug: fail loud instead.
      toast.error('Yeni vaxt seçilməyib. Zəhmət olmasa görüşü yenidən sürüşdürün.')
      onClose()
      return
    }
    setBusy(true)
    try {
      await onConfirm(reason.trim() || undefined)
      onClose()
    } catch {
      // onConfirm (the page's proposeReschedule) already shows a toast with the
      // concrete backend message — just keep the modal open so the user can retry.
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Görüşün vaxtını dəyişdirmək" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12 }}>
          <CalendarClock size={18} color="#1C7ED6" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#1E3A5F', lineHeight: 1.5 }}>
            Görüşü {newTime ? <strong>{fmt(newTime)}</strong> : '—'} tarixinə keçirməyi təklif
            edirsiniz{counterpartyName ? <> — <strong>{counterpartyName}</strong></> : ''}. Vaxt yalnız
            qarşı tərəf təsdiqlədikdən sonra dəyişəcək.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>
            Səbəb <span style={{ color: '#A3A3A3', fontWeight: 400 }}>(isteğe bağlı)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            placeholder="Nə üçün başqa vaxt lazımdır?"
            rows={3}
            disabled={busy}
            autoFocus
            style={{
              border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
              fontSize: 14, outline: 'none', resize: 'vertical',
              fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A', lineHeight: 1.5,
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={close} disabled={busy}>İmtina</Button>
          <Button fullWidth loading={busy} onClick={submit}>
            Sorğu göndər
          </Button>
        </div>
      </div>
    </Modal>
  )
}
