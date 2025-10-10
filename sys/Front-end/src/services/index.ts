/**
 * Services Index
 * Central export point for all API services
 */
export { api, default as apiService } from './api';
export { authApi, default as authService } from './auth';
export { productsApi, default as productsService } from './products';
export { groupsApi, default as groupsService } from './groups';
export { mlApi, default as mlService } from './ml';

// Re-export types
export type { User, LoginRequest, RegisterRequest, AuthResponse } from './auth';
export type { Product } from './products';
export type { GroupBuy, GroupBuyParticipant } from './groups';
export type { Recommendation, RecommendationResponse, MLMetrics, MLModel } from './ml';
