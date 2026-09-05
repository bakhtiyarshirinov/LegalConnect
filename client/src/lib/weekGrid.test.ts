import { describe, it, expect } from 'vitest'
import {
  timeToSlot, slotToTime, cellId, parseCellId, durationToSpan, startOfWeek,
  START_HOUR, SLOT_MINUTES,
} from './weekGrid'

// A fixed Monday so the tests are deterministic regardless of when they run.
const MONDAY = new Date('2026-09-07T00:00:00') // a Monday

describe('weekGrid — drag-and-drop snap-to-grid mapping', () => {
  it('snaps a time that falls mid-slot down to the slot start (30-minute grid)', () => {
    const dt = new Date(MONDAY)
    dt.setHours(START_HOUR, 17, 0, 0) // 08:17 -> should snap into the 08:00-08:30 cell

    const slot = timeToSlot(MONDAY, dt)
    expect(slot).toEqual({ dayIndex: 0, slotIndex: 0 })

    const snappedBack = slotToTime(MONDAY, slot!)
    expect(snappedBack.getHours()).toBe(START_HOUR)
    expect(snappedBack.getMinutes()).toBe(0) // 17 minutes were snapped away
  })

  it('maps the second half-hour of the day to slotIndex 1', () => {
    const dt = new Date(MONDAY)
    dt.setHours(START_HOUR, 45, 0, 0) // 08:45 -> 08:30 cell

    expect(timeToSlot(MONDAY, dt)).toEqual({ dayIndex: 0, slotIndex: 1 })
  })

  it('maps a later weekday to the matching dayIndex', () => {
    const wednesday = new Date(MONDAY)
    wednesday.setDate(wednesday.getDate() + 2)
    wednesday.setHours(10, 5, 0, 0)

    const slot = timeToSlot(MONDAY, wednesday)
    expect(slot?.dayIndex).toBe(2)
    expect(slot?.slotIndex).toBe((10 - START_HOUR) * (60 / SLOT_MINUTES))
  })

  it('is a round trip: slotToTime(timeToSlot(t)) snaps to the grid, dropping sub-slot minutes', () => {
    const dt = new Date(MONDAY)
    dt.setHours(14, 51, 0, 0)

    const slot = timeToSlot(MONDAY, dt)!
    const snapped = slotToTime(MONDAY, slot)

    expect(snapped.getMinutes() % SLOT_MINUTES).toBe(0)
    expect(snapped.getHours()).toBe(14)
    expect(snapped.getMinutes()).toBe(30) // 14:51 -> 14:30 cell
  })

  it('returns null outside the visible week', () => {
    const nextWeek = new Date(MONDAY)
    nextWeek.setDate(nextWeek.getDate() + 8)
    expect(timeToSlot(MONDAY, nextWeek)).toBeNull()
  })

  it('returns null outside the visible hours', () => {
    const lateNight = new Date(MONDAY)
    lateNight.setHours(23, 0, 0, 0)
    expect(timeToSlot(MONDAY, lateNight)).toBeNull()
  })

  it('cellId/parseCellId round-trip so a dnd-kit droppable id resolves back to its slot', () => {
    const slot = { dayIndex: 3, slotIndex: 9 }
    expect(parseCellId(cellId(slot))).toEqual(slot)
  })

  it('parseCellId rejects a foreign droppable id (never crashes onDragEnd)', () => {
    expect(parseCellId('not-a-cell')).toBeNull()
  })

  it('durationToSpan rounds a 60-minute appointment to 2 half-hour rows', () => {
    expect(durationToSpan(60)).toBe(2)
    expect(durationToSpan(30)).toBe(1)
    expect(durationToSpan(90)).toBe(3)
    expect(durationToSpan(10)).toBe(1) // never collapses to 0 rows
  })

  it('startOfWeek always resolves to a Monday at midnight', () => {
    const sunday = new Date('2026-09-13T15:30:00')
    const monday = startOfWeek(sunday)
    expect(monday.getDay()).toBe(1)
    expect(monday.getHours()).toBe(0)
  })
})
