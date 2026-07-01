import api from './api';

export const requestLogsApi = {
  getAll: (params) => api.get('/api/request-logs', { params }),
};