import api from './api';

export const usersApi = {
  getAll:     (params)       => api.get('/api/users', { params }),
  create:     (data)         => api.post('/api/users', data),
  update:     (id, data)     => api.put(`/api/users/${id}`, data),
  remove:     (id)           => api.delete(`/api/users/${id}`),
  assignRole: (userId, data) => api.post(`/api/users/${userId}/roles`, data),
};

