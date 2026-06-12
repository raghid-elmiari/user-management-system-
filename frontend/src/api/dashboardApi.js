import api from './api';

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
};