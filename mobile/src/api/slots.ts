import api from './axios';

export const slotsApi = {
  getAvailable: (lawyerId: string, date: string) =>
    api.get('/slots/available', { params: { lawyerId, date } }),

  getBulk: (lawyerId: string, from: string, to: string) =>
    api.get('/slots', { params: { lawyerId, from, to } }),

  createBulk: (data: {
    lawyerId: string;
    date: string;
    slotDurationMinutes: number;
    startHour: number;
    endHour: number;
  }) => api.post('/slots/bulk', data),

  deleteSlot: (slotId: string, lawyerId: string) =>
    api.delete(`/slots/${slotId}`, { params: { lawyerId } }),
};
