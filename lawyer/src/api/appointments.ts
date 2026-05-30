import api from './axios'

export type AppointmentType = 'Online' | 'Offline'
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  lawyerId: string
  scheduledAt: string
  durationMinutes: number
  type: AppointmentType
  status: AppointmentStatus
  price: number
  notes?: string
}

export async function getByLawyer(lawyerId: string): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>(`/appointments/lawyer/${lawyerId}`)
  return res.data
}

export async function confirmAppointment(appointmentId: string, lawyerId: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/confirm?lawyerId=${lawyerId}`)
}

export async function cancelAppointment(appointmentId: string, userId: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/cancel?userId=${userId}`)
}


export async function completeAppointment(appointmentId: string, lawyerId: string): Promise<void> {
  await api.put(`/appointments/${appointmentId}/complete?lawyerId=${lawyerId}`)
}
