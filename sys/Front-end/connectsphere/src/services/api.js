// src/services/api.js
// Use empty string for dev (uses Vite proxy), full URL for production - FORCE HTTPS
const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://connectafrica.store');
const API_BASE_URL = baseUrl ? baseUrl.replace(/^http:/, 'https:') : baseUrl;

// Error types for better error handling
export class ApiError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isRetryable = this.determineRetryability(status);
  }

  determineRetryability(status) {
    // Network errors and server errors (except 500) are retryable
    return !status || status >= 500 || status === 408 || status === 429;
  }

  getUserFriendlyMessage() {
    const messages = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please log in again.',
      403: 'You don\'t have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'Request timeout. Please try again.',
      409: 'This action conflicts with existing data.',
      429: 'Too many requests. Please slow down.',
      500: 'Server error. Our team has been notified.',
      503: 'Service temporarily unavailable. Please try again later.',
    };
    return messages[this.status] || this.message || 'An unexpected error occurred.';
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultRetryAttempts = 3;
    this.defaultRetryDelay = 1000; // 1 second
    this.requestTimeout = 30000; // 30 seconds
    
    // Debug log for production issues
    if (typeof window !== 'undefined' && window.location.hostname === 'connectafrica.store') {
      console.log('🔧 API Service initialized with baseURL:', this.baseURL);
    }
  }

  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Generic HTTP methods for convenience
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  // Sleep helper for retry delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate exponential backoff delay
  getRetryDelay(attempt) {
    return this.defaultRetryDelay * Math.pow(2, attempt);
  }

  // Enhanced error parser
  async parseError(response) {
    try {
      const errorData = await response.json();
      return {
        message: errorData.detail || errorData.message || 'An error occurred',
        code: errorData.code,
        details: errorData.errors || errorData.details || {}
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: null,
        details: {}
      };
    }
  }

  // Helper method to make authenticated requests with retry logic
  async request(endpoint, options = {}) {
    const {
      retryAttempts = this.defaultRetryAttempts,
      retryable = true,
      timeout = this.requestTimeout,
      ...fetchOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    // Debug log for production issues - log constructed URL
    if (typeof window !== 'undefined' && window.location.hostname === 'connectafrica.store' && endpoint.includes('groups')) {
      console.log('🌐 Requesting:', url, '| baseURL:', this.baseURL, '| endpoint:', endpoint);
    }
    
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let lastError = null;
    
    for (let attempt = 0; attempt < (retryable ? retryAttempts : 1); attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle unauthorized responses
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new ApiError(
            'Your session has expired. Please log in again.',
            401,
            'UNAUTHORIZED'
          );
        }

        if (!response.ok) {
          const errorInfo = await this.parseError(response);
          const error = new ApiError(
            errorInfo.message,
            response.status,
            errorInfo.code,
            errorInfo.details
          );

          // Don't retry client errors (4xx except specific cases)
          if (response.status >= 400 && response.status < 500 && 
              response.status !== 408 && response.status !== 429) {
            throw error;
          }

          lastError = error;
          
          // If retryable and not last attempt, wait and retry
          if (attempt < retryAttempts - 1) {
            const delay = this.getRetryDelay(attempt);
            console.warn(
              `Request failed (attempt ${attempt + 1}/${retryAttempts}): ${endpoint}. ` +
              `Retrying in ${delay}ms...`
            );
            await this.sleep(delay);
            continue;
          }
          
          throw error;
        }

        return response.json();
        
      } catch (error) {
        // Handle network errors and timeouts
        if (error.name === 'AbortError') {
          lastError = new ApiError(
            'Request timeout. Please check your connection and try again.',
            408,
            'TIMEOUT'
          );
        } else if (error instanceof ApiError) {
          lastError = error;
        } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          lastError = new ApiError(
            'Network error. Please check your internet connection.',
            null,
            'NETWORK_ERROR'
          );
        } else {
          lastError = new ApiError(
            error.message || 'An unexpected error occurred',
            null,
            'UNKNOWN_ERROR'
          );
        }

        // Retry on network errors if not last attempt
        if (lastError.isRetryable && attempt < retryAttempts - 1) {
          const delay = this.getRetryDelay(attempt);
          console.warn(
            `Request failed (attempt ${attempt + 1}/${retryAttempts}): ${endpoint}. ` +
            `Retrying in ${delay}ms...`, lastError
          );
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    console.error(`API request failed after ${retryAttempts} attempts: ${endpoint}`, lastError);
    throw lastError;
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

    // Note: No token is returned - user must verify OTP first
    // Token will be stored after successful OTP verification
    return response;
  }

  async verifyOtp(email, otpCode) {
    const response = await this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    });

    // Store token on successful OTP verification
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }

    return response;
  }

  async resendOtp(email) {
    const response = await this.request('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

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

  async deleteAccount(password, confirmation) {
    const response = await this.request('/api/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation }),
    });
    
    // Clear token after successful account deletion
    localStorage.removeItem('token');
    
    return response;
  }

  async updateContribution(groupId, quantity) {
    return this.request(`/api/groups/${groupId}/contribution`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // Groups methods
  async getMyGroups() {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/groups/my-groups?_t=${timestamp}`);
  }

  async joinGroup(groupId, joinData) {
    return this.request(`/api/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify(joinData),
    });
  }

  async updateGroupQuantity(groupId, updateData) {
    return this.request(`/api/groups/${groupId}/update-quantity`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async getGroupQRCode(groupId) {
    // Add timestamp to prevent caching of QR status
    const timestamp = Date.now();
    return this.request(`/api/groups/${groupId}/qr-code?t=${timestamp}`);
  }

  async getUserRefunds() {
    return this.request('/api/groups/refunds');
  }

  async getAllGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/groups?${queryString}` : '/api/groups';
    return this.request(endpoint);
  }

  // Alias for getAllGroups for consistency
  async getGroups(params = {}) {
    return this.getAllGroups(params);
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

  // Track recommendation click (when user clicks to view details)
  async trackRecommendationClick(groupId) {
    return this.request(`/api/ml/recommendations/${groupId}/click`, {
      method: 'POST'
    });
  }

  // Track recommendation join (when user joins the group)
  async trackRecommendationJoin(groupId) {
    return this.request(`/api/ml/recommendations/${groupId}/join`, {
      method: 'POST'
    });
  }

  // Get recommendation stats for current user
  async getRecommendationStats() {
    return this.request('/api/ml/recommendations/stats');
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
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/admin/groups/moderation-stats?_t=${timestamp}`);
  }

  async getActiveGroups() {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/admin/groups/active?_t=${timestamp}`);
  }

  async getReadyForPaymentGroups() {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/admin/groups/ready-for-payment?_t=${timestamp}`);
  }

  async getCompletedGroups() {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/admin/groups/completed?_t=${timestamp}`);
  }

  async processGroupPayment(groupId) {
    return this.request(`/api/admin/groups/${groupId}/process-payment`, {
      method: 'POST',
    });
  }


  async updateAdminGroup(groupId, groupData) {
    return this.request(`/api/admin/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
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
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/supplier/dashboard/metrics?_t=${timestamp}`);
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

  async markOrderShipped(orderId) {
    return this.request(`/api/supplier/orders/${orderId}/mark-shipped`, {
      method: 'POST',
    });
  }

  async markOrderDelivered(orderId) {
    return this.request(`/api/supplier/orders/${orderId}/mark-delivered`, {
      method: 'POST',
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

  // Admin-only function - should not be called by traders
  async getQRCodeStatusAdmin(qrCodeId) {
    return this.request(`/api/admin/qr/status/${qrCodeId}`);
  }

  async markQRCodeAsUsed(qrCodeId) {
    return this.request(`/api/admin/qr/mark-used/${qrCodeId}`, {
      method: 'POST',
    });
  }

  // New Admin endpoints for group workflow
  async getGroupsReadyForPayment() {
    return this.request('/api/admin/groups/ready-for-payment');
  }

  async markGroupReadyForCollection(groupId) {
    return this.request(`/api/admin/groups/${groupId}/mark-ready-for-collection`, {
      method: 'POST',
    });
  }

  async verifySupplierDelivery(groupId) {
    return this.request(`/api/admin/groups/${groupId}/verify-delivery`, {
      method: 'POST',
    });
  }

  async verifyQRCode(token) {
    return this.request(`/api/admin/verify-qr?token=${encodeURIComponent(token)}`);
  }

  async collectWithQR(token) {
    return this.request(`/api/admin/collect-with-qr?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    });
  }

  async processGroupRefunds(groupId, reason) {
    return this.request(`/api/admin/groups/${groupId}/process-refunds?reason=${encodeURIComponent(reason || '')}`, {
      method: 'POST',
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
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/supplier/payments?_t=${timestamp}`);
  }

  async getPaymentDashboard() {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    return this.request(`/api/supplier/payments/dashboard?_t=${timestamp}`);
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

  // Payment methods
  async initializePayment(paymentData) {
    return this.request('/api/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyPayment(transactionId) {
    return this.request('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId }),
    });
  }

  async getTransactionFee(amount, currency = 'USD') {
    const params = new URLSearchParams({ amount: amount.toString(), currency });
    return this.request(`/api/payment/fee?${params}`);
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

  // WebSocket connection for real-time updates
  connectWebSocket(token) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Connect to backend WebSocket endpoint (port 8000)
    const backendUrl = this.baseURL.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${backendUrl}/ws/qr-updates?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected for real-time QR updates');
      this.websocketConnected = true;
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        console.log('Message type:', data.type);
        console.log('Full message data:', JSON.stringify(data, null, 2));

        // Handle QR status updates
        if (data.type === 'qr_status_update') {
          console.log('QR status update received:', data);
          console.log('Dispatching qrStatusUpdate event with data:', data);
          // Dispatch custom event that components can listen to
          window.dispatchEvent(new CustomEvent('qrStatusUpdate', {
            detail: data
          }));
          console.log('qrStatusUpdate event dispatched');
        } else {
          console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.error('Raw message:', event.data);
      }
    };

    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.websocketConnected = false;
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (this.websocketConnected === false) {
          console.log('Attempting to reconnect WebSocket...');
          this.connectWebSocket(token);
        }
      }, 5000);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.websocketConnected = false;
    }
  }

  // =========================================================================
  // ML BENCHMARKING METHODS
  // =========================================================================

  /**
   * Run a new benchmark evaluation
   * Evaluates all baseline models and stores results
   */
  async runBenchmark() {
    return this.request('/api/ml/benchmark/run', {
      method: 'POST',
    });
  }

  /**
   * Get the latest benchmark results
   * Returns metrics for all models from the most recent run
   */
  async getLatestBenchmark() {
    return this.request('/api/ml/benchmark/latest');
  }

  /**
   * Get benchmark history
   * @param {number} limit - Number of historical runs to retrieve (default 10)
   */
  async getBenchmarkHistory(limit = 10) {
    return this.request(`/api/ml/benchmark/history?limit=${limit}`);
  }

  /**
   * Get detailed comparison of all baseline models
   * Returns comprehensive metrics for model comparison
   */
  async getBaselineComparison() {
    return this.request('/api/ml/benchmark/comparison');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
