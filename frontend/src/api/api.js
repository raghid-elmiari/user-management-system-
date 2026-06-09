import axios from 'axios';

let getAccessToken = () => null;
let getRefreshToken = () => null;
let onAuthFailure = () => {};
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const configureAxiosAuth = ({ getToken, getRefreshToken: getRefresh, onFailure }) => {
  getAccessToken = getToken;
  getRefreshToken = getRefresh || (() => null);
  onAuthFailure = onFailure;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/refresh`,
            { tokenStr: refreshToken }
          );
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          onAuthFailure();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        onAuthFailure();
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;