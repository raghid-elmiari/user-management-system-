import axios from "axios";

let getAccessToken = () => null;
let getRefreshToken = () => null;
let onAuthFailure = () => {};
let onTokenRefreshed = () => {};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const configureAxiosAuth = ({
  getToken,
  getRefreshToken: getRefresh,
  onFailure,
  onRefreshed,
}) => {
  getAccessToken = getToken;
  getRefreshToken = getRefresh;
  onAuthFailure = onFailure;
  if (onRefreshed) onTokenRefreshed = onRefreshed;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ❌ RESPONSE INTERCEPTOR (FIXED)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        onAuthFailure();
        return Promise.reject(error);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/api/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // ✅ store tokens
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      // ✅ sync fresh user/roles/permissions into AuthContext so UI gates
      // (e.g. canEdit, hasPermission) immediately reflect any role/permission
      // changes an admin made since this user last logged in or refreshed —
      // without this, the in-memory user object stays stale even though the
      // token itself was just renewed with the correct claims.
      onTokenRefreshed(response.data);

      // ✅ update queued requests
      processQueue(null, accessToken);

      // ✅ retry original request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;