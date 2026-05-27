import api from './axios'

export interface LawyerProfile {
  id: string
  userId: string
  fullName: string
  email: string
  phone?: string
  bio?: string
  city?: string
  hourlyRate: number
  experienceYears: number
  isAvailable: boolean
  rating: number
  specializations?: string[]
}

export interface UpdateProfileData {
  bio?: string
  city?: string
  hourlyRate?: number
  experienceYears?: number
  isAvailable?: boolean
}

export async function getMyProfile(userId: string): Promise<LawyerProfile> {
  const res = await api.get<LawyerProfile>(`/lawyers/me?userId=${userId}`)
  return res.data
}

export async function getByUserId(userId: string): Promise<LawyerProfile> {
  const res = await api.get<LawyerProfile>(`/lawyers/by-user/${userId}`)
  return res.data
}

export async function updateProfile(data: UpdateProfileData): Promise<void> {
  await api.put('/lawyers/me', data)
}
