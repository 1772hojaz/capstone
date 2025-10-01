import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', new URLSearchParams({ username: email, password })),
  register: (data: any) => api.post('/api/auth/register', data),
};

export const recommendationsAPI = {
  get: () => api.get('/api/recommendations'),
};

export const productsAPI = {
  getAll: () => api.get('/api/products'),
};

export const groupsAPI = {
  join: (groupId: string, quantity: number) =>
    api.post(`/api/groups/${groupId}/join`, { group_id: groupId, quantity_committed: quantity }),
};

export const adminAPI = {
  getMetrics: () => api.get('/api/admin/metrics'),
  generateSyntheticData: (data: any) => api.post('/api/admin/generate-synthetic-data', data),
  getEvaluation: () => api.get('/api/admin/evaluation'),
};

export default api;
