import api from './api';

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  getCurrentUser: () => api.get('/api/auth/me'),
};