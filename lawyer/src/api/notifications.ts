import api from './axios'

export interface NotificationDto {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

export const notificationsApi = {
  getAll: (userId: string) =>
    api
      .get<NotificationDto[]>('/notifications', { params: { userId } })
      .then((r) => r.data),

  getUnreadCount: (userId: string) =>
    api
      .get<{ count: number }>('/notifications/unread-count', { params: { userId } })
      .then((r) => r.data.count),

  markAsRead: (id: string, userId: string) =>
    api.put(`/notifications/${id}/read`, null, { params: { userId } }),

  markAllAsRead: (userId: string) =>
    api.put('/notifications/read-all', null, { params: { userId } }),
}
