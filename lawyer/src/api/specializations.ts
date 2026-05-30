import api from './axios'

export interface Specialization {
  id: number
  name: string
  description?: string
}

export async function getAllSpecializations(): Promise<Specialization[]> {
  const res = await api.get<Specialization[]>('/specializations')
  return res.data
}
