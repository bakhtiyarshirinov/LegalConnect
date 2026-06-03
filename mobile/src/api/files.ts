import api from './axios';

export const filesApi = {
  uploadAvatar: (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    return api.post('/files/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      // Prevent axios from re-serializing FormData
      transformRequest: (data) => data,
    });
  },
};
