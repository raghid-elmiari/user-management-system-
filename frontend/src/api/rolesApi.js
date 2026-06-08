import api from './axios';

export const rolesApi = {
  getAll: () => api.get('/api/roles'),
  create: (data) => api.post('/api/roles', data),
};
