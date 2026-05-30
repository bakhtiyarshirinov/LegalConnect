import api from './axios'

export interface UserProfileDto {
  userId: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role: string
  isVerified: boolean
  createdAt: string
}

export interface UserStatusDto {
  isOnline: boolean
  lastSeen: string | null
}

export const usersApi = {
  getMe: () => api.get<UserProfileDto>('/users/me').then((r) => r.data),
  updateMe: (data: { fullName: string; phone?: string }) =>
    api.put('/users/me', data),
  getStatus: (userId: string) =>
    api.get<UserStatusDto>(`/users/${userId}/status`).then((r) => r.data),
}
