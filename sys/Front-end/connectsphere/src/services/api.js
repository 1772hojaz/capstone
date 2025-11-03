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

  async registerSupplier(supplierData) {
    const response = await this.request('/api/auth/register-supplier', {
      method: 'POST',
      body: JSON.stringify(supplierData),
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
    return this.request("/api/admin/users");
  }

  async getUserStats() {
    return this.request("/api/admin/users/stats");
  }

  async getUserDetails(userId) {
    return this.request(`/api/admin/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  async toggleSupplierStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-supplier`, {
      method: "POST",
    });
  }

  async toggleUserActiveStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-active`, {
      method: "POST",
    });
  }
  async getSystemStats() {
    return this.request('/api/admin/stats');
  }

  async getDashboardStats() {
    return this.request('/api/admin/dashboard');
  }

  async getActivityData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/admin/activity?${queryString}` : '/api/admin/activity';
    return this.request(endpoint);
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


  async deleteAdminGroup(groupId) {
    return this.request(`/api/admin/groups/${groupId}`, {
      method: 'DELETE',
    });
  }
  async getReports() {
    return this.request('/api/admin/reports');
  }

  async getMLPerformance() {
    return this.request('/api/admin/ml-performance');
  }

  async retrainMLModels() {
    return this.request('/api/admin/retrain', {
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

  async uploadSupplierImage(file) {
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

    const url = `${this.baseURL}/api/supplier/upload-image`;
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

  // QR Code methods
  async generateQRCode(qrData) {
    return this.request('/api/admin/qr/generate', {
      method: 'POST',
      body: JSON.stringify(qrData),
    });
  }

  async scanQRCode(qrCodeData) {
    // Use POST to send QR data in the request body to avoid URL encoding/truncation
    return this.request('/api/admin/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_code_data: qrCodeData })
    });
  }

  async getUserPurchases(userId) {
    return this.request(`/api/admin/qr/user/${userId}/purchases`);
  }

  async getProductPurchasers(productId) {
    return this.request(`/api/admin/qr/product/${productId}/purchasers`);
  }

  async getQRScanHistory(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.request(`/api/admin/qr/scan-history?${params}`);
  }

  // Supplier API methods
  async getSupplierDashboardMetrics() {
    return this.request('/api/supplier/dashboard/metrics');
  }

  async getSupplierProducts() {
    return this.request('/api/supplier/products');
  }

  async createSupplierProduct(productData) {
    return this.request('/api/supplier/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProductPricing(productId, pricingTiers) {
    return this.request(`/api/supplier/products/${productId}/pricing`, {
      method: 'PUT',
      body: JSON.stringify({ pricing_tiers: pricingTiers }),
    });
  }

  async getSupplierOrders(status = null) {
    const url = status ? `/api/supplier/orders?status=${status}` : '/api/supplier/orders';
    return this.request(url);
  }

  async processOrderAction(orderId, action, reason = null, deliveryData = null) {
    const requestData = { action };
    if (reason) requestData.reason = reason;
    if (deliveryData) {
      requestData.delivery_method = deliveryData.method;
      requestData.scheduled_delivery_date = deliveryData.date;
      requestData.special_instructions = deliveryData.instructions;
    }

    return this.request(`/api/supplier/orders/${orderId}/action`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Supplier Pickup Locations
  async getSupplierPickupLocations() {
    return this.request('/api/supplier/pickup-locations');
  }

  async createPickupLocation(locationData) {
    return this.request('/api/supplier/pickup-locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async updatePickupLocation(locationId, locationData) {
    return this.request(`/api/supplier/pickup-locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  async deletePickupLocation(locationId) {
    return this.request(`/api/supplier/pickup-locations/${locationId}`, {
      method: 'DELETE',
    });
  }

  // QR Code Scanning
  async scanQRCode(qrCodeData) {
    return this.request('/api/admin/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_code_data: qrCodeData }),
    });
  }

  // Supplier Invoices
  async getSupplierInvoices(status = null) {
    const url = status ? `/api/supplier/invoices?status=${status}` : '/api/supplier/invoices';
    return this.request(url);
  }

  async generateInvoice(orderId) {
    return this.request(`/api/supplier/orders/${orderId}/invoice`, {
      method: 'POST',
    });
  }

  // Supplier Payments
  async getSupplierPayments() {
    return this.request('/api/supplier/payments');
  }

  async getPaymentDashboard() {
    return this.request('/api/supplier/payments/dashboard');
  }

  // Supplier Notifications
  async getSupplierNotifications(unreadOnly = false) {
    const url = unreadOnly ? '/api/supplier/notifications?unread_only=true' : '/api/supplier/notifications';
    return this.request(url);
  }

  async markNotificationRead(notificationId) {
    return this.request(`/api/supplier/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/api/supplier/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Bulk CSV Upload
  async bulkUploadProducts(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/supplier/products/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let the browser set it with boundary for FormData
        ...this.getAuthToken() ? { Authorization: `Bearer ${this.getAuthToken()}` } : {},
      },
    });
  }

  // Supplier Group Moderation Methods
  async getSupplierActiveGroups() {
    return this.request("/api/supplier/groups/active");
  }

  async getSupplierReadyForPaymentGroups() {
    return this.request("/api/supplier/groups/ready-for-payment");
  }

  async getSupplierGroupModerationStats() {
    return this.request("/api/supplier/groups/moderation-stats");
  }

  async getSupplierGroupDetails(groupId) {
    return this.request(`/api/supplier/groups/${groupId}`);
  }

  async processSupplierGroupPayment(groupId) {
    return this.request(`/api/supplier/groups/${groupId}/process-payment`, {
      method: 'POST'
    });
  }

  async generateSupplierGroupQR(groupId) {
    return this.request(`/api/supplier/groups/${groupId}/qr/generate`, {
      method: 'POST'
    });
  }

  // Supplier Group Creation
  async createSupplierGroup(groupData) {
    return this.request('/api/supplier/groups/create', {
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