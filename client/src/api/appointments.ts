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
  cancellationReason?: string
  rescheduleStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected'
  proposedScheduledAt?: string
  proposedByUserId?: string
  rescheduleReason?: string
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
  cancellationReason?: string
  rescheduleStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected'
  proposedScheduledAt?: string
  proposedByUserId?: string
  rescheduleReason?: string
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

  /** 4.2 — cancel: reason is mandatory (min 10 chars, enforced server-side). */
  cancel: (id: string, reason: string) =>
    api.put(`/appointments/${id}/cancel`, { reason }),

  /** 4.1 — delete: soft-cancel, reason optional. Row stays in history. */
  remove: (id: string, reason?: string) =>
    api.delete(`/appointments/${id}`, {
      params: reason ? { reason } : undefined,
    }),

  createMeeting: (id: string) =>
    api.post<{ meetingUrl: string }>(`/appointments/${id}/create-meeting`).then((r) => r.data),

  /** Propose a new time — does NOT move the appointment until the other side accepts. */
  proposeReschedule: (id: string, newScheduledAt: string, reason?: string) =>
    api.post(`/appointments/${id}/propose-reschedule`, { newScheduledAt, reason }),

  /** Only the non-proposing participant may call this (server enforces it, 403 otherwise). */
  respondReschedule: (id: string, accept: boolean, reason?: string) =>
    api.post(`/appointments/${id}/respond-reschedule`, { accept, reason }),
}
