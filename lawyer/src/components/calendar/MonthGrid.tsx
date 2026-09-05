import { buildMonthMatrix, isSameMonth, isSameDay, dayKey, groupByDay } from '../../lib/scheduleGrid'
import type { SlotDto } from '../../api/slots'

const DAY_LABELS_AZ = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B']

interface Props {
  monthAnchor: Date
  slots: SlotDto[]
  onDayClick: (day: Date) => void
}

/**
 * Compact Google-Calendar-style Month view: 6x7 day grid, a dot + count badge on
 * days that have configured slots, today/current-month highlighted. Clicking a day
 * switches the parent to Day view for that date (wired in Schedule.tsx).
 */
export function MonthGrid({ monthAnchor, slots, onDayClick }: Props) {
  const days = buildMonthMatrix(monthAnchor)
  const byDay = groupByDay(slots)
  const today = new Date()

  return (
    <div style={{ border: '1px solid #EDEDED', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_LABELS_AZ.map((label) => (
          <div key={label} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B6B6B', borderBottom: '1px solid #EDEDED' }}>
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '92px' }}>
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, monthAnchor)
          const isToday = isSameDay(day, today)
          const daySlots = byDay[dayKey(day)] ?? []
          const bookedCount = daySlots.filter((s) => s.isBooked).length
          const freeCount = daySlots.length - bookedCount

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              style={{
                border: '1px solid #F5F5F5', borderRadius: 0, background: isToday ? '#EFF6FF' : '#fff',
                padding: '6px 8px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                opacity: inMonth ? 1 : 0.4, fontFamily: 'Inter, sans-serif',
              }}
            >
              <span
                style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#1C7ED6' : '#0A0A0A',
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? '#DBEAFE' : 'transparent',
                }}
              >
                {day.getDate()}
              </span>
              {daySlots.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 'auto' }}>
                  {freeCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: '#EEF2FF', color: '#3730A3', borderRadius: 100, padding: '1px 6px' }}>
                      {freeCount} boş
                    </span>
                  )}
                  {bookedCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: '#F5F5F5', color: '#737373', borderRadius: 100, padding: '1px 6px' }}>
                      {bookedCount} rezerv
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
