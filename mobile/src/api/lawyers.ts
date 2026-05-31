import api from './axios';

export const lawyersApi = {
  getAll: (params?: { city?: string; specializationId?: string }) =>
    api.get('/lawyers', { params }),

  getById: (id: string) =>
    api.get(`/lawyers/${id}`),

  getReviews: (id: string) =>
    api.get(`/lawyers/${id}/reviews`),

  getUnverified: () =>
    api.get('/lawyers/unverified'),

  verify: (id: string) =>
    api.post(`/lawyers/${id}/verify`),

  getMyProfile: () =>
    api.get('/lawyers/me'),

  uploadAvatar: (formData: FormData) =>
    api.post('/lawyers/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
