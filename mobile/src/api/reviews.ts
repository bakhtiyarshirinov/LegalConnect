import api from './axios';

export const reviewsApi = {
  getByLawyer: (lawyerId: string) =>
    api.get(`/reviews/lawyer/${lawyerId}`),

  create: (data: {
    clientId: string;
    lawyerId: string;
    appointmentId: string;
    rating: number;
    comment?: string;
  }) => api.post('/reviews', data),
};
