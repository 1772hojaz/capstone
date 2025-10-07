import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Group-Buys API
export const groupsAPI = {
  getAll: (params) => api.get('/groups', { params }),
  getById: (id) => api.get(`/groups/${id}`),
  getUserGroups: () => api.get('/groups/my-groups'),
  create: (data) => api.post('/groups', data),
  join: (id, data) => api.post(`/groups/${id}/join`, data),
  getContributions: (id) => api.get(`/groups/${id}/contributions`),
  updateContribution: (id, data) => api.put(`/groups/${id}/contribution`, data),
  makePayment: (id) => api.post(`/groups/${id}/pay`),
};

// Chat API
export const chatAPI = {
  getMessages: (groupId) => api.get(`/chat/${groupId}/messages`),
  sendMessage: (groupId, data) => api.post(`/chat/${groupId}/messages`, data),
};

// ML API
export const mlAPI = {
  getRecommendations: () => api.get('/ml/recommendations'),
  getHealth: () => api.get('/ml/health'),
  getEvaluation: () => api.get('/ml/evaluation'),
  getClusters: () => api.get('/ml/clusters'),
  retrain: () => api.post('/ml/retrain'),
  getTrainingVisualization: () => api.get('/ml/training-visualization'),
  getRecommendationPerformance: (days = 7) => api.get(`/ml/recommendation-performance?days=${days}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllGroups: (params) => api.get('/admin/groups', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  completeGroup: (id) => api.post(`/admin/groups/${id}/complete`),
  cancelGroup: (id) => api.post(`/admin/groups/${id}/cancel`),
  getReports: (params) => api.get('/admin/reports', { params }),
  triggerRetrain: () => api.post('/admin/retrain'),
};

export default api;
