import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

const REASON_MIN = 10

export type AppointmentAction = 'cancel' | 'delete'

interface Props {
  open: boolean
  action: AppointmentAction
  /** Name of the other side, shown in the title (optional). */
  counterpartyName?: string
  onClose: () => void
  /** Perform the request. Rejects → modal stays open, caller shows the toast. */
  onConfirm: (reason: string | undefined) => Promise<unknown>
}

/**
 * One modal, two entry points (mirrors the admin cancel-verification modal from Phase 6.1):
 *   action="cancel" — reason REQUIRED (min 10 chars), used for PUT /appointments/{id}/cancel
 *   action="delete" — reason OPTIONAL, used for DELETE /appointments/{id}
 * Both are a soft-cancel on the server; the row stays in history.
 */
export function AppointmentActionModal({
  open, action, counterpartyName, onClose, onConfirm,
}: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setReason(''); setBusy(false) }
  }, [open])

  const isCancel = action === 'cancel'
  const reasonValid = !isCancel || reason.trim().length >= REASON_MIN

  const close = () => { if (!busy) onClose() }

  const submit = async () => {
    if (busy || !reasonValid) return
    setBusy(true)
    try {
      await onConfirm(reason.trim() || undefined)
      onClose()
    } catch {
      setBusy(false) // keep the modal open; the caller already toasted
    }
  }

  const title = isCancel ? 'Görüşü ləğv et' : 'Görüşü sil'

  return (
    <Modal open={open} onClose={close} title={counterpartyName ? `${title} — ${counterpartyName}` : title} width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isCancel ? (
          <div style={{ display: 'flex', gap: 10, padding: 12, background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: 12 }}>
            <AlertTriangle size={18} color="#E03131" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: '#611A15', lineHeight: 1.5 }}>
              Görüş ləğv ediləcək və vaxt yuvası yenidən açıq olacaq. Qarşı tərəf səbəblə birlikdə
              bildiriş alacaq. Bu əməliyyat geri qaytarıla bilməz.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>
            Görüş siyahınızdan silinəcək. Tarixçədə saxlanılır, vaxt yuvası yenidən açıq olur,
            qarşı tərəf bildiriş alır.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>
            Səbəb {isCancel
              ? <span style={{ color: '#E03131', fontWeight: 400 }}>(mütləq)</span>
              : <span style={{ color: '#A3A3A3', fontWeight: 400 }}>(isteğe bağlı)</span>}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            placeholder={isCancel ? 'Ən azı 10 simvol — səbəb qarşı tərəfə göndəriləcək' : 'Səbəb (isteğe bağlı)'}
            rows={4}
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
          {isCancel && (
            <div style={{ fontSize: 11, color: '#A3A3A3', textAlign: 'right' }}>
              {reason.trim().length < REASON_MIN
                ? `daha ${Math.max(REASON_MIN - reason.trim().length, 0)} simvol`
                : `${reason.trim().length}/1000`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={close} disabled={busy}>İmtina</Button>
          <Button
            variant="danger"
            fullWidth
            loading={busy}
            disabled={!reasonValid}
            onClick={submit}
          >
            {isCancel ? 'Ləğvi təsdiqlə' : 'Sil'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
