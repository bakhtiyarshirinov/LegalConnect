import api from './axios'

export interface SpecializationDto {
  id: number
  name: string
}

export const specializationsApi = {
  getAll: () =>
    api.get<SpecializationDto[]>('/specializations').then((r) => r.data),
}
