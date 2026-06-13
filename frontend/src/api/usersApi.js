import api from './api';
<<<<<<< HEAD
 
export const usersApi = {
  getAll:     ()             => api.get('/api/users'),
  create:     (data)         => api.post('/api/users', data),
  update:     (id, data)     => api.put(`/api/users/${id}`, data),
  remove:     (id)           => api.delete(`/api/users/${id}`),
  assignRole: (userId, data) => api.post(`/api/users/${userId}/roles`, data),
};
=======

export const usersApi = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  assignRole: (userId, data) => api.post(`/api/users/${userId}/roles`, data),
};
>>>>>>> 9758ada0b7d3cbebb454b66b10c5c89ab74ffa95
