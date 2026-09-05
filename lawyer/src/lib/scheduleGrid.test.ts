import { describe, it, expect } from 'vitest'
import {
  buildMonthMatrix, isSameDay, isSameMonth, dayKey, timeToSlotInRange, slotToTimeInRange,
  nowOffsetPercent, groupByDay, rangesOverlap, clampDurationMinutes, startOfDay,
  decideSlotMove,
} from './scheduleGrid'
import { START_HOUR, END_HOUR } from './weekGrid'

describe('scheduleGrid — Month view', () => {
  it('builds exactly 6 Monday-start weeks (42 days)', () => {
    const matrix = buildMonthMatrix(new Date('2026-09-15'))
    expect(matrix).toHaveLength(42)
    expect(matrix[0].getDay()).toBe(1) // Monday
  })

  it('covers every day of the target month', () => {
    const anchor = new Date('2026-09-15') // September 2026 has 30 days
    const matrix = buildMonthMatrix(anchor)
    const daysInMonth = matrix.filter((d) => isSameMonth(d, anchor))
    expect(daysInMonth).toHaveLength(30)
  })

  it('isSameMonth is false across a month boundary', () => {
    expect(isSameMonth(new Date('2026-09-30'), new Date('2026-10-01'))).toBe(false)
  })
})

describe('scheduleGrid — day helpers', () => {
  it('dayKey formats as yyyy-MM-dd in local time', () => {
    expect(dayKey(new Date(2026, 8, 5))).toBe('2026-09-05') // month is 0-indexed
  })

  it('isSameDay ignores time-of-day', () => {
    expect(isSameDay(new Date('2026-09-05T08:00:00'), new Date('2026-09-05T23:59:00'))).toBe(true)
    expect(isSameDay(new Date('2026-09-05T23:59:00'), new Date('2026-09-06T00:00:00'))).toBe(false)
  })
})

describe('scheduleGrid — arbitrary-range slot mapping (Day view)', () => {
  it('maps a time on a single-day range to dayIndex 0', () => {
    const day = new Date('2026-09-10T00:00:00')
    const dt = new Date('2026-09-10T09:15:00')
    const slot = timeToSlotInRange(day, 1, dt)
    expect(slot).toEqual({ dayIndex: 0, slotIndex: (9 - START_HOUR) * 2 })
  })

  it('round-trips through slotToTimeInRange, snapping to the half-hour', () => {
    const day = new Date('2026-09-10')
    const dt = new Date('2026-09-10T11:40:00')
    const slot = timeToSlotInRange(day, 1, dt)!
    const snapped = slotToTimeInRange(day, slot)
    expect(snapped.getHours()).toBe(11)
    expect(snapped.getMinutes()).toBe(30)
  })

  it('returns null for a day outside the visible range', () => {
    const day = new Date('2026-09-10')
    const outside = new Date('2026-09-12T10:00:00')
    expect(timeToSlotInRange(day, 1, outside)).toBeNull()
  })

  it('returns null outside START_HOUR..END_HOUR', () => {
    const day = new Date('2026-09-10')
    const tooLate = new Date('2026-09-10T21:00:00')
    expect(timeToSlotInRange(day, 1, tooLate)).toBeNull()
  })
})

describe('scheduleGrid — now line', () => {
  it('is null when the day is not today', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(nowOffsetPercent(yesterday, new Date())).toBeNull()
  })

  it('is a 0-100 percent within the visible hours when the day is today', () => {
    const now = new Date()
    now.setHours(START_HOUR, 0, 0, 0)
    const midDay = new Date(now)
    midDay.setMinutes(((END_HOUR - START_HOUR) * 60) / 2)
    expect(nowOffsetPercent(startOfDay(now), midDay)).toBeCloseTo(50, 0)
  })

  it('is null when now falls outside the visible hours even on today', () => {
    const now = new Date()
    now.setHours(23, 0, 0, 0)
    expect(nowOffsetPercent(startOfDay(now), now)).toBeNull()
  })
})

describe('scheduleGrid — grouping and overlap', () => {
  it('groups items by local calendar day', () => {
    const items = [
      { startTime: '2026-09-10T09:00:00' },
      { startTime: '2026-09-10T14:00:00' },
      { startTime: '2026-09-11T09:00:00' },
    ]
    const grouped = groupByDay(items)
    expect(grouped['2026-09-10']).toHaveLength(2)
    expect(grouped['2026-09-11']).toHaveLength(1)
  })

  it('detects an actual overlap', () => {
    const a = [new Date('2026-09-10T09:00:00'), new Date('2026-09-10T10:00:00')] as const
    const b = [new Date('2026-09-10T09:30:00'), new Date('2026-09-10T10:30:00')] as const
    expect(rangesOverlap(a[0], a[1], b[0], b[1])).toBe(true)
  })

  it('touching edges (back-to-back slots) do NOT count as overlapping', () => {
    const a = [new Date('2026-09-10T09:00:00'), new Date('2026-09-10T10:00:00')] as const
    const b = [new Date('2026-09-10T10:00:00'), new Date('2026-09-10T11:00:00')] as const
    expect(rangesOverlap(a[0], a[1], b[0], b[1])).toBe(false)
  })

  it('clampDurationMinutes keeps a drag/quick-create duration within sane bounds', () => {
    expect(clampDurationMinutes(5)).toBe(15)
    expect(clampDurationMinutes(60)).toBe(60)
    expect(clampDurationMinutes(9999)).toBe(480)
  })
})

describe('scheduleGrid — decideSlotMove (the drag-end → update-request step)', () => {
  const freeSlot = {
    id: 's1', startTime: '2026-09-10T10:00:00.000Z', endTime: '2026-09-10T11:00:00.000Z',
    isBooked: false, durationMinutes: 60,
  }

  it('drag ended on a real new cell → computes the new time and says to send the PATCH', () => {
    const newStart = new Date('2026-09-10T14:00:00.000Z')
    const decision = decideSlotMove(freeSlot, newStart, [freeSlot])

    expect(decision.send).toBe(true)
    if (decision.send) {
      expect(decision.slotId).toBe('s1')
      expect(decision.startTime.toISOString()).toBe('2026-09-10T14:00:00.000Z')
      expect(decision.endTime.toISOString()).toBe('2026-09-10T15:00:00.000Z') // duration preserved
    }
  })

  it('a booked slot is never sent, regardless of target — locked, not just "doesn\'t work"', () => {
    const booked = { ...freeSlot, isBooked: true }
    const decision = decideSlotMove(booked, new Date('2026-09-10T14:00:00.000Z'), [booked])

    expect(decision).toEqual({ send: false, reason: 'booked' })
  })

  it('dropping back on the exact same cell sends nothing (not an error, just a no-op)', () => {
    const sameTime = new Date(freeSlot.startTime)
    const decision = decideSlotMove(freeSlot, sameTime, [freeSlot])

    expect(decision).toEqual({ send: false, reason: 'no-change' })
  })

  it('dropping onto another slot\'s time is rejected client-side before any request', () => {
    const other = {
      id: 's2', startTime: '2026-09-10T14:00:00.000Z', endTime: '2026-09-10T15:00:00.000Z',
      isBooked: false, durationMinutes: 60,
    }
    const decision = decideSlotMove(freeSlot, new Date('2026-09-10T14:30:00.000Z'), [freeSlot, other])

    expect(decision).toEqual({ send: false, reason: 'collision' })
  })

  it('regression: moving a slot EARLIER by less than its own duration still sends the PATCH', () => {
    // This is the exact case the old create-then-delete flow got wrong.
    const newStart = new Date('2026-09-10T09:30:00.000Z') // 30 min earlier than the 60-min slot's own start
    const decision = decideSlotMove(freeSlot, newStart, [freeSlot])

    expect(decision.send).toBe(true)
  })
})
