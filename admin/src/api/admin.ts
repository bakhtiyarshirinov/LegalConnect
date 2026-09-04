import api from './axios'
import type { PendingLawyer, VerifiedLawyer, UserAdmin, UserProfile, AdminStats } from '../types'

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<AdminStats>('/admin/stats')
  return data
}

export const getPendingLawyers = async (): Promise<PendingLawyer[]> => {
  const { data } = await api.get<PendingLawyer[]>('/admin/lawyers/pending')
  return data
}

export const verifyLawyer = async (lawyerId: string): Promise<void> => {
  await api.put(`/admin/lawyers/${lawyerId}/verify`)
}

export const getVerifiedLawyers = async (): Promise<VerifiedLawyer[]> => {
  const { data } = await api.get<VerifiedLawyer[]>('/admin/lawyers/verified')
  return data
}

export const cancelLawyerVerification = async (
  { lawyerId, reason }: { lawyerId: string; reason: string }
): Promise<void> => {
  await api.put(`/admin/lawyers/${lawyerId}/cancel-verification`, { reason })
}

export const rejectLawyer = async (
  { lawyerId, reason }: { lawyerId: string; reason: string }
): Promise<void> => {
  await api.put(`/admin/lawyers/${lawyerId}/reject`, { reason })
}

export const getAllUsers = async (): Promise<UserAdmin[]> => {
  const { data } = await api.get<UserAdmin[]>('/admin/users')
  return data
}

export const getUserProfile = async (id: string): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>(`/admin/users/${id}`)
  return data
}
