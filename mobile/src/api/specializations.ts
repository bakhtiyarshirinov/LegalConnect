import api from './axios';

export const specializationsApi = {
  getAll: () =>
    api.get('/specializations'),
};
