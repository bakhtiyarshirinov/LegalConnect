import api from './axios';

export const chatsApi = {
  getMyChats: (userId: string) =>
    api.get('/chats', { params: { userId } }),

  getOrCreate: (data: { clientId: string; lawyerId: string }) =>
    api.post('/chats', data),

  getMessages: (chatId: string) =>
    api.get(`/chats/${chatId}/messages`),

  sendMessage: (chatId: string, senderId: string, content: string) =>
    api.post(`/chats/${chatId}/messages`, { senderId, content }),

  markAsRead: (chatId: string, userId: string) =>
    api.put(`/chats/${chatId}/read`, null, { params: { userId } }),

  getUnreadCount: (userId: string) =>
    api.get('/chats/unread-count', { params: { userId } }),
};
