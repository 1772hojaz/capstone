/**
 * Analytics Service - TRADER ONLY
 * 
 * Tracks TRADER user behavior and interactions for analytics and ML recommendations.
 * Events are batched and sent to the backend every 5 seconds or when the page unloads.
 * 
 * NOTE: Backend automatically filters out events from admin and supplier users.
 * Only trader (regular user) events are stored in the analytics database.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 🔴 TEMPORARILY DISABLED - Set to false to disable event tracking
const ANALYTICS_ENABLED = false;

class AnalyticsService {
  constructor() {
    this.enabled = ANALYTICS_ENABLED;
    this.sessionId = this.generateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.eventQueue = [];
    this.flushInterval = 5000; // 5 seconds
    this.maxQueueSize = 10;
    this.sessionStartTime = Date.now();
    
    if (this.enabled) {
      // Start auto-flush
      this.startAutoFlush();
      
      // Track page visibility changes
      this.setupVisibilityTracking();
      
      console.log('✅ Analytics tracking enabled');
    } else {
      console.log('🔴 Analytics tracking disabled');
    }
  }

  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getOrCreateAnonymousId() {
    let anonId = localStorage.getItem('anonymous_id');
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_id', anonId);
    }
    return anonId;
  }

  getUserId() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user_id || payload.sub;
      }
    } catch (e) {
      console.warn('Failed to extract user_id from token');
    }
    return null;
  }

  getContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      connection_type: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
  }

  async track(eventType, properties = {}) {
    // Check if analytics is enabled
    if (!this.enabled) {
      console.log('[Analytics Disabled] Skipping event:', eventType);
      return null;
    }

    const event = {
      event_id: this.generateEventId(),
      event_type: eventType,
      user_id: this.getUserId(),
      anonymous_id: this.anonymousId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties: properties,
      context: this.getContext()
    };

    console.log('Tracking event:', eventType, properties);
    
    // Add to queue
    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      await this.flush();
    }

    return event;
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${API_BASE_URL}/api/analytics/track-batch`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: true
      });
      
      console.log(`Flushed ${eventsToSend.length} analytics events`);
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-queue failed events (with limit)
      this.eventQueue = [...eventsToSend.slice(-5), ...this.eventQueue];
    }
  }

  startAutoFlush() {
    if (!this.enabled) return;

    // Flush periodically
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
      if (this.eventQueue.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const blob = new Blob([JSON.stringify({ events: this.eventQueue })], {
          type: 'application/json'
        });
        navigator.sendBeacon(`${API_BASE_URL}/api/analytics/track-batch`, blob);
      }
    });

    // Flush on visibility change (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  setupVisibilityTracking() {
    if (!this.enabled) return;

    let pageViewStartTime = Date.now();
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeOnPage = Date.now() - pageViewStartTime;
        this.track('page_visibility_hidden', {
          time_on_page_seconds: Math.floor(timeOnPage / 1000),
          page: window.location.pathname
        });
      } else {
        pageViewStartTime = Date.now();
        this.track('page_visibility_visible', {
          page: window.location.pathname
        });
      }
    });
  }

  // === CONVENIENCE METHODS FOR COMMON EVENTS ===

  trackPageView(pageName, properties = {}) {
    return this.track('page_view', { 
      page_name: pageName,
      ...properties 
    });
  }

  trackGroupView(groupId, groupData = {}) {
    return this.track('group_view', {
      group_id: groupId,
      admin_group_id: groupData.admin_group_id,
      product_id: groupData.product_id,
      product_name: groupData.name || groupData.product_name,
      category: groupData.category,
      price: groupData.price,
      original_price: groupData.original_price,
      discount_percentage: groupData.discount_percentage,
      participants: groupData.participants,
      max_participants: groupData.max_participants,
      progress_percentage: (groupData.participants / groupData.max_participants) * 100,
      source: groupData.source || 'unknown', // 'browse', 'recommendation', 'search', 'direct'
      time_remaining_days: groupData.time_remaining_days
    });
  }

  trackGroupJoinClick(groupId, groupData = {}) {
    return this.track('group_join_click', {
      group_id: groupId,
      product_name: groupData.name,
      quantity_requested: groupData.quantity || 1,
      price_at_click: groupData.price,
      total_amount: (groupData.price || 0) * (groupData.quantity || 1),
      current_participants: groupData.participants,
      source: groupData.source || 'unknown'
    });
  }

  trackGroupJoinComplete(groupId, groupData = {}) {
    return this.track('group_join_complete', {
      group_id: groupId,
      product_name: groupData.name,
      quantity: groupData.quantity,
      total_amount: groupData.total_amount,
      payment_method: groupData.payment_method,
      delivery_method: groupData.delivery_method
    });
  }

  // Alias for trackGroupJoinComplete
  trackJoinGroup(groupId, groupData = {}) {
    return this.trackGroupJoinComplete(groupId, groupData);
  }

  trackQuantityIncrease(groupId, oldQty, newQty, delta, price) {
    return this.track('quantity_increase_click', {
      group_id: groupId,
      old_quantity: oldQty,
      new_quantity: newQty,
      quantity_delta: delta,
      price_per_unit: price,
      additional_amount: delta * price
    });
  }

  trackPaymentInitiated(paymentData) {
    return this.track('payment_initiated', {
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      payment_provider: 'flutterwave',
      group_id: paymentData.group_id,
      action: paymentData.action, // 'join' or 'increase'
      quantity: paymentData.quantity
    });
  }

  trackPaymentSuccess(paymentData) {
    return this.track('payment_success', {
      tx_ref: paymentData.tx_ref,
      transaction_id: paymentData.transaction_id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      group_id: paymentData.group_id,
      action: paymentData.action
    });
  }

  trackPaymentFailed(paymentData, reason) {
    return this.track('payment_failed', {
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      reason: reason,
      group_id: paymentData.group_id,
      error_code: paymentData.error_code
    });
  }

  trackSearch(query, filters = {}, resultCount = 0) {
    return this.track('search', {
      query: query,
      filters: filters,
      result_count: resultCount,
      has_results: resultCount > 0
    });
  }

  trackFilterApplied(filterType, filterValue, resultCount = 0) {
    return this.track('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      result_count: resultCount
    });
  }

  trackSort(sortBy, resultCount = 0) {
    return this.track('sort_applied', {
      sort_by: sortBy,
      result_count: resultCount
    });
  }

  trackQRScan(qrData) {
    return this.track('qr_scan', {
      qr_id: qrData.qr_id,
      group_id: qrData.group_id,
      scan_result: qrData.result,
      is_used: qrData.is_used,
      scan_location: qrData.location
    });
  }

  trackShare(groupId, method, groupName) {
    return this.track('share', {
      group_id: groupId,
      group_name: groupName,
      share_method: method // 'whatsapp', 'facebook', 'twitter', 'copy_link', 'email'
    });
  }

  trackNotificationClick(notificationData) {
    return this.track('notification_clicked', {
      notification_id: notificationData.id,
      notification_type: notificationData.type,
      content_id: notificationData.content_id,
      title: notificationData.title
    });
  }

  trackLocationChange(oldLocation, newLocation) {
    return this.track('location_changed', {
      old_location: oldLocation,
      new_location: newLocation
    });
  }

  trackRecommendationView(recommendations) {
    return this.track('recommendations_shown', {
      recommendation_count: recommendations.length,
      recommendation_ids: recommendations.map(r => r.id || r.group_buy_id).slice(0, 10),
      top_scores: recommendations.slice(0, 5).map(r => r.recommendation_score)
    });
  }

  trackRecommendationClick(recommendationData) {
    return this.track('recommendation_clicked', {
      group_id: recommendationData.id || recommendationData.group_buy_id,
      recommendation_score: recommendationData.recommendation_score,
      recommendation_reason: recommendationData.reason,
      position: recommendationData.position, // Position in the recommendation list
      ml_scores: recommendationData.ml_scores
    });
  }

  trackCategoryView(category, groupCount) {
    return this.track('category_view', {
      category: category,
      group_count: groupCount
    });
  }

  trackSessionStart() {
    return this.track('session_start', {
      session_id: this.sessionId,
      is_authenticated: !!this.getUserId()
    });
  }

  trackSessionEnd() {
    const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    return this.track('session_end', {
      session_id: this.sessionId,
      duration_seconds: duration,
      total_events: this.eventQueue.length
    });
  }

  trackError(errorType, errorMessage, context = {}) {
    return this.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: context.stack,
      ...context
    });
  }

  trackCartAdd(groupId, groupData) {
    return this.track('cart_add', {
      group_id: groupId,
      product_name: groupData.name,
      price: groupData.price,
      quantity: groupData.quantity || 1
    });
  }

  trackCartRemove(groupId) {
    return this.track('cart_remove', {
      group_id: groupId
    });
  }

  trackWishlistAdd(groupId, groupData) {
    return this.track('wishlist_add', {
      group_id: groupId,
      product_name: groupData.name,
      price: groupData.price
    });
  }

  trackWishlistRemove(groupId) {
    return this.track('wishlist_remove', {
      group_id: groupId
    });
  }

  trackProfileUpdate(fieldsChanged) {
    return this.track('profile_updated', {
      fields_changed: fieldsChanged
    });
  }

  trackPreferencesUpdate(preferences) {
    return this.track('preferences_updated', {
      preferred_categories: preferences.preferred_categories,
      budget_range: preferences.budget_range,
      experience_level: preferences.experience_level
    });
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Track session start
analyticsService.trackSessionStart();

// Export singleton
export default analyticsService;
