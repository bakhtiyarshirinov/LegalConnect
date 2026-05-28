import api from './axios'

export interface SlotDto {
  id: string
  startTime: string
  endTime: string
  isBooked: boolean
  durationMinutes: number
}

export const slotsApi = {
  getAvailable: (lawyerId: string, date: string) => {
    // Normalize to YYYY-MM-DD to avoid any locale/format ambiguity
    const normalizedDate = new Date(date).toISOString().split('T')[0]
    return api
      .get<SlotDto[]>('/slots/available', { params: { lawyerId, date: normalizedDate } })
      .then((r) => r.data)
  },
}
