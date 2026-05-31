import api from './axios';

export const chatsApi = {
  getMyChats: () =>
    api.get('/chats'),

  getOrCreate: (lawyerId: string) =>
    api.post('/chats', { lawyerId }),

  getMessages: (chatId: string) =>
    api.get(`/chats/${chatId}/messages`),

  sendMessage: (chatId: string, content: string) =>
    api.post(`/chats/${chatId}/messages`, { content }),

  markAsRead: (chatId: string) =>
    api.put(`/chats/${chatId}/read`),

  getUnreadCount: () =>
    api.get('/chats/unread-count'),
};
