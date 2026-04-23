import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/verify-otp');
    const isAuthCheck = requestUrl.includes('/auth/me');

    // Don't redirect for login/OTP requests or initial auth check failures
    if (error.response?.status === 401 && !isLoginRequest && !isAuthCheck) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
