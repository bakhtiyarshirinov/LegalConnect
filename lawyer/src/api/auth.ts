import api from './axios'

export interface LoginResponse {
  token: string
  userId: string
  email: string
  fullName: string
  role: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password })
  return res.data
}
