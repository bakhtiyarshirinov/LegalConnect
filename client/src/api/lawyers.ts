import api from './axios'

export interface LawyerDto {
  id: string
  fullName: string
  city: string
  bio: string
  experienceYears: number
  hourlyRate: number
  rating: number
  reviewCount: number
  isVerified: boolean
  specializations: string[]
}

export interface LawyerDetailDto extends LawyerDto {
  userId: string
  licenseNumber: string
  isAvailable: boolean
  isOnline: boolean
}

export interface LawyersFilter {
  city?: string
  specializationId?: number
  maxRate?: number
}

export interface UpdateProfilePayload {
  bio: string
  city: string
  hourlyRate: number
  experienceYears: number
  isAvailable: boolean
}

export const lawyersApi = {
  getAll: (filters?: LawyersFilter) =>
    api
      .get<LawyerDto[]>('/lawyers', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<LawyerDetailDto>(`/lawyers/${id}`).then((r) => r.data),

  getMyProfile: () =>
    api.get<LawyerDetailDto>('/lawyers/me').then((r) => r.data),

  updateMyProfile: (data: UpdateProfilePayload) =>
    api.put('/lawyers/me', data),
}
