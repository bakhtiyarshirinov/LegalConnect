import api from './axios'
import type { LoginResponse } from '../types'

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}
