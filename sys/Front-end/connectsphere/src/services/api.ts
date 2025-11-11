// Re-export the apiService from the JavaScript file
export { default } from './api.js';

// Type declarations for the ApiService
export interface ApiService {
  getSupplierDashboardMetrics(): Promise<any>;
  getSupplierOrders(status?: string): Promise<any>;
  getSupplierInvoices(): Promise<any>;
  getSupplierPayments(): Promise<any>;
  getPaymentDashboard(): Promise<any>;
  getSupplierNotifications(): Promise<any>;
  processOrderAction(orderId: number, action: string, reason?: string): Promise<any>;
  getSupplierProducts(): Promise<any>;
  getSupplierActiveGroups(): Promise<any>;
  getSupplierReadyForPaymentGroups(): Promise<any>;
  getSupplierGroupModerationStats(): Promise<any>;
  getSupplierGroupDetails(groupId: number): Promise<any>;
  uploadSupplierImage(file: File): Promise<any>;
  createSupplierGroup(data: any): Promise<any>;
  getCompletedGroups(): Promise<any>;
}