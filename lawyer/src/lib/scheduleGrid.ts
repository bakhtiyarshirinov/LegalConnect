// Pure calendar-grid logic for the "Cədvəl" (availability) page — Month/Week/Day.
// Builds on lib/weekGrid.ts (hours/snap constants, GridSlot, cellId/parseCellId) instead
// of redefining them; adds what weekGrid.ts doesn't need for the appointment grid:
// month matrices, an arbitrary-length day range (Week reuses weekGrid's Monday-locked
// range; Day needs a single arbitrary day), the "now" line, and slot grouping/overlap.

import {
  START_HOUR, END_HOUR, SLOT_MINUTES,
  addDays, type GridSlot,
} from './weekGrid'

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** yyyy-MM-dd in LOCAL time — safe to use as a grouping/lookup key (unlike toISOString). */
export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 6 full Monday-start weeks (42 days) covering `monthAnchor`'s month, the standard
 * month-grid shape (leading/trailing days from adjacent months included, like Google
 * Calendar's Month view).
 */
export function buildMonthMatrix(monthAnchor: Date): Date[] {
  const firstOfMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1)
  const firstDow = firstOfMonth.getDay() // 0=Sun..6=Sat
  const leadingDays = firstDow === 0 ? 6 : firstDow - 1 // days to walk back to Monday
  const gridStart = addDays(firstOfMonth, -leadingDays)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

/** Maps a time to a grid cell within an arbitrary (not necessarily Monday-start) day range. */
export function timeToSlotInRange(rangeStart: Date, daysInRange: number, dt: Date): GridSlot | null {
  const rs = startOfDay(rangeStart)
  const msPerDay = 24 * 60 * 60 * 1000
  const dayIndex = Math.floor((startOfDay(dt).getTime() - rs.getTime()) / msPerDay)
  if (dayIndex < 0 || dayIndex >= daysInRange) return null

  const minutesFromStart = dt.getHours() * 60 + dt.getMinutes() - START_HOUR * 60
  if (minutesFromStart < 0 || minutesFromStart >= (END_HOUR - START_HOUR) * 60) return null

  return { dayIndex, slotIndex: Math.floor(minutesFromStart / SLOT_MINUTES) }
}

/** Inverse of timeToSlotInRange — exact (snapped) start time a cell represents. */
export function slotToTimeInRange(rangeStart: Date, slot: GridSlot): Date {
  const d = addDays(startOfDay(rangeStart), slot.dayIndex)
  d.setHours(START_HOUR, slot.slotIndex * SLOT_MINUTES, 0, 0)
  return d
}

/**
 * Vertical position of the "now" line as a 0-100 percentage of the visible hour
 * range, or null when `day` isn't today or `now` falls outside START_HOUR..END_HOUR.
 */
export function nowOffsetPercent(day: Date, now: Date = new Date()): number | null {
  if (!isSameDay(day, now)) return null
  const minutesFromStart = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60
  const totalMinutes = (END_HOUR - START_HOUR) * 60
  if (minutesFromStart < 0 || minutesFromStart > totalMinutes) return null
  return (minutesFromStart / totalMinutes) * 100
}

interface HasStartTime { startTime: string }

/** Groups items (availability slots or appointments) by local calendar day. */
export function groupByDay<T extends HasStartTime>(items: T[]): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const key = dayKey(new Date(item.startTime))
    ;(map[key] ??= []).push(item)
  }
  return map
}

/** True when [aStart,aEnd) and [bStart,bEnd) overlap — touching edges do NOT count. */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()
}

/** Clamps a slot duration into a sane range so drag/quick-create can't produce a 0 or huge slot. */
export function clampDurationMinutes(minutes: number, min = 15, max = 480): number {
  return Math.min(max, Math.max(min, minutes))
}

interface MovableSlot {
  id: string
  startTime: string
  endTime: string
  isBooked: boolean
  durationMinutes: number
}

export type SlotMoveDecision =
  | { send: true; slotId: string; startTime: Date; endTime: Date }
  | { send: false; reason: 'booked' | 'no-change' | 'collision' }

/**
 * Pure decision logic for "a slot was dropped on cell X" — this is exactly the step
 * that broke: the UI computed a snapped time correctly but either sent nothing, sent
 * the wrong payload, or the request itself was rejected by a bad backend overlap check.
 * ScheduleTimeGrid's onDragEnd calls slotToTimeInRange to get `newStart`, then this
 * function decides whether/what to PATCH — kept pure and separate from the dnd-kit
 * event so it's cheap to unit test.
 */
export function decideSlotMove(slot: MovableSlot, newStart: Date, allSlots: MovableSlot[]): SlotMoveDecision {
  if (slot.isBooked) return { send: false, reason: 'booked' }

  const newEnd = new Date(newStart.getTime() + slot.durationMinutes * 60000)
  if (newStart.getTime() === new Date(slot.startTime).getTime()) return { send: false, reason: 'no-change' }

  const collides = allSlots.some((s) =>
    s.id !== slot.id && rangesOverlap(newStart, newEnd, new Date(s.startTime), new Date(s.endTime)))
  if (collides) return { send: false, reason: 'collision' }

  return { send: true, slotId: slot.id, startTime: newStart, endTime: newEnd }
}
