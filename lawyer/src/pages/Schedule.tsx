import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getLawyerSlots, createBulkSlots, deleteSlot, type SlotDto } from '../api/slots'
import { getMyLawyerProfile } from '../api/profile'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useVerificationStatus } from '../hooks/useVerificationStatus'

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function Schedule() {
  const { user, lawyerId } = useAuthStore()
  const { isRevoked } = useVerificationStatus()
  const qc = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startHour: 9,
    endHour: 17,
    slotDuration: 60,
  })

  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile'],
    queryFn: getMyLawyerProfile,
    enabled: !!user && !lawyerId,
  })
  const effectiveLawyerId = lawyerId ?? profile?.id
  const weekEnd = addDays(weekStart, 7)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', effectiveLawyerId, weekStart.toISOString()],
    queryFn: () => getLawyerSlots(effectiveLawyerId!, weekStart.toISOString(), weekEnd.toISOString()),
    enabled: !!effectiveLawyerId,
  })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const dateUtc = new Date(form.date).toISOString()
      return createBulkSlots({ lawyerId: effectiveLawyerId!, date: dateUtc, slotDurationMinutes: form.slotDuration, startHour: form.startHour, endHour: form.endHour })
    },
    onSuccess: (count) => {
      toast.success(`${count} slot yaradıldı`)
      qc.invalidateQueries({ queryKey: ['slots'] })
      setModalOpen(false)
    },
    onError: () => toast.error('Slotlar yaradılmadı'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteSlot(slotId, effectiveLawyerId!),
    onSuccess: () => { toast.success('Slot silindi'); qc.invalidateQueries({ queryKey: ['slots'] }) },
    onError: () => toast.error('Slot silinmədi'),
  })

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const slotsByDay = useMemo(() => {
    const map: Record<string, SlotDto[]> = {}
    weekDays.forEach((d) => { map[d.toDateString()] = [] })
    slots.forEach((s) => {
      const d = new Date(s.startTime)
      const key = d.toDateString()
      if (map[key]) map[key].push(s)
    })
    return map
  }, [slots, weekDays])

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Mənim cədvəlim</h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>Mövcud slotlarınızı idarə edin</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={isRevoked}>
          <Plus size={16} /> Günlük cədvəl əlavə et
        </Button>
      </motion.div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setWeekStart((w) => addDays(w, -7))}
          style={{ background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>
          {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} –{' '}
          {addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekStart((w) => addDays(w, 7))}
          style={{ background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date())
          const daySlots = slotsByDay[day.toDateString()] ?? []
          return (
            <div key={day.toISOString()} style={{ background: '#FFFFFF', border: `1px solid ${isToday ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 12, padding: 12, minHeight: 160 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? '#0A0A0A' : '#6B6B6B', marginBottom: 10, textAlign: 'center' }}>
                {formatDay(day)}
              </div>
              {isLoading ? (
                <div style={{ height: 40, background: '#F5F5F5', borderRadius: 8 }} />
              ) : daySlots.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#C4C4C4', fontSize: 12, paddingTop: 20 }}>Slot yoxdur</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {daySlots.map((slot) => (
                    <div key={slot.id} style={{ background: slot.isBooked ? '#F5F5F5' : '#0A0A0A', color: slot.isBooked ? '#6B6B6B' : '#FFFFFF', borderRadius: 7, padding: '6px 8px', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span>
                      {!slot.isBooked && !isRevoked && (
                        <button onClick={() => deleteMutation.mutate(slot.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      {slot.isBooked && <span style={{ fontSize: 10, fontWeight: 600 }}>Rezerv edilib</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tarix seçin" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Tarix seçin</label>
            <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Başlanğıc saatı</label>
              <select value={form.startHour}
                onChange={(e) => { const v = parseInt(e.target.value); setForm((f) => ({ ...f, startHour: v, endHour: f.endHour <= v ? v + 1 : f.endHour })) }}
                style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Bitmə saatı</label>
              <select value={form.endHour}
                onChange={(e) => setForm((f) => ({ ...f, endHour: parseInt(e.target.value) }))}
                style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 7).filter((h) => h > form.startHour).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Slot müddəti</label>
            <select value={form.slotDuration}
              onChange={(e) => setForm((f) => ({ ...f, slotDuration: parseInt(e.target.value) }))}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
            >
              <option value={30}>30 dəqiqə</option>
              <option value={60}>60 dəqiqə</option>
              <option value={90}>90 dəqiqə</option>
              <option value={120}>120 dəqiqə</option>
            </select>
          </div>

          {(() => {
            const count = Math.floor((form.endHour - form.startHour) * 60 / form.slotDuration)
            const previews = Array.from({ length: Math.min(count, 3) }, (_, i) => {
              const s = form.startHour + (i * form.slotDuration) / 60
              const e = s + form.slotDuration / 60
              const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:00`
              return `${fmt(s)}–${fmt(e)}`
            })
            return (
              <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6B6B6B' }}>
                <strong style={{ color: '#0A0A0A' }}>{count} slot yaradılacaq</strong>
                {count > 0 && <span>: {previews.join(', ')}{count > 3 ? ', …' : ''}</span>}
              </div>
            )
          })()}

          <Button fullWidth loading={bulkMutation.isPending} disabled={!form.date || form.endHour <= form.startHour} onClick={() => bulkMutation.mutate()}>
            Slotlar yarat
          </Button>
        </div>
      </Modal>
    </div>
  )
}
