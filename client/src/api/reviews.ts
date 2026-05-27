import api from './axios'

export interface ReviewDto {
  id: string
  clientFullName: string
  rating: number
  comment?: string
  createdAt: string
}

export const reviewsApi = {
  getByLawyer: (lawyerId: string) =>
    api
      .get<ReviewDto[]>(`/reviews/lawyer/${lawyerId}`)
      .then((r) => r.data),

  create: (data: {
    clientId: string
    lawyerId: string
    appointmentId: string
    rating: number
    comment?: string
  }) => api.post<{ reviewId: string }>('/reviews', data).then((r) => r.data),
}
