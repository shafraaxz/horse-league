// lib/apiClient.js
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
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

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    verify: () => apiClient.get('/auth/verify'),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Teams
  teams: {
    getAll: (params = {}) => apiClient.get('/teams', { params }),
    getById: (id) => apiClient.get(`/teams/${id}`),
    create: (data) => apiClient.post('/teams', data),
    update: (id, data) => apiClient.put(`/teams/${id}`, data),
    delete: (id) => apiClient.delete(`/teams/${id}`),
  },

  // Leagues
  leagues: {
    getAll: (params = {}) => apiClient.get('/leagues', { params }),
    getById: (id) => apiClient.get(`/leagues/${id}`),
    create: (data) => apiClient.post('/leagues', data),
    update: (id, data) => apiClient.put(`/leagues/${id}`, data),
    delete: (id) => apiClient.delete(`/leagues/${id}`),
  },

  // Players
  players: {
    getAll: (params = {}) => apiClient.get('/players', { params }),
    getById: (id) => apiClient.get(`/players/${id}`),
    create: (data) => apiClient.post('/players', data),
    update: (id, data) => apiClient.put(`/players/${id}`, data),
    delete: (id) => apiClient.delete(`/players/${id}`),
  },

  // Matches
  matches: {
    getAll: (params = {}) => apiClient.get('/matches', { params }),
    getById: (id) => apiClient.get(`/matches/${id}`),
    create: (data) => apiClient.post('/matches', data),
    update: (id, data) => apiClient.put(`/matches/${id}`, data),
    delete: (id) => apiClient.delete(`/matches/${id}`),
    liveUpdate: (id, data) => apiClient.post(`/matches/${id}/live`, data),
  },

  // Upload
  upload: {
    image: (formData) => apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  }
};

export default apiClient;