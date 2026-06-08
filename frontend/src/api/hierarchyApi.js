import api from './axios';

export const hierarchyApi = {
  getAll: () => api.get('/api/hierarchy'),
  addLink: (data) => api.post('/api/hierarchy', data),
  removeLink: (parentId, childId) => api.delete(`/api/hierarchy/${parentId}/${childId}`),
};
