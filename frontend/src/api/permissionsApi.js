import api from './axios';

export const permissionsApi = {
  getAll: () => api.get('/api/permissions'),
  create: (data) => api.post('/api/permissions', data),
};
