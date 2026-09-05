import {
  DndContext, useDraggable, useDroppable,
  type DragEndEvent, closestCenter,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  START_HOUR, END_HOUR, SLOT_MINUTES, SLOTS_PER_DAY, DAYS_PER_WEEK,
  addDays, cellId, parseCellId, timeToSlot, slotToTime, durationToSpan,
  type GridSlot,
} from '../../lib/weekGrid'

export interface GridAppointment {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  title: string // counterparty name
  rescheduleStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected'
}

const STATUS_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  Pending: { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412' },
  Confirmed: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534' },
  Completed: { bg: '#EFF6FF', border: '#93C5FD', text: '#1E3A8A' },
  Cancelled: { bg: '#F5F5F5', border: '#E5E5E5', text: '#737373' },
}

const ROW_HEIGHT = 28
const DAY_LABELS = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar']

interface Props {
  appointments: GridAppointment[]
  weekStart: Date
  onWeekStartChange: (d: Date) => void
  /** A drop landed on a real, different slot — parent shows the confirm modal. */
  onDropProposal: (appointmentId: string, newTime: Date) => void
  /** Draggable disabled for this appointment (terminal status or already has a pending proposal). */
  isLocked: (appt: GridAppointment) => boolean
}

function DroppableCell({ slot }: { slot: GridSlot }) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId(slot) })
  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: slot.dayIndex + 2,
        gridRow: slot.slotIndex + 1,
        borderTop: slot.slotIndex % 2 === 0 ? '1px solid #EDEDED' : '1px dashed #F5F5F5',
        borderLeft: '1px solid #EDEDED',
        background: isOver ? '#EFF6FF' : 'transparent',
        transition: 'background 0.1s',
      }}
    />
  )
}

function DraggableAppointment({
  appt, slot, span, locked,
}: { appt: GridAppointment; slot: GridSlot; span: number; locked: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `appt:${appt.id}`,
    disabled: locked,
  })
  const color = STATUS_COLOR[appt.status] ?? STATUS_COLOR.Pending

  return (
    <div
      ref={setNodeRef}
      {...(locked ? {} : listeners)}
      {...(locked ? {} : attributes)}
      style={{
        gridColumn: slot.dayIndex + 2,
        gridRow: `${slot.slotIndex + 1} / span ${span}`,
        margin: '1px 3px',
        borderRadius: 8,
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        padding: '4px 6px',
        fontSize: 11,
        lineHeight: 1.3,
        overflow: 'hidden',
        cursor: locked ? 'default' : 'grab',
        zIndex: isDragging ? 20 : 1,
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        boxShadow: isDragging ? '0 6px 18px rgba(0,0,0,0.18)' : 'none',
      }}
      title={locked ? appt.title : `${appt.title} — sürüşdürüb yeni vaxt təklif edə bilərsiniz`}
    >
      <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {appt.title}
      </div>
      <div style={{ opacity: 0.85 }}>
        {new Date(appt.scheduledAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {appt.rescheduleStatus === 'Pending' && (
        <div
          style={{ fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title="Təyin olunmuş görüş vaxtının dəyişdirilməsi barədə təklif göndərildi"
        >
          ⏳ Vaxt dəyişikliyi təklifi
        </div>
      )}
    </div>
  )
}

/**
 * Google-Calendar-style week grid: days as columns, half-hour rows, built on plain CSS
 * grid (no calendar library). Drag-and-drop via @dnd-kit — each cell is a droppable,
 * each appointment a draggable. The drop target IS the snap: whichever half-hour cell
 * the pointer lands on is exactly what gets proposed, so there is no separate rounding
 * step to get wrong.
 */
export function WeekTimeGrid({ appointments, weekStart, onWeekStartChange, onDropProposal, isLocked }: Props) {
  const rows = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i)
  const days = Array.from({ length: DAYS_PER_WEEK }, (_, i) => addDays(weekStart, i))

  const positioned = appointments
    .map((appt) => {
      const slot = timeToSlot(weekStart, new Date(appt.scheduledAt))
      if (!slot) return null
      return { appt, slot, span: durationToSpan(appt.durationMinutes) }
    })
    .filter((x): x is { appt: GridAppointment; slot: GridSlot; span: number } => x !== null)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const apptId = String(active.id).replace(/^appt:/, '')
    const targetSlot = parseCellId(String(over.id))
    if (!targetSlot) return

    const appt = appointments.find((a) => a.id === apptId)
    if (!appt) return

    const newTime = slotToTime(weekStart, targetSlot)
    const original = new Date(appt.scheduledAt)
    if (newTime.getTime() === original.getTime()) return // dropped back where it started

    onDropProposal(apptId, newTime)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button
          onClick={() => onWeekStartChange(addDays(weekStart, -7))}
          style={{ background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {days[0].toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })} –{' '}
          {days[6].toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => onWeekStartChange(addDays(weekStart, 7))}
          style={{ background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex' }}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onWeekStartChange(new Date())}
          style={{ background: 'transparent', border: 'none', color: '#1C7ED6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Bu gün
        </button>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `56px repeat(${DAYS_PER_WEEK}, 1fr)`,
            gridTemplateRows: `auto repeat(${SLOTS_PER_DAY}, ${ROW_HEIGHT}px)`,
            border: '1px solid #EDEDED',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* Day headers */}
          <div style={{ gridColumn: 1, gridRow: 1, borderBottom: '1px solid #EDEDED' }} />
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                gridColumn: i + 2, gridRow: 1, textAlign: 'center', padding: '8px 4px',
                borderBottom: '1px solid #EDEDED', borderLeft: '1px solid #EDEDED',
                fontSize: 11, fontWeight: 600, color: '#6B6B6B',
              }}
              title={DAY_LABELS[i]}
            >
              {d.toLocaleDateString('az-AZ', { weekday: 'short' })}
              <div style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 700 }}>{d.getDate()}</div>
            </div>
          ))}

          {/* Time labels */}
          {rows.map((r) => (
            r % 2 === 0 && (
              <div
                key={`t${r}`}
                style={{
                  gridColumn: 1, gridRow: `${r + 1} / span 2`,
                  fontSize: 10, color: '#A3A3A3', textAlign: 'right', paddingRight: 6,
                  transform: 'translateY(-6px)',
                }}
              >
                {String(START_HOUR + r / 2).padStart(2, '0')}:00
              </div>
            )
          ))}

          {/* Droppable cells */}
          {days.map((_, dayIndex) =>
            rows.map((slotIndex) => (
              <DroppableCell key={`${dayIndex}-${slotIndex}`} slot={{ dayIndex, slotIndex }} />
            ))
          )}

          {/* Appointment blocks */}
          {positioned.map(({ appt, slot, span }) => (
            <DraggableAppointment
              key={appt.id}
              appt={appt}
              slot={slot}
              span={span}
              locked={isLocked(appt)}
            />
          ))}
        </div>
      </DndContext>

      <p style={{ fontSize: 11, color: '#A3A3A3', marginTop: 10 }}>
        Görüşü sürüşdürüb yeni xanaya buraxın — {SLOT_MINUTES} dəqiqəlik toran üzrə. Vaxt yalnız
        qarşı tərəf təsdiqlədikdən sonra dəyişəcək. Saatlar {START_HOUR}:00–{END_HOUR}:00 arası göstərilir.
      </p>
    </div>
  )
}
