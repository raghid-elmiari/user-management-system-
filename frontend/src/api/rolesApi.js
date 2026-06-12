import api from './api';
 
export const rolesApi = {
  getAll: () => api.get('/api/roles'),
  create: (data) => api.post('/api/roles', data),
  delete: (id) => api.delete(`/api/roles/${id}`),
  update: (id, data) => api.put(`/api/roles/${id}`, data),
  updatePermissions: (roleName, permissions) => api.put(`/api/roles/${roleName}/permissions`, { permissions }),
};
 