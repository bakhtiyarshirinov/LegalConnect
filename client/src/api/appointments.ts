import api from './axios'

export interface AppointmentDto {
  id: string
  lawyerId: string
  lawyerFullName: string
  scheduledAt: string
  durationMinutes: number
  status: string
  type: string
  price: number
  notes?: string
  meetingUrl?: string
}

export interface LawyerAppointmentDto {
  id: string
  clientId: string
  clientFullName: string
  scheduledAt: string
  durationMinutes: number
  status: string
  type: string
  price: number
  notes?: string
  meetingUrl?: string
}

export interface CreateAppointmentPayload {
  clientId: string
  lawyerId: string
  scheduledAt: string
  durationMinutes: number
  type: number  // 1=Online, 2=Offline  (matches AppointmentType enum)
  notes?: string
  slotId?: string
}

export const appointmentsApi = {
  create: (data: CreateAppointmentPayload) =>
    api.post<{ appointmentId: string }>('/appointments', data).then((r) => r.data),

  getByClient: (clientId: string) =>
    api
      .get<AppointmentDto[]>(`/appointments/client/${clientId}`)
      .then((r) => r.data),

  getByLawyer: (lawyerId: string) =>
    api
      .get<LawyerAppointmentDto[]>(`/appointments/lawyer/${lawyerId}`)
      .then((r) => r.data),

  confirm: (id: string, lawyerId: string) =>
    api.put(`/appointments/${id}/confirm`, null, {
      params: { lawyerId },
    }),

  cancel: (id: string, userId: string) =>
    api.put(`/appointments/${id}/cancel`, null, {
      params: { userId },
    }),

  createMeeting: (id: string) =>
    api.post<{ meetingUrl: string }>(`/appointments/${id}/create-meeting`).then((r) => r.data),
}
