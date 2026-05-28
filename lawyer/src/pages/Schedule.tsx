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
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function Schedule() {
  const { user, lawyerId } = useAuthStore()
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
    queryFn: () =>
      getLawyerSlots(
        effectiveLawyerId!,
        weekStart.toISOString(),
        weekEnd.toISOString()
      ),
    enabled: !!effectiveLawyerId,
  })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const dateUtc = new Date(form.date).toISOString()
      return createBulkSlots({
        lawyerId: effectiveLawyerId!,
        date: dateUtc,
        slotDurationMinutes: form.slotDuration,
        startHour: form.startHour,
        endHour: form.endHour,
      })
    },
    onSuccess: (count) => {
      toast.success(`${count} slot${count !== 1 ? 's' : ''} created`)
      qc.invalidateQueries({ queryKey: ['slots'] })
      setModalOpen(false)
    },
    onError: () => toast.error('Failed to create slots'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteSlot(slotId, effectiveLawyerId!),
    onSuccess: () => {
      toast.success('Slot deleted')
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
    onError: () => toast.error('Failed to delete slot'),
  })

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Schedule</h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>Manage your availability slots</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Day Schedule
        </Button>
      </motion.div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          style={{
            background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>
          {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} –{' '}
          {addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          style={{
            background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
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
            <div
              key={day.toISOString()}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${isToday ? '#0A0A0A' : '#E8E8E8'}`,
                borderRadius: 12,
                padding: 12,
                minHeight: 160,
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 600, color: isToday ? '#0A0A0A' : '#6B6B6B',
                marginBottom: 10, textAlign: 'center',
              }}>
                {formatDay(day)}
              </div>
              {isLoading ? (
                <div style={{ height: 40, background: '#F5F5F5', borderRadius: 8 }} />
              ) : daySlots.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#C4C4C4', fontSize: 12, paddingTop: 20 }}>
                  No slots
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        background: slot.isBooked ? '#F5F5F5' : '#0A0A0A',
                        color: slot.isBooked ? '#6B6B6B' : '#FFFFFF',
                        borderRadius: 7,
                        padding: '6px 8px',
                        fontSize: 11,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span>
                      {!slot.isBooked && (
                        <button
                          onClick={() => deleteMutation.mutate(slot.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#FFFFFF', padding: 0, display: 'flex', alignItems: 'center',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      {slot.isBooked && (
                        <span style={{ fontSize: 10, fontWeight: 600 }}>Booked</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Day Schedule Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Day Schedule" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Date</label>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={{
                border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
                fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Start Hour</label>
              <input
                type="number"
                min={0}
                max={23}
                value={form.startHour}
                onChange={(e) => setForm((f) => ({ ...f, startHour: parseInt(e.target.value) || 0 }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
                  fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>End Hour</label>
              <input
                type="number"
                min={1}
                max={24}
                value={form.endHour}
                onChange={(e) => setForm((f) => ({ ...f, endHour: parseInt(e.target.value) || 17 }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
                  fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Slot Duration</label>
            <select
              value={form.slotDuration}
              onChange={(e) => setForm((f) => ({ ...f, slotDuration: parseInt(e.target.value) }))}
              style={{
                border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
                fontSize: 14, cursor: 'pointer', outline: 'none',
                fontFamily: 'Inter, sans-serif', background: '#FFFFFF',
              }}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          <div style={{
            background: '#F5F5F5', borderRadius: 10, padding: '12px 14px',
            fontSize: 13, color: '#6B6B6B',
          }}>
            Will create {Math.floor((form.endHour - form.startHour) * 60 / form.slotDuration)} slots
            from {String(form.startHour).padStart(2, '0')}:00 to {String(form.endHour).padStart(2, '0')}:00
          </div>

          <Button
            fullWidth
            loading={bulkMutation.isPending}
            disabled={!form.date || form.endHour <= form.startHour}
            onClick={() => bulkMutation.mutate()}
          >
            Generate Slots
          </Button>
        </div>
      </Modal>
    </div>
  )
}
