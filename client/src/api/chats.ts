import api from './axios'

export interface ChatDto {
  id: string
  lawyerFullName: string
  clientFullName: string
  lastMessageAt: string
}

export interface MessageDto {
  id: string
  senderId: string
  senderFullName: string
  content: string
  isRead: boolean
  sentAt: string
  type?: string
}

export const chatsApi = {
  getAll: (userId: string) =>
    api.get<ChatDto[]>('/chats', { params: { userId } }).then((r) => r.data),

  create: (clientId: string, lawyerId: string) =>
    api
      .post<{ chatId: string }>('/chats', { clientId, lawyerId })
      .then((r) => r.data),

  getMessages: (chatId: string) =>
    api.get<MessageDto[]>(`/chats/${chatId}/messages`).then((r) => r.data),

  sendMessage: (chatId: string, senderId: string, content: string) =>
    api
      .post<MessageDto>(`/chats/${chatId}/messages`, { senderId, content })
      .then((r) => r.data),
}
