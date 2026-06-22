import api from './api';

export const rolesApi = {
  getAll: () => api.get('/api/roles'),
  create: (data) => api.post('/api/roles', data),
  delete: (id) => api.delete(`/api/roles/${id}`),
  update: (id, data) => api.put(`/api/roles/${id}`, data),
  updatePermissions: (roleName, permissions) => api.put(`/api/roles/${roleName}/permissions`, { permissions }),
  getTree: () => api.get('/api/roles/tree'),
  move: (id, newParentRoleId) => api.put(`/api/roles/${id}/move`, { newParentRoleId }),
  validateHierarchy: (roleId, proposedParentRoleId) =>
    api.post('/api/roles/validate-hierarchy', { roleId, proposedParentRoleId }),
};
