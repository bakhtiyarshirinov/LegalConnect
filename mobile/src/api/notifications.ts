import api from './axios';

export const notificationsApi = {
  getAll: () =>
    api.get('/notifications'),

  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),
};
