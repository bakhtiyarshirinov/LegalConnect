import api from './axios';

export const lawyersApi = {
  getAll: (params?: { city?: string; specializationId?: string }) =>
    api.get('/lawyers', { params }),

  getById: (id: string) =>
    api.get(`/lawyers/${id}`),

  getReviews: (id: string) =>
    api.get(`/reviews/lawyer/${id}`),

  getUnverified: () =>
    api.get('/admin/lawyers/pending'),

  verify: (id: string) =>
    api.put(`/admin/lawyers/${id}/verify`),

  getMyProfile: () =>
    api.get('/lawyers/me'),

  getStats: (lawyerId: string) =>
    api.get(`/lawyers/${lawyerId}/stats`),

  uploadAvatar: (formData: FormData) =>
    api.post('/files/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
