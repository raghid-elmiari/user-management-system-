import api from './api';

export const rolesApi = {
  getAll: () => api.get('/api/roles'),
  create: (data) => api.post('/api/roles', data),
  updatePermissions: (roleName, permissions) => api.put(`/api/roles/${roleName}/permissions`, { permissions }),
};
