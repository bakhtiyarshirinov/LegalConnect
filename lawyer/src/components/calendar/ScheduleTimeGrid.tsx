import {
  DndContext, useDraggable, useDroppable,
  type DragEndEvent, closestCenter,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { START_HOUR, SLOT_MINUTES, SLOTS_PER_DAY, addDays, cellId, parseCellId, type GridSlot } from '../../lib/weekGrid'
import { timeToSlotInRange, slotToTimeInRange, nowOffsetPercent, isSameDay } from '../../lib/scheduleGrid'
import type { SlotDto } from '../../api/slots'

const ROW_HEIGHT = 28
const DAY_LABELS_AZ = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B']

interface Props {
  slots: SlotDto[]
  /** Start-of-day anchor of the visible range (Monday for week view, the day itself for day view). */
  rangeStart: Date
  daysToShow: 1 | 7
  disabled?: boolean
  /** Empty cell clicked — quick-create a slot starting here. */
  onCellClick: (startTime: Date) => void
  /** An existing slot clicked — parent shows the edit/delete popover. */
  onSlotClick: (slot: SlotDto) => void
  /** A free slot was dragged onto a different cell. */
  onSlotMove: (slot: SlotDto, newStart: Date) => void
}

function DroppableCell({ slot, onClick }: { slot: GridSlot; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId(slot) })
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        gridColumn: slot.dayIndex + 2,
        gridRow: slot.slotIndex + 1,
        borderTop: slot.slotIndex % 2 === 0 ? '1px solid #EDEDED' : '1px dashed #F5F5F5',
        borderLeft: '1px solid #EDEDED',
        background: isOver ? '#EFF6FF' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    />
  )
}

function DraggableSlot({
  slot, gridSlot, span, locked, onClick,
}: { slot: SlotDto; gridSlot: GridSlot; span: number; locked: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `slot:${slot.id}`,
    disabled: locked,
  })
  const booked = slot.isBooked

  return (
    <div
      ref={setNodeRef}
      {...(locked ? {} : listeners)}
      {...(locked ? {} : attributes)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        gridColumn: gridSlot.dayIndex + 2,
        gridRow: `${gridSlot.slotIndex + 1} / span ${span}`,
        margin: '1px 3px',
        borderRadius: 8,
        background: booked ? '#F5F5F5' : '#EEF2FF',
        border: `1px solid ${booked ? '#E5E5E5' : '#C7D2FE'}`,
        color: booked ? '#737373' : '#3730A3',
        padding: '4px 6px',
        fontSize: 11,
        lineHeight: 1.3,
        overflow: 'hidden',
        cursor: locked ? (booked ? 'pointer' : 'default') : 'grab',
        zIndex: isDragging ? 20 : 1,
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        boxShadow: isDragging ? '0 6px 18px rgba(0,0,0,0.18)' : 'none',
      }}
      title={booked ? 'Rezerv edilib — görüş üçün ayrılıb' : 'Sürüşdürüb vaxtı dəyişə, klik edib redaktə/silə bilərsiniz'}
    >
      <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
        {new Date(slot.startTime).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
        {'–'}
        {new Date(slot.endTime).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style={{ opacity: 0.85 }}>{booked ? 'Rezerv edilib' : 'Boş'}</div>
    </div>
  )
}

/**
 * Week/Day availability grid — same CSS-grid + @dnd-kit skeleton as
 * calendar/WeekTimeGrid.tsx (built for appointment reschedule), reused here for the
 * lawyer's own availability slots: droppable half-hour cells, draggable slot blocks,
 * the drop cell IS the snap. Differences from WeekTimeGrid:
 *   - daysToShow=1 (Day) or 7 (Week) over an arbitrary rangeStart, via
 *     lib/scheduleGrid's timeToSlotInRange/slotToTimeInRange (not Monday-locked).
 *   - clicking an EMPTY cell quick-creates a slot; clicking an EXISTING slot opens
 *     the edit/delete popover instead of dragging it.
 *   - booked slots are never draggable (locked) and visually distinct.
 *   - a red "now" line when the visible range includes today.
 */
export function ScheduleTimeGrid({ slots, rangeStart, daysToShow, disabled, onCellClick, onSlotClick, onSlotMove }: Props) {
  const rows = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i)
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(rangeStart, i))

  const positioned = slots
    .map((slot) => {
      const gridSlot = timeToSlotInRange(rangeStart, daysToShow, new Date(slot.startTime))
      if (!gridSlot) return null
      const durationSlots = Math.max(1, Math.round(slot.durationMinutes / SLOT_MINUTES))
      return { slot, gridSlot, span: durationSlots }
    })
    .filter((x): x is { slot: SlotDto; gridSlot: GridSlot; span: number } => x !== null)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const slotId = String(active.id).replace(/^slot:/, '')
    const targetCell = parseCellId(String(over.id))
    if (!targetCell) return

    const slot = slots.find((s) => s.id === slotId)
    if (!slot || slot.isBooked) return

    const newStart = slotToTimeInRange(rangeStart, targetCell)
    if (newStart.getTime() === new Date(slot.startTime).getTime()) return

    onSlotMove(slot, newStart)
  }

  return (
    <DndContext collisionDetection={closestCenter} modifiers={[restrictToParentElement]} onDragEnd={disabled ? undefined : handleDragEnd}>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `56px repeat(${daysToShow}, 1fr)`,
          gridTemplateRows: `auto repeat(${SLOTS_PER_DAY}, ${ROW_HEIGHT}px)`,
          border: '1px solid #EDEDED',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Day headers */}
        <div style={{ gridColumn: 1, gridRow: 1, borderBottom: '1px solid #EDEDED' }} />
        {days.map((d, i) => {
          const today = isSameDay(d, new Date())
          return (
            <div
              key={i}
              style={{
                gridColumn: i + 2, gridRow: 1, textAlign: 'center', padding: '8px 4px',
                borderBottom: '1px solid #EDEDED', borderLeft: '1px solid #EDEDED',
                fontSize: 11, fontWeight: 600, color: today ? '#1C7ED6' : '#6B6B6B',
                background: today ? '#EFF6FF' : 'transparent',
              }}
            >
              {daysToShow === 7 ? DAY_LABELS_AZ[i] : d.toLocaleDateString('az-AZ', { weekday: 'long' })}
              <div style={{ fontSize: 13, color: today ? '#1C7ED6' : '#0A0A0A', fontWeight: 700 }}>
                {d.getDate()}
              </div>
            </div>
          )
        })}

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

        {/* Droppable / clickable cells */}
        {days.map((_, dayIndex) =>
          rows.map((slotIndex) => (
            <DroppableCell
              key={`${dayIndex}-${slotIndex}`}
              slot={{ dayIndex, slotIndex }}
              onClick={() => {
                if (disabled) return
                onCellClick(slotToTimeInRange(rangeStart, { dayIndex, slotIndex }))
              }}
            />
          ))
        )}

        {/* Now line(s) */}
        {days.map((day, dayIndex) => {
          const pct = nowOffsetPercent(day)
          if (pct === null) return null
          return (
            <div
              key={`now-${dayIndex}`}
              style={{
                gridColumn: dayIndex + 2, gridRow: `2 / span ${SLOTS_PER_DAY}`,
                position: 'relative', pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute', left: 0, right: 0, top: `${pct}%`,
                  borderTop: '2px solid #EF4444', zIndex: 5,
                }}
              >
                <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              </div>
            </div>
          )
        })}

        {/* Slot blocks */}
        {positioned.map(({ slot, gridSlot, span }) => (
          <DraggableSlot
            key={slot.id}
            slot={slot}
            gridSlot={gridSlot}
            span={span}
            locked={!!disabled || slot.isBooked}
            onClick={() => onSlotClick(slot)}
          />
        ))}
      </div>
    </DndContext>
  )
}
