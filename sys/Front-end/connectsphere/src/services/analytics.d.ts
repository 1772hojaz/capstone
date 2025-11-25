/**
 * Type definitions for Analytics Service
 */

export interface AnalyticsEvent {
  event_id: string;
  event_type: string;
  user_id: string | null;
  anonymous_id: string;
  session_id: string;
  timestamp: string;
  properties: Record<string, any>;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  url: string;
  path: string;
  referrer: string;
  user_agent: string;
  screen_resolution: string;
  viewport_size: string;
  timezone: string;
  language: string;
  platform: string;
  connection_type: string;
}

export interface AnalyticsService {
  track(eventType: string, properties?: Record<string, any>): Promise<AnalyticsEvent>;
  flush(): Promise<void>;
  
  // Convenience methods
  trackPageView(pageName: string, properties?: Record<string, any>): Promise<AnalyticsEvent>;
  trackGroupView(groupId: number | string, groupData?: Record<string, any>): Promise<AnalyticsEvent>;
  trackGroupJoinClick(groupId: number | string, groupData?: Record<string, any>): Promise<AnalyticsEvent>;
  trackGroupJoinComplete(groupId: number | string, groupData?: Record<string, any>): Promise<AnalyticsEvent>;
  trackJoinGroup(groupId: number | string, data?: Record<string, any>): Promise<AnalyticsEvent>;
  trackQuantityIncrease(groupId: number | string, oldQty: number, newQty: number, delta: number, price: number): Promise<AnalyticsEvent>;
  trackPaymentInitiated(paymentData: Record<string, any>): Promise<AnalyticsEvent>;
  trackPaymentSuccess(paymentData: Record<string, any>): Promise<AnalyticsEvent>;
  trackPaymentFailed(paymentData: Record<string, any>, reason: string): Promise<AnalyticsEvent>;
  trackSearch(query: string, filters?: Record<string, any>, resultCount?: number): Promise<AnalyticsEvent>;
  trackFilterApplied(filterType: string, filterValue: string, resultCount?: number): Promise<AnalyticsEvent>;
  trackSort(sortBy: string, resultCount?: number): Promise<AnalyticsEvent>;
  trackQRScan(qrData: Record<string, any>): Promise<AnalyticsEvent>;
  trackShare(groupId: number | string, method: string, groupName: string): Promise<AnalyticsEvent>;
  trackNotificationClick(notificationData: Record<string, any>): Promise<AnalyticsEvent>;
  trackLocationChange(oldLocation: string, newLocation: string): Promise<AnalyticsEvent>;
  trackRecommendationView(recommendations: any[]): Promise<AnalyticsEvent>;
  trackRecommendationClick(recommendationData: Record<string, any>): Promise<AnalyticsEvent>;
  trackCategoryView(category: string, groupCount: number): Promise<AnalyticsEvent>;
  trackSessionStart(): Promise<AnalyticsEvent>;
  trackSessionEnd(): Promise<AnalyticsEvent>;
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>): Promise<AnalyticsEvent>;
  trackCartAdd(groupId: number | string, groupData: Record<string, any>): Promise<AnalyticsEvent>;
  trackCartRemove(groupId: number | string): Promise<AnalyticsEvent>;
  trackWishlistAdd(groupId: number | string, groupData: Record<string, any>): Promise<AnalyticsEvent>;
  trackWishlistRemove(groupId: number | string): Promise<AnalyticsEvent>;
  trackProfileUpdate(fieldsChanged: string[]): Promise<AnalyticsEvent>;
  trackPreferencesUpdate(preferences: Record<string, any>): Promise<AnalyticsEvent>;
}

declare const analyticsService: AnalyticsService;
export default analyticsService;

