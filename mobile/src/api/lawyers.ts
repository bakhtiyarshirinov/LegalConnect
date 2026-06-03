import api from './axios';

export const lawyersApi = {
  getAll: (params?: { city?: string; specializationId?: string }) =>
    api.get('/lawyers', { params }),

  getById: (id: string) =>
    api.get(`/lawyers/${id}`),

  getReviews: (id: string) =>
    api.get(`/reviews/lawyer/${id}`),

  getUnverified: () =>
    api.get('/lawyers/unverified'),

  verify: (id: string) =>
    api.post(`/lawyers/${id}/verify`),

  getMyProfile: () =>
    api.get('/lawyers/me'),

  getStats: (lawyerId: string) =>
    api.get(`/lawyers/${lawyerId}/stats`),

  uploadAvatar: (formData: FormData) =>
    api.post('/lawyers/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
