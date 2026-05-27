import api from './axios'
import type { PendingLawyer, UserAdmin } from '../types'

export const getPendingLawyers = async (): Promise<PendingLawyer[]> => {
  const { data } = await api.get<PendingLawyer[]>('/admin/lawyers/pending')
  return data
}

export const verifyLawyer = async (lawyerId: string): Promise<void> => {
  await api.put(`/admin/lawyers/${lawyerId}/verify`)
}

export const getAllUsers = async (): Promise<UserAdmin[]> => {
  const { data } = await api.get<UserAdmin[]>('/admin/users')
  return data
}
