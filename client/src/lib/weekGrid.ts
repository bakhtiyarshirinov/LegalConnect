// Pure time <-> grid-slot mapping for the week time-grid calendar.
// Kept dependency-free (no dnd-kit) so it's cheap to unit test the "snap to grid" logic.

export const START_HOUR = 8
export const END_HOUR = 20
export const SLOT_MINUTES = 30
export const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES // 24
export const DAYS_PER_WEEK = 7

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday-start week
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export interface GridSlot {
  dayIndex: number // 0..6, Monday..Sunday, relative to weekStart
  slotIndex: number // 0..SLOTS_PER_DAY-1, half-hour steps from START_HOUR
}

export function cellId(slot: GridSlot): string {
  return `cell:${slot.dayIndex}:${slot.slotIndex}`
}

export function parseCellId(id: string): GridSlot | null {
  const m = /^cell:(\d+):(\d+)$/.exec(id)
  if (!m) return null
  return { dayIndex: Number(m[1]), slotIndex: Number(m[2]) }
}

/** Maps a point in time to its grid cell, or null when outside the visible week/hours. */
export function timeToSlot(weekStart: Date, dt: Date): GridSlot | null {
  const ws = startOfWeek(weekStart)
  const msPerDay = 24 * 60 * 60 * 1000
  const dayIndex = Math.floor((dt.getTime() - ws.getTime()) / msPerDay)
  if (dayIndex < 0 || dayIndex >= DAYS_PER_WEEK) return null

  const minutesFromMidnight = dt.getHours() * 60 + dt.getMinutes()
  const minutesFromStart = minutesFromMidnight - START_HOUR * 60
  if (minutesFromStart < 0 || minutesFromStart >= (END_HOUR - START_HOUR) * 60) return null

  // Snap to the grid step — this IS the "snap to 30 minutes" rule: any time within a
  // half-hour cell maps to that cell's start.
  const slotIndex = Math.floor(minutesFromStart / SLOT_MINUTES)
  return { dayIndex, slotIndex }
}

/** Inverse of timeToSlot — the exact (snapped) start time a grid cell represents. */
export function slotToTime(weekStart: Date, slot: GridSlot): Date {
  const ws = startOfWeek(weekStart)
  const d = addDays(ws, slot.dayIndex)
  d.setHours(START_HOUR, 0, 0, 0)
  d.setMinutes(d.getMinutes() + slot.slotIndex * SLOT_MINUTES)
  return d
}

/** How many half-hour rows an appointment's duration spans (minimum 1). */
export function durationToSpan(durationMinutes: number): number {
  return Math.max(1, Math.round(durationMinutes / SLOT_MINUTES))
}
