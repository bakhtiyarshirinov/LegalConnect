import api from './axios';

export const appointmentsApi = {
  getByClient: (clientId: string) =>
    api.get(`/appointments/client/${clientId}`),

  getByLawyer: (lawyerId: string) =>
    api.get(`/appointments/lawyer/${lawyerId}`),

  book: (data: {
    clientId: string;
    lawyerId: string;
    scheduledAt: string;
    durationMinutes: number;
    type: number;
    notes?: string;
    slotId?: string;
  }) => api.post('/appointments', data),

  confirm: (id: string, lawyerId: string) =>
    api.put(`/appointments/${id}/confirm`, null, { params: { lawyerId } }),

  cancel: (id: string, userId: string) =>
    api.put(`/appointments/${id}/cancel`, null, { params: { userId } }),

  complete: (id: string, lawyerId: string) =>
    api.put(`/appointments/${id}/complete`, null, { params: { lawyerId } }),

  createMeeting: (appointmentId: string) =>
    api.post(`/appointments/${appointmentId}/create-meeting`).then(r => r.data),
};
