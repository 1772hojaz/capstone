/**
 * API Service - Direct Backend Connection
 * 
 * All data now comes from the backend API
 * Mock data has been removed as requested
 */

import apiService from './api.js';

/**
 * API Service Export
 * This is now a direct pass-through to the backend API service
 * All previous mock data functionality has been removed
 */
class ApiServiceWrapper {
  // ==================== AUTH ====================
  
  async login(credentials: { email: string; password: string }) {
    return apiService.login(credentials);
  }

  async register(userData: any) {
    return apiService.register(userData);
  }

  async logout() {
    return apiService.logout();
  }

  async getCurrentUser() {
    return apiService.getCurrentUser();
  }

  // ==================== RECOMMENDATIONS ====================
  
  async getRecommendations() {
    return apiService.getRecommendations();
  }

  // ==================== GROUPS ====================
  
  async getAllGroups() {
    return apiService.getAllGroups();
  }

  async getGroups(params = {}) {
    return apiService.getGroups(params);
  }

  async getGroupById(id: number) {
    return apiService.getGroupById(id);
  }

  async getMyGroups() {
    return apiService.getMyGroups();
  }

  async joinGroup(groupId: number, data: any) {
    return apiService.joinGroup(groupId, data);
  }

  async initializePayment(data: any) {
    return apiService.initializePayment(data);
  }

  async verifyPayment(transactionId: string) {
    return apiService.verifyPayment(transactionId);
  }

  // ==================== PROFILE ====================
  
  async updateProfile(data: any) {
    return apiService.updateProfile(data);
  }

  async changePassword(data: any) {
    return apiService.changePassword(data);
  }

  // ==================== SEARCH & FILTER ====================
  
  async searchGroups(query: string) {
    return apiService.searchGroups(query);
  }

  async getGroupsByCategory(category: string) {
    return apiService.getGroupsByCategory(category);
  }

  // ==================== WEBSOCKET ====================
  
  connectWebSocket(roomId: string, onMessage: (data: any) => void, onError?: (error: any) => void) {
    return apiService.connectWebSocket(roomId, onMessage, onError);
  }

  disconnectWebSocket(roomId: string) {
    return apiService.disconnectWebSocket(roomId);
  }

  sendMessage(roomId: string, message: string) {
    return apiService.sendMessage(roomId, message);
  }
}

const apiServiceWrapper = new ApiServiceWrapper();

export default apiServiceWrapper;

// Export flag for backwards compatibility
export const USE_MOCK_DATA = false;
export const isMockMode = false;
