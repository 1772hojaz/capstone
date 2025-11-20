/**
 * API Service with Mock Data Support
 * 
 * Set USE_MOCK_DATA to true to use static mock data
 * Set USE_MOCK_DATA to false to use real backend API
 */

import apiService from './api.js';
import mockData, { simulateDelay, getMockGroupById } from './mockData';

// 🔧 TOGGLE THIS TO SWITCH BETWEEN MOCK AND REAL DATA
export const USE_MOCK_DATA = false;

/**
 * API Service Wrapper
 * Automatically uses mock data when USE_MOCK_DATA is true
 */
class ApiServiceWithMock {
  // ==================== AUTH ====================
  
  async login(credentials: { email: string; password: string }) {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
      return {
        ...mockData.user,
        token: 'mock-jwt-token-' + Date.now()
      };
    }
    return apiService.login(credentials);
  }

  async register(userData: any) {
    if (USE_MOCK_DATA) {
      await simulateDelay(1000);
      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
      return {
        ...mockData.user,
        ...userData,
        id: Math.floor(Math.random() * 10000),
        token: 'mock-jwt-token-' + Date.now()
      };
    }
    return apiService.register(userData);
  }

  async logout() {
    if (USE_MOCK_DATA) {
      localStorage.removeItem('token');
      return { success: true };
    }
    return apiService.logout();
  }

  async getCurrentUser() {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      return mockData.user;
    }
    return apiService.getCurrentUser();
  }

  // ==================== GROUPS ====================

  async getRecommendations() {
    if (USE_MOCK_DATA) {
      console.log('Using mock recommendations data');
      await simulateDelay(600);
      return mockData.recommendations;
    }
    return apiService.getRecommendations();
  }

  async getAllGroups() {
    if (USE_MOCK_DATA) {
      console.log('Using mock groups data');
      await simulateDelay(500);
      return mockData.groups;
    }
    return apiService.getAllGroups();
  }

  async getGroupById(id: number) {
    if (USE_MOCK_DATA) {
      console.log('Using mock group detail data for ID:', id);
      await simulateDelay(400);
      const group = getMockGroupById(id);
      if (!group) {
        throw new Error('Group not found');
      }
      return group;
    }
    return apiService.getGroupById(id);
  }

  async getMyGroups() {
    if (USE_MOCK_DATA) {
      console.log('Using mock my groups data');
      await simulateDelay(500);
      return mockData.myGroups;
    }
    return apiService.getMyGroups();
  }

  async joinGroup(groupId: number, data: any) {
    if (USE_MOCK_DATA) {
      console.log('Mock: Joining group', groupId, 'with data:', data);
      await simulateDelay(800);
      return {
        success: true,
        payment_url: 'https://checkout.flutterwave.com/mock-payment',
        tx_ref: `TX-${Date.now()}-${groupId}`,
        transaction_id: `TRX-${Date.now()}`,
        group_id: groupId,
        quantity: data.quantity,
        amount: mockData.groups.find(g => g.id === groupId)?.price * data.quantity || 0,
        delivery_method: data.delivery_method
      };
    }
    return apiService.joinGroup(groupId, data);
  }

  // ==================== PAYMENT ====================

  async initializePayment(paymentData: any) {
    if (USE_MOCK_DATA) {
      console.log('Mock: Initializing payment', paymentData);
      await simulateDelay(1000);
      return {
        data: {
          link: 'https://checkout.flutterwave.com/mock-payment',
          ...mockData.paymentResponse
        }
      };
    }
    return apiService.initializePayment(paymentData);
  }

  async getTransactionFee(amount: number, currency: string = 'USD') {
    if (USE_MOCK_DATA) {
      await simulateDelay(200);
      // Mock fee: 2.5% + $0.50
      const fee = (amount * 0.025) + 0.50;
      return { fee: parseFloat(fee.toFixed(2)) };
    }
    return apiService.getTransactionFee(amount, currency);
  }

  // ==================== PROFILE ====================

  async updateProfile(data: any) {
    if (USE_MOCK_DATA) {
      console.log('Mock: Updating profile', data);
      await simulateDelay(700);
      return {
        ...mockData.user,
        ...data
      };
    }
    return apiService.updateProfile(data);
  }

  async changePassword(data: any) {
    if (USE_MOCK_DATA) {
      console.log('Mock: Changing password');
      await simulateDelay(800);
      return { success: true, message: 'Password updated successfully' };
    }
    return apiService.changePassword(data);
  }

  // ==================== PRODUCTS ====================

  async getProducts() {
    if (USE_MOCK_DATA) {
      console.log('Using mock products data');
      await simulateDelay(500);
      return mockData.groups;
    }
    return apiService.getProducts();
  }

  // ==================== SEARCH & FILTER ====================

  async searchGroups(query: string) {
    if (USE_MOCK_DATA) {
      console.log('Mock: Searching groups for:', query);
      await simulateDelay(300);
      return mockData.searchMockGroups(query);
    }
    return apiService.searchGroups(query);
  }

  async getGroupsByCategory(category: string) {
    if (USE_MOCK_DATA) {
      console.log('🏷️ Mock: Getting groups by category:', category);
      await simulateDelay(300);
      return mockData.getMockGroupsByCategory(category);
    }
    return apiService.getGroupsByCategory(category);
  }

  // ==================== FALLBACK ====================
  
  // For any methods not explicitly mocked, forward to real API
  [key: string]: any;
}

// Create proxy to forward unmocked methods to real API
const createApiProxy = () => {
  const mockApi = new ApiServiceWithMock();
  
  return new Proxy(mockApi, {
    get(target: any, prop: string) {
      // If method exists on mock API, use it
      if (prop in target) {
        return target[prop];
      }
      
      // Otherwise, forward to real API
      if (USE_MOCK_DATA) {
        console.warn(`Method ${prop} not mocked, falling back to real API`);
      }
      
      return typeof apiService[prop] === 'function'
        ? apiService[prop].bind(apiService)
        : apiService[prop];
    }
  });
};

export default createApiProxy();

// Export flag so components can check if using mock data
export { USE_MOCK_DATA as isMockMode };

