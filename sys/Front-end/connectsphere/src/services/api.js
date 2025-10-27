// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Helper method to make authenticated requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle unauthorized responses
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized - redirecting to login');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token on successful login
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }

    return response;
  }

  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token on successful registration
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed, but clearing local token anyway');
    } finally {
      localStorage.removeItem('token');
    }
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getNotificationSettings() {
    return this.request('/api/auth/notifications');
  }

  async updateNotificationSettings(settings) {
    return this.request('/api/auth/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async changePassword(passwordData) {
    return this.request('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async updateContribution(groupId, quantity) {
    return this.request(`/api/groups/${groupId}/contribution`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // Groups methods
  async getMyGroups() {
    return this.request('/api/groups/my-groups');
  }

  async joinGroup(groupId, joinData) {
    return this.request(`/api/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify(joinData),
    });
  }

  async getGroupQRCode(groupId) {
    return this.request(`/api/groups/${groupId}/qr-code`);
  }

  async getAllGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/groups?${queryString}` : '/api/groups';
    return this.request(endpoint);
  }

  // Past groups summary
  async getPastGroupsSummary() {
    return this.request('/api/groups/past-groups-summary');
  }

  // Products methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
    return this.request(endpoint);
  }

  async getProduct(productId) {
    return this.request(`/api/products/${productId}`);
  }

  // Recommendations methods
  async getRecommendations() {
    return this.request('/api/ml/recommendations');
  }

  async getUserSimilarityRecommendations() {
    return this.request('/api/ml/user-similarity-recommendations');
  }

  async getHybridRecommendations() {
    return this.request('/api/ml/hybrid-recommendations');
  }

  // Admin methods (only available to admin users)
  async getAllUsers() {
    return this.request('/api/admin/users');
  }

  async getSystemStats() {
    return this.request('/api/admin/stats');
  }

  async getDashboardStats() {
    return this.request('/api/admin/dashboard');
  }

  async getAdminGroups() {
    return this.request('/api/admin/groups');
  }

  async getGroupModerationStats() {
    return this.request('/api/admin/groups/moderation-stats');
  }

  async getActiveGroups() {
    return this.request('/api/admin/groups/active');
  }

  async getReadyForPaymentGroups() {
    return this.request('/api/admin/groups/ready-for-payment');
  }

  async processGroupPayment(groupId) {
    return this.request(`/api/admin/groups/${groupId}/process-payment`, {
      method: 'POST',
    });
  }

  async getReports() {
    return this.request('/api/admin/reports');
  }

  async getMLPerformance() {
    return this.request('/api/admin/ml-performance');
  }

  async retrainMLModels() {
    return this.request('/api/ml/retrain', {
      method: 'POST',
    });
  }

  async getMLSystemStatus() {
    return this.request('/api/admin/ml-system-status');
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const config = {
      method: 'POST',
      headers: {},
      body: formData,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const url = `${this.baseURL}/api/admin/upload-image`;
    const response = await fetch(url, config);

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized - redirecting to login');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async createAdminGroup(groupData) {
    return this.request('/api/admin/groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  // Utility methods
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;