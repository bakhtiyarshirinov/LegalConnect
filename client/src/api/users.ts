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

export const usersApi = {
  getMe: () => api.get<UserProfileDto>('/users/me').then((r) => r.data),
  updateMe: (data: { fullName: string; phone?: string }) =>
    api.put('/users/me', data),
}
