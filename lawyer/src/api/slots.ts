import api from './axios'

export interface SlotDto {
  id: string
  startTime: string
  endTime: string
  isBooked: boolean
  durationMinutes: number
}

export async function getLawyerSlots(lawyerId: string, from: string, to: string): Promise<SlotDto[]> {
  const res = await api.get<SlotDto[]>('/slots', { params: { lawyerId, from, to } })
  return res.data
}

/** Single-slot create — used by quick-create (click an empty cell). */
export async function createSlot(startTime: string, endTime: string): Promise<string> {
  const res = await api.post<{ slotId: string }>('/slots', { startTime, endTime })
  return res.data.slotId
}

/**
 * Moves a free slot to a new time — drag-and-drop and the edit modal both use this.
 * Booked slots are rejected server-side with a 400 and a clear message; never call
 * this for a booked slot from the UI (they're locked from dragging already).
 */
export async function moveSlot(slotId: string, startTime: string, endTime: string): Promise<void> {
  await api.patch(`/slots/${slotId}`, { startTime, endTime })
}

export async function createBulkSlots(payload: {
  lawyerId: string
  date: string
  slotDurationMinutes: number
  startHour: number
  endHour: number
}): Promise<number> {
  const res = await api.post<{ count: number }>('/slots/bulk', payload)
  return res.data.count
}

export async function deleteSlot(slotId: string, lawyerId: string): Promise<void> {
  await api.delete(`/slots/${slotId}`, { params: { lawyerId } })
}
