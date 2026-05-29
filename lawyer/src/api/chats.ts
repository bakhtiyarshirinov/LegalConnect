import api from './axios'

export interface Chat {
  id: string
  clientFullName: string
  lawyerFullName: string
  lastMessageAt?: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  sentAt: string
  type?: string
}

export interface SendMessageRequest {
  senderId: string
  content: string
}

export async function getChats(userId: string): Promise<Chat[]> {
  const res = await api.get<Chat[]>(`/chats?userId=${userId}`)
  return res.data
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const res = await api.get<Message[]>(`/chats/${chatId}/messages`)
  return res.data
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const res = await api.post<Message>(`/chats/${chatId}/messages`, { senderId, content })
  return res.data
}
