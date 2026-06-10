import api from './api';

export const usersApi = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  assignRole: (userId, data) => api.post(`/api/users/${userId}/roles`, data),
};
