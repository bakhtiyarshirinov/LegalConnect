import api from './axios';

export const appointmentsApi = {
  getMyAppointments: (status?: string) =>
    api.get('/appointments/my', { params: status ? { status } : undefined }),

  getLawyerAppointments: (status?: string) =>
    api.get('/appointments/lawyer', { params: status ? { status } : undefined }),

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

  getStats: () =>
    api.get('/appointments/stats'),

  getLawyerStats: () =>
    api.get('/appointments/lawyer/stats'),
};
