import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface Props {
  open: boolean
  /** Pre-filled target time (drag-and-drop already snapped it to the grid). Pass null
   *  to let the user pick a time themselves (e.g. opened from a card button, no drag). */
  newTime: Date | null
  counterpartyName?: string
  onClose: () => void
  /** Rejects → modal stays open, caller shows the toast. Resolves → modal closes. */
  onConfirm: (newTime: Date, reason: string | undefined) => Promise<unknown>
}

function fmt(d: Date) {
  return d.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ', ' + d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

function toInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Confirms a reschedule proposal — either a drag-and-drop drop target (newTime prop
 * pre-filled, still editable here) or a manually picked time (newTime prop null,
 * e.g. opened from a card button). Only clicking "Sorğu göndər" sends the request
 * (POST /appointments/{id}/propose-reschedule); dragging/picking alone never does.
 */
export function ProposeRescheduleModal({ open, newTime, counterpartyName, onClose, onConfirm }: Props) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setSelectedTime(newTime); setReason(''); setBusy(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const close = () => { if (!busy) onClose() }

  const submit = async () => {
    if (busy) return
    if (!selectedTime) {
      toast.error('Yeni vaxt seçilməyib. Zəhmət olmasa tarix və saat seçin.')
      return
    }
    setBusy(true)
    try {
      await onConfirm(selectedTime, reason.trim() || undefined)
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
            Görüşü {selectedTime ? <strong>{fmt(selectedTime)}</strong> : 'seçdiyiniz'} tarixinə keçirməyi təklif
            edirsiniz{counterpartyName ? <> — <strong>{counterpartyName}</strong></> : ''}. Vaxt yalnız
            qarşı tərəf təsdiqlədikdən sonra dəyişəcək.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Yeni tarix və saat</label>
          <input
            type="datetime-local"
            aria-label="Yeni tarix və saat"
            value={selectedTime ? toInputValue(selectedTime) : ''}
            min={toInputValue(new Date())}
            onChange={(e) => setSelectedTime(e.target.value ? new Date(e.target.value) : null)}
            disabled={busy}
            style={{
              border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
              fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
              background: '#FFFFFF', color: '#0A0A0A',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
          />
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
          <Button fullWidth loading={busy} onClick={submit} disabled={!selectedTime}>
            Sorğu göndər
          </Button>
        </div>
      </div>
    </Modal>
  )
}
