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
