import api from './axios'
import type { AuthResult } from '../store/authStore'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterClientPayload {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface RegisterLawyerPayload {
  fullName: string
  email: string
  password: string
  phone?: string
  bio: string
  city: string
  licenseNumber: string
  experienceYears: number
  hourlyRate: number
  specializationIds: number[]
}

export interface VerifyOtpPayload {
  email: string
  code: string
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResult>('/auth/login', data).then((r) => r.data),

  registerClient: (data: RegisterClientPayload) =>
    api.post<AuthResult>('/auth/register/client', data).then((r) => r.data),

  registerLawyer: (data: RegisterLawyerPayload) =>
    api.post<AuthResult>('/auth/register/lawyer', data).then((r) => r.data),

  verifyOtp: (data: VerifyOtpPayload) =>
    api.post<AuthResult>('/auth/verify-otp', data).then((r) => r.data),

  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }).then((r) => r.data),
}
