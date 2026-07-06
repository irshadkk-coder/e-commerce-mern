import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If it's 401, we haven't retried yet, and it's NOT an auth endpoint
    const isAuthEndpoint = originalRequest.url.includes('/login') || originalRequest.url.includes('/signup');
    
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token using HttpOnly cookie
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (data && data.status && data.token) {
          // Set new token and retry the original request
          import('./tokenStorage').then(({ setToken }) => {
            setToken(data.token);
          });
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out and redirect
        removeToken();
        if (!window.location.pathname.match(/\/(login|signup)$/)) {
          window.location.href = '/login?expired=true';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
