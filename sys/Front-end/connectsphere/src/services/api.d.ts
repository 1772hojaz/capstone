// src/services/api.d.ts
declare module '../services/api' {
  interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
  }

  interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    location_zone: string;
    preferred_categories: string[];
    budget_range: string;
    experience_level: string;
    preferred_group_sizes: number[];
    participation_frequency: string;
  }

  interface AuthResponse {
    access_token: string;
    is_admin: boolean;
    user: any;
  }

  interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    last_login?: string;
    avatar?: string;
  }

  interface ApiService {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    register(userData: RegisterData): Promise<AuthResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<any>;
    updateProfile(profileData: any): Promise<any>;
    getNotificationSettings(): Promise<any>;
    updateNotificationSettings(settings: any): Promise<any>;
    changePassword(passwordData: any): Promise<any>;
    updateContribution(groupId: string, quantity: number): Promise<any>;
    getMyGroups(): Promise<any>;
    joinGroup(groupId: string, joinData: any): Promise<any>;
    getGroupQRCode(groupId: string): Promise<any>;
    getAllGroups(params?: any): Promise<any>;
    getPastGroupsSummary(): Promise<any>;
    getProducts(params?: any): Promise<any>;
    getProduct(productId: string): Promise<any>;
    getRecommendations(): Promise<any>;
    getUserSimilarityRecommendations(): Promise<any>;
    getHybridRecommendations(): Promise<any>;
    getAllUsers(): Promise<User[]>;
    getSystemStats(): Promise<any>;
    getDashboardStats(): Promise<any>;
    getAdminGroups(): Promise<any>;
    getGroupModerationStats(): Promise<any>;
    getActiveGroups(): Promise<any>;
    getReadyForPaymentGroups(): Promise<any>;
    processGroupPayment(groupId: string): Promise<any>;
    getReports(): Promise<any>;
    getMLPerformance(): Promise<any>;
    retrainMLModels(): Promise<any>;
    getMLSystemStatus(): Promise<any>;
    uploadImage(file: File): Promise<any>;
    createAdminGroup(groupData: any): Promise<any>;
    getCategories(): Promise<any>;
    isAuthenticated(): boolean;
    healthCheck(): Promise<boolean>;
  }

  const apiService: ApiService;
  export default apiService;
}