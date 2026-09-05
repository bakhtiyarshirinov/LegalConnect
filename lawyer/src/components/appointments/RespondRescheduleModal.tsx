import { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface Props {
  open: boolean
  proposedTime: Date | null
  onClose: () => void
  /** Rejects → modal stays open. Resolves → modal closes. */
  onConfirm: (reason: string | undefined) => Promise<unknown>
}

function fmt(d: Date) {
  return d.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ', ' + d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

/** Reason for REJECTING a reschedule proposal (optional, server does not require it). */
export function RespondRescheduleModal({ open, proposedTime, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setReason(''); setBusy(false) }
  }, [open])

  const close = () => { if (!busy) onClose() }

  const submit = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm(reason.trim() || undefined)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Vaxt dəyişikliyi təklifini rədd et" width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: 12 }}>
          <XCircle size={18} color="#E03131" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#611A15', lineHeight: 1.5 }}>
            Təklif edilən vaxt — {proposedTime ? <strong>{fmt(proposedTime)}</strong> : '—'} — rədd
            ediləcək. Görüş əvvəlki vaxtında qalacaq, təklif edən tərəfə bildiriş göndəriləcək.
          </p>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 1000))}
          placeholder="Səbəb (isteğe bağlı)"
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

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={close} disabled={busy}>İmtina</Button>
          <Button variant="danger" fullWidth loading={busy} onClick={submit}>Rədd et</Button>
        </div>
      </div>
    </Modal>
  )
}
