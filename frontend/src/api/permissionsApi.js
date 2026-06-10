import api from './api';

export const permissionsApi = {
  getAll: () => api.get('/api/permissions'),
  create: (data) => api.post('/api/permissions', data),
};
