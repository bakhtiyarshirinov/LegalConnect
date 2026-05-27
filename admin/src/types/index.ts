export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  token: string
}

export interface PendingLawyer {
  id: string
  userId: string
  fullName: string
  email: string
  city: string
  licenseNumber: string
  experienceYears: number
  hourlyRate: number
  specializations: string[]
}

export interface UserAdmin {
  id: string
  fullName: string
  email: string
  role: string
  isVerified: boolean
  createdAt: string
}

export interface LoginResponse {
  token: string
  userId: string
  email: string
  fullName: string
  role: string
}
