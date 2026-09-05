import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { clampDurationMinutes } from '../../lib/scheduleGrid'

const DURATIONS = [15, 30, 45, 60, 90, 120]

interface Props {
  open: boolean
  /** Anchor date/time — the clicked empty cell (create) or the existing slot's start (edit). */
  startTime: Date | null
  /** Pre-fills the duration when editing an existing slot. */
  initialDurationMinutes?: number
  mode: 'create' | 'edit'
  busy?: boolean
  onClose: () => void
  onSubmit: (startTime: Date, durationMinutes: number) => void
}

/**
 * Quick slot create/edit — no full-page form. Opened by clicking an empty grid cell
 * (create, start time pre-filled from the click) or "Redaktə et" in SlotActionsPopover
 * (edit, both fields pre-filled). Same modal styling as AppointmentActionModal /
 * ProposeRescheduleModal elsewhere in the portal.
 */
export function SlotModal({ open, startTime, initialDurationMinutes, mode, busy, onClose, onSubmit }: Props) {
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)

  useEffect(() => {
    if (open && startTime) {
      setTime(
        `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
      )
      setDuration(initialDurationMinutes ?? 60)
    }
  }, [open, startTime, initialDurationMinutes])

  if (!startTime) return null

  const [h, m] = time.split(':').map(Number)
  const finalStart = new Date(startTime)
  finalStart.setHours(h, m, 0, 0)
  const finalEnd = new Date(finalStart.getTime() + duration * 60000)

  return (
    <Modal open={open} onClose={onClose} title={mode === 'create' ? 'Slot yarat' : 'Slotu redaktə et'} width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: '#6B6B6B' }}>
          {startTime.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Başlanğıc</label>
            <input
              type="time" value={time} step={900}
              onChange={(e) => setTime(e.target.value)}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Müddət</label>
            <select
              value={duration}
              onChange={(e) => setDuration(clampDurationMinutes(parseInt(e.target.value)))}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#fff' }}
            >
              {DURATIONS.map((d) => <option key={d} value={d}>{d} dəq</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#0A0A0A', fontWeight: 600 }}>
          {finalStart.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {finalEnd.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={busy}>İmtina</Button>
          <Button fullWidth loading={busy} onClick={() => onSubmit(finalStart, duration)}>
            {mode === 'create' ? 'Yarat' : 'Yadda saxla'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
