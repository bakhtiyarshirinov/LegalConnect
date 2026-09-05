import api from './axios'

export type AppointmentType = 'Online' | 'Offline'
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'

export interface Appointment {
  id: string
  clientId: string
  /** Matches the backend LawyerAppointmentDto field (was mistakenly `clientName`). */
  clientFullName: string
  lawyerId: string
  scheduledAt: string
  durationMinutes: number
  type: AppointmentType
  status: AppointmentStatus
  price: number
  notes?: string
  cancellationReason?: string
  rescheduleStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected'
  proposedScheduledAt?: string
  proposedByUserId?: string
  rescheduleReason?: string
}

export async function getByLawyer(lawyerId: string): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>(`/appointments/lawyer/${lawyerId}`)
  return res.data
}

export async function confirmAppointment(appointmentId: string, lawyerId: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/confirm?lawyerId=${lawyerId}`)
}

/** 4.2 — cancel: reason mandatory (min 10 chars, enforced server-side). */
export async function cancelAppointment(appointmentId: string, reason: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/cancel`, { reason })
}

/** 4.1 — delete: soft-cancel, reason optional. Row stays in history. */
export async function deleteAppointment(appointmentId: string, reason?: string): Promise<void> {
  await api.delete(`/appointments/${appointmentId}`, {
    params: reason ? { reason } : undefined,
  })
}


export async function completeAppointment(appointmentId: string, lawyerId: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/complete?lawyerId=${lawyerId}`)
}

/** Propose a new time — does NOT move the appointment until the other side accepts. */
export async function proposeReschedule(appointmentId: string, newScheduledAt: string, reason?: string): Promise<void> {
  await api.post(`/appointments/${appointmentId}/propose-reschedule`, { newScheduledAt, reason })
}

/** Only the non-proposing participant may call this (server enforces it, 403 otherwise). */
export async function respondReschedule(appointmentId: string, accept: boolean, reason?: string): Promise<void> {
  await api.post(`/appointments/${appointmentId}/respond-reschedule`, { accept, reason })
}
