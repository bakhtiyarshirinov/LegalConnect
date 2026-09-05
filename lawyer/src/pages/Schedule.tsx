import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getLawyerSlots, createBulkSlots, createSlot, moveSlot as moveSlotApi, deleteSlot, type SlotDto } from '../api/slots'
import { getMyLawyerProfile } from '../api/profile'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useVerificationStatus } from '../hooks/useVerificationStatus'
import { addDays, startOfWeek } from '../lib/weekGrid'
import { startOfDay, buildMonthMatrix, decideSlotMove } from '../lib/scheduleGrid'
import { ScheduleTimeGrid } from '../components/calendar/ScheduleTimeGrid'
import { MonthGrid } from '../components/calendar/MonthGrid'
import { SlotModal } from '../components/calendar/SlotModal'
import { SlotActionsPopover } from '../components/calendar/SlotActionsPopover'

type ViewMode = 'month' | 'week' | 'day'
const VIEWS: { value: ViewMode; label: string }[] = [
  { value: 'month', label: 'Ay' },
  { value: 'week', label: 'Həftə' },
  { value: 'day', label: 'Gün' },
]

function parseDateParam(v: string | null): Date {
  if (!v) return startOfDay(new Date())
  const d = new Date(v + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? startOfDay(new Date()) : d
}

function dateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Schedule() {
  const { user, lawyerId } = useAuthStore()
  const { isRevoked } = useVerificationStatus()
  const qc = useQueryClient()

  // View + current date are kept in the URL (?view=week&date=2026-09-10) so a
  // refresh / shared link lands back on the same view, like Google Calendar.
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as ViewMode) ?? 'week'
  const anchor = parseDateParam(params.get('date'))

  const setView = (v: ViewMode) => setParams((p) => { p.set('view', v); return p }, { replace: true })
  const setAnchor = (d: Date) => setParams((p) => { p.set('date', dateParam(d)); return p }, { replace: true })

  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startHour: 9, endHour: 17, slotDuration: 60,
  })
  const [createTarget, setCreateTarget] = useState<Date | null>(null)
  const [editTarget, setEditTarget] = useState<SlotDto | null>(null)
  const [popoverSlot, setPopoverSlot] = useState<SlotDto | null>(null)
  const [busySlotId, setBusySlotId] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile', user?.userId],
    queryFn: getMyLawyerProfile,
    enabled: !!user && !lawyerId,
  })
  const effectiveLawyerId = lawyerId ?? profile?.id

  // Fetch range depends on the view — Month needs the full 6-week matrix so leading
  // /trailing days from adjacent months still show their slot counts.
  const rangeStart =
    view === 'month' ? buildMonthMatrix(anchor)[0]
      : view === 'week' ? startOfWeek(anchor)
        : startOfDay(anchor)
  const rangeEnd =
    view === 'month' ? addDays(rangeStart, 42)
      : view === 'week' ? addDays(rangeStart, 7)
        : addDays(rangeStart, 1)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', effectiveLawyerId, view, rangeStart.toISOString()],
    queryFn: () => getLawyerSlots(effectiveLawyerId!, rangeStart.toISOString(), rangeEnd.toISOString()),
    enabled: !!effectiveLawyerId,
  })

  const invalidateSlots = () => qc.invalidateQueries({ queryKey: ['slots', effectiveLawyerId] })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const dateUtc = new Date(bulkForm.date).toISOString()
      return createBulkSlots({ lawyerId: effectiveLawyerId!, date: dateUtc, slotDurationMinutes: bulkForm.slotDuration, startHour: bulkForm.startHour, endHour: bulkForm.endHour })
    },
    onSuccess: (count) => { toast.success(`${count} slot yaradıldı`); invalidateSlots(); setBulkModalOpen(false) },
    onError: () => toast.error('Slotlar yaradılmadı'),
  })

  const quickCreate = async (start: Date, durationMinutes: number) => {
    try {
      await createSlot(start.toISOString(), new Date(start.getTime() + durationMinutes * 60000).toISOString())
      toast.success('Slot yaradıldı')
      invalidateSlots()
      setCreateTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Slot yaradılmadı — vaxt üst-üstə düşür ola bilər')
    }
  }

  const editSlot = async (start: Date, durationMinutes: number) => {
    if (!editTarget) return
    if (editTarget.isBooked) {
      toast.error('Rezerv edilmiş slot redaktə edilə bilməz')
      return
    }
    const end = new Date(start.getTime() + durationMinutes * 60000)
    try {
      await moveSlotApi(editTarget.id, start.toISOString(), end.toISOString())
      toast.success('Slot yeniləndi')
      invalidateSlots()
      setEditTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Slot yenilənmədi — vaxt üst-üstə düşür ola bilər')
    }
  }

  const moveSlot = async (slot: SlotDto, newStart: Date) => {
    // decideSlotMove is the same pure function covered by scheduleGrid.test.ts — the
    // component just acts on its verdict instead of re-implementing the checks inline.
    const decision = decideSlotMove(slot, newStart, slots)
    if (!decision.send) {
      if (decision.reason === 'booked') toast.error('Rezerv edilmiş slot köçürülə bilməz — bu vaxta artıq müştəri görüşü var')
      else if (decision.reason === 'collision') toast.error('Bu vaxtda artıq slot var')
      return // 'no-change' (dropped back on its own cell) — nothing to do, no error either
    }

    setBusySlotId(slot.id)
    try {
      // Single atomic PATCH — updates this slot's own time range server-side. (The
      // previous "create at new time, then delete the old one" approach is what broke
      // drag-and-drop: CreateSlotCommand's overlap check saw the not-yet-deleted original
      // slot and rejected any move that landed within the slot's own original duration.)
      await moveSlotApi(decision.slotId, decision.startTime.toISOString(), decision.endTime.toISOString())
      toast.success('Slot köçürüldü')
      invalidateSlots()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Slot köçürülmədi')
    } finally {
      setBusySlotId(null)
    }
  }

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => deleteSlot(slotId, effectiveLawyerId!),
    onSuccess: () => { toast.success('Slot silindi'); invalidateSlots(); setPopoverSlot(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Slot silinmədi'),
  })

  const step = view === 'month' ? 30 /* ~1 month */ : view === 'week' ? 7 : 1
  const goPrev = () => setAnchor(addDays(anchor, -step))
  const goNext = () => setAnchor(addDays(anchor, step))
  const goToday = () => setAnchor(startOfDay(new Date()))

  const headerLabel =
    view === 'month' ? anchor.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
      : view === 'week' ? `${rangeStart.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })} – ${addDays(rangeStart, 6).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : anchor.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Mənim cədvəlim</h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>Mövcud slotlarınızı idarə edin</p>
        </div>
        <Button onClick={() => setBulkModalOpen(true)} disabled={isRevoked} variant="secondary">
          <Plus size={16} /> Günlük cədvəl əlavə et
        </Button>
      </motion.div>

      {/* Toolbar: prev/next/today + view switcher (Month/Week/Day) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={goPrev} style={navBtn}><ChevronLeft size={16} /></button>
          <button onClick={goToday} style={{ ...navBtn, width: 'auto', padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>Bu gün</button>
          <button onClick={goNext} style={navBtn}><ChevronRight size={16} /></button>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginLeft: 6, textTransform: 'capitalize' }}>{headerLabel}</span>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#F5F5F5', padding: 4, borderRadius: 10 }}>
          {VIEWS.map((v) => (
            <button key={v.value} onClick={() => setView(v.value)}
              style={{
                padding: '7px 16px', borderRadius: 7, border: 'none',
                background: view === v.value ? '#fff' : 'transparent',
                color: view === v.value ? '#0A0A0A' : '#6B6B6B',
                fontWeight: view === v.value ? 600 : 500, fontSize: 13, cursor: 'pointer',
                boxShadow: view === v.value ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: 400, background: '#F5F5F5', borderRadius: 12 }} />
      ) : view === 'month' ? (
        <MonthGrid
          monthAnchor={anchor}
          slots={slots}
          onDayClick={(day) => { setAnchor(day); setView('day') }}
        />
      ) : (
        <>
          <div className="schedule-grid-scroll" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: view === 'week' ? 640 : 280 }}>
              <ScheduleTimeGrid
                slots={slots}
                rangeStart={rangeStart}
                daysToShow={view === 'week' ? 7 : 1}
                disabled={isRevoked || !!busySlotId}
                onCellClick={(start) => setCreateTarget(start)}
                onSlotClick={(slot) => setPopoverSlot(slot)}
                onSlotMove={moveSlot}
              />
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#A3A3A3', marginTop: 10 }}>
            Boş xananı klikləyib yeni slot yaradın, mövcud slotu sürüşdürüb vaxtını dəyişin,
            klikləyib redaktə/silin. Rezerv edilmiş slotlar (boz) sadəcə baxış üçündür.
          </p>
        </>
      )}

      {/* Quick create (click an empty cell) */}
      <SlotModal
        open={!!createTarget}
        startTime={createTarget}
        mode="create"
        onClose={() => setCreateTarget(null)}
        onSubmit={quickCreate}
      />

      {/* Edit (from the popover) */}
      <SlotModal
        open={!!editTarget}
        startTime={editTarget ? new Date(editTarget.startTime) : null}
        initialDurationMinutes={editTarget?.durationMinutes}
        mode="edit"
        onClose={() => setEditTarget(null)}
        onSubmit={editSlot}
      />

      {/* Click-on-slot menu: Redaktə et / Sil (or read-only info if booked) */}
      <SlotActionsPopover
        slot={popoverSlot}
        busy={deleteSlotMutation.isPending}
        onClose={() => setPopoverSlot(null)}
        onEdit={() => { setEditTarget(popoverSlot); setPopoverSlot(null) }}
        onDelete={() => { if (popoverSlot) deleteSlotMutation.mutate(popoverSlot.id) }}
      />

      <Modal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Tarix seçin" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Tarix seçin</label>
            <input type="date" value={bulkForm.date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBulkForm((f) => ({ ...f, date: e.target.value }))}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Başlanğıc saatı</label>
              <select value={bulkForm.startHour}
                onChange={(e) => { const v = parseInt(e.target.value); setBulkForm((f) => ({ ...f, startHour: v, endHour: f.endHour <= v ? v + 1 : f.endHour })) }}
                style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Bitmə saatı</label>
              <select value={bulkForm.endHour}
                onChange={(e) => setBulkForm((f) => ({ ...f, endHour: parseInt(e.target.value) }))}
                style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 7).filter((h) => h > bulkForm.startHour).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Slot müddəti</label>
            <select value={bulkForm.slotDuration}
              onChange={(e) => setBulkForm((f) => ({ ...f, slotDuration: parseInt(e.target.value) }))}
              style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}
            >
              <option value={30}>30 dəqiqə</option>
              <option value={60}>60 dəqiqə</option>
              <option value={90}>90 dəqiqə</option>
              <option value={120}>120 dəqiqə</option>
            </select>
          </div>

          {(() => {
            const count = Math.floor((bulkForm.endHour - bulkForm.startHour) * 60 / bulkForm.slotDuration)
            const previews = Array.from({ length: Math.min(count, 3) }, (_, i) => {
              const s = bulkForm.startHour + (i * bulkForm.slotDuration) / 60
              const e = s + bulkForm.slotDuration / 60
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

          <Button fullWidth loading={bulkMutation.isPending} disabled={!bulkForm.date || bulkForm.endHour <= bulkForm.startHour} onClick={() => bulkMutation.mutate()}>
            Slotlar yarat
          </Button>
        </div>
      </Modal>
    </div>
  )
}

const navBtn: CSSProperties = {
  background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8,
  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0A0A0A',
}
