// Type declarations for api.js
declare module './api' {
  interface ApiService {
    // Authentication
    login(credentials: any): Promise<any>;
    register(userData: any): Promise<any>;
    registerSupplier(supplierData: any): Promise<any>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<any>;
    updateProfile(profileData: any): Promise<any>;
    getNotificationSettings(): Promise<any>;
    updateNotificationSettings(settings: any): Promise<any>;
    changePassword(passwordData: any): Promise<any>;

    // Groups
    getMyGroups(): Promise<any>;
    joinGroup(groupId: number, joinData: any): Promise<any>;
    updateGroupQuantity(groupId: number, updateData: any): Promise<any>;
    getGroupQRCode(groupId: number): Promise<any>;
    getAllGroups(params?: any): Promise<any>;
    getPastGroupsSummary(): Promise<any>;
    updateContribution(groupId: number, quantity: number): Promise<any>;

    // Admin
    getAdminGroups(): Promise<any>;
    getGroupModerationStats(): Promise<any>;
    getActiveGroups(): Promise<any>;
    getReadyForPaymentGroups(): Promise<any>;
    getAdminOrdersReadyForPayment(): Promise<any>;
    processAdminOrderPayment(orderId: number): Promise<any>;
    getCompletedGroups(): Promise<any>;
    processGroupPayment(groupId: number): Promise<any>;
    deleteAdminGroup(groupId: number): Promise<any>;
    processGroupDeletionRefund(groupId: number): Promise<any>;
    createAdminGroup(groupData: any): Promise<any>;
    uploadImage(file: File): Promise<any>;

    // Supplier
    getSupplierDashboardMetrics(): Promise<any>;
    getSupplierOrders(status?: string): Promise<any>;
    getSupplierInvoices(): Promise<any>;
    getSupplierPayments(): Promise<any>;
    getPaymentDashboard(): Promise<any>;
    getSupplierNotifications(): Promise<any>;
    processOrderAction(orderId: number, action: string, reason?: string, deliveryData?: any): Promise<any>;
    markOrderShipped(orderId: number, shipData?: any): Promise<any>;
    markOrderDelivered(orderId: number, deliverData?: any): Promise<any>;
    getSupplierProducts(): Promise<any>;
    createSupplierProduct(productData: any): Promise<any>;
    updateProductPricing(productId: number, pricingTiers: any): Promise<any>;
    getSupplierActiveGroups(): Promise<any>;
    getSupplierReadyForPaymentGroups(): Promise<any>;
    getSupplierGroupModerationStats(): Promise<any>;
    getSupplierGroupDetails(groupId: number): Promise<any>;
    processSupplierGroupPayment(groupId: number): Promise<any>;
    generateSupplierGroupQR(groupId: number): Promise<any>;
    createSupplierGroup(data: any): Promise<any>;
    uploadSupplierImage(file: File): Promise<any>;
    bulkUploadProducts(file: File): Promise<any>;
    getSupplierPickupLocations(): Promise<any>;
    createPickupLocation(locationData: any): Promise<any>;
    updatePickupLocation(locationId: number, locationData: any): Promise<any>;
    deletePickupLocation(locationId: number): Promise<any>;
    generateInvoice(orderId: number): Promise<any>;

    // QR Code
    generateQRCode(qrData: any): Promise<any>;
    scanQRCode(qrCodeData: string): Promise<any>;
    getUserPurchases(userId: number): Promise<any>;
    getProductPurchasers(productId: number): Promise<any>;
    getQRScanHistory(limit?: number, offset?: number): Promise<any>;
    getQRCodeStatusAdmin(qrCodeId: string): Promise<any>;
    markQRCodeAsUsed(qrCodeId: string): Promise<any>;

    // Reports
    getReports(): Promise<any>;
    getMLPerformance(): Promise<any>;
    retrainMLModels(): Promise<any>;
    getMLSystemStatus(): Promise<any>;

    // Payment
    initializePayment(paymentData: any): Promise<any>;
    verifyPayment(transactionId: string): Promise<any>;
    getTransactionFee(amount: number, currency?: string): Promise<any>;

    // Utility
    isAuthenticated(): boolean;
    healthCheck(): Promise<boolean>;
    connectWebSocket(token: string): void;
    disconnectWebSocket(): void;
  }

  const apiService: ApiService;
  export default apiService;
}