import api from './axios'

export interface LawyerProfile {
  id: string
  userId: string
  fullName: string
  email?: string
  phone?: string
  avatarUrl?: string
  bio?: string
  city?: string
  hourlyRate: number
  experienceYears: number
  isAvailable: boolean
  isVerified: boolean
  rating: number
  specializations?: string[]
  specializationIds?: number[]
}

export interface UpdateProfileData {
  bio?: string
  city?: string
  hourlyRate?: number
  experienceYears?: number
  isAvailable?: boolean
}

export interface LawyerStats {
  totalClients: number
  totalAppointments: number
  completedAppointments: number
  totalHoursWorked: number
  totalEarned: number
  averageRating: number
  reviewCount: number
  pendingAppointments: number
}

export async function getMyLawyerProfile(): Promise<LawyerProfile> {
  const res = await api.get<LawyerProfile>('/lawyers/me')
  return res.data
}

export async function updateProfile(data: UpdateProfileData): Promise<void> {
  await api.put('/lawyers/me', data)
}

export async function getLawyerStats(lawyerId: string): Promise<LawyerStats> {
  const res = await api.get<LawyerStats>(`/lawyers/${lawyerId}/stats`)
  return res.data
}

export async function updateSpecializations(ids: number[]): Promise<void> {
  await api.put('/lawyers/me/specializations', { specializationIds: ids })
}

export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<{ avatarUrl: string }>('/files/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.avatarUrl
}
