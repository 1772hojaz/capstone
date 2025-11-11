# 📊 Complete Data Collection Plan for Group Recommendation System

## Executive Summary

This document outlines a comprehensive data collection strategy to enhance the AI-driven group-buy recommendation system. The plan focuses on collecting behavioral, contextual, and interaction data to improve recommendation accuracy and personalization.

---

## 🎯 Objectives

1. **Capture Complete User Journey**: Track every interaction from landing page to payment completion
2. **Enable Advanced ML**: Collect rich features for collaborative filtering, content-based filtering, and hybrid models
3. **Measure Performance**: Track recommendation effectiveness and system health
4. **Support Personalization**: Gather data on preferences, behavior patterns, and context
5. **Facilitate Research**: Provide data for explainable AI and model evaluation

---

## 📋 Data Collection Categories

### 1. User Behavior Data

#### Page-Level Interactions

- **Page Views**: Track every page visit with URL, timestamp, referrer
- **Time on Page**: Measure engagement duration per page
- **Navigation Patterns**: Track page flow and user journeys
- **Exit Pages**: Identify where users leave the application

#### Group/Product Interactions

- **Group Views**: Every time a user views a group detail page
- **View Duration**: Time spent viewing each group
- **Scroll Depth**: How far users scroll on group detail pages
- **Image Interactions**: Clicks on product images, zoom interactions
- **Repeat Views**: Track when users revisit the same group

#### Search & Discovery

- **Search Queries**: Capture all search terms with results count
- **Filter Usage**: Track applied filters (category, price, location, etc.)
- **Sort Preferences**: How users sort results (price, popularity, newest)
- **Zero-Result Searches**: Queries that return no results (for improvement)
- **Search Refinements**: Sequential searches in same session

#### Engagement Actions

- **Join Clicks**: When users click "Join Group" button
- **Quantity Changes**: Track quantity increase requests
- **Cart Interactions**: Add to cart, remove from cart
- **Wishlist Actions**: Save for later, remove from wishlist
- **Share Actions**: Social shares (WhatsApp, Facebook, copy link)
- **QR Code Scans**: Track QR code generation and scanning events

#### Conversion Events

- **Payment Initiated**: When payment process starts
- **Payment Success/Failure**: Track payment outcomes
- **Join Completion**: Successful group joining
- **Quantity Updates**: Successful quantity increases

### 2. User Profile & Preferences

#### Explicit Preferences (Already Collected)

- Preferred categories
- Budget range
- Experience level
- Preferred group sizes
- Participation frequency

#### Implicit Preferences (To Collect)

- Most viewed categories
- Average price range of viewed groups
- Preferred shopping times (hour of day, day of week)
- Average decision time (view to join)
- Price sensitivity (response to discounts)

### 3. Contextual Data

#### Device & Platform

- Device type (mobile, tablet, desktop)
- Screen resolution
- Browser and OS
- Connection speed
- Language preferences

#### Location & Timing

- User's location zone
- Time zone
- Time of day / day of week
- Seasonal patterns

#### Session Context

- Session duration
- Pages per session
- Entry/exit pages
- Referrer source
- Campaign tracking (UTM parameters)

### 4. Social & Network Data

#### Direct Social Interactions

- Share events (who shared what to whom)
- Referrals (who brought whom to platform)
- Group chat participation
- Social connections

#### Implicit Network Data

- Users in same groups
- Users with similar behavior patterns
- Users in same location
- Users with similar purchase history

### 5. Product & Group Performance

#### Engagement Metrics

- Total views per group
- Unique viewers
- Average view duration
- Click-through rate
- Share count

#### Conversion Metrics

- Join rate
- Payment completion rate
- Time to first join
- Time to target achievement

#### Popularity Indicators

- Trending score (recent activity)
- Velocity (joins per day)
- Social proof (how many joined)

---

## 🗂️ Data Storage Architecture

### 1. Raw Event Store (`events_raw`)

**Purpose**: Immutable append-only log of all user interactions
**Schema**: See `analytics_models.py`
**Retention**: Keep forever (archive old data to cold storage)
**Use**: Historical analysis, reprocessing, debugging

### 2. User Features (`user_behavior_features`)

**Purpose**: Aggregated user-level metrics for ML models
**Update Frequency**: Incremental (after each batch) + Daily full refresh
**Use**: Model training, real-time scoring, dashboards

### 3. Group Metrics (`group_performance_metrics`)

**Purpose**: Aggregated group-level performance data
**Update Frequency**: Daily
**Use**: Trending algorithms, popularity scoring, admin analytics

### 4. Interaction Matrix (`user_group_interaction_matrix`)

**Purpose**: User-item interaction history for collaborative filtering
**Update Frequency**: Real-time
**Use**: Recommendation algorithms, similarity computation

### 5. Feature Store (`feature_store`)

**Purpose**: Precomputed features for low-latency serving
**Update Frequency**: Hourly/Daily
**Use**: Real-time recommendation API

### 6. User Similarity (`user_similarity`)

**Purpose**: Precomputed similarity scores between users
**Update Frequency**: Daily
**Use**: Fast collaborative filtering lookups

---

## 🔧 Implementation Plan

### Phase 1: Foundation (Week 1)

✅ **Completed**:

- Analytics service frontend (`analytics.js`)
- Backend analytics models (`analytics_models.py`)
- Analytics API endpoints (`analytics_router.py`)

**Next Steps**:

1. Add analytics router to `main.py`
2. Run database migrations to create tables
3. Test event ingestion with sample data

### Phase 2: Frontend Instrumentation (Week 2)

**Files to Instrument**:

1. **AllGroups.tsx** (Browse Groups Page)

```typescript
import analyticsService from '../services/analytics';

// Track page view
useEffect(() => {
  analyticsService.trackPageView('all_groups', {
    filter_category: selectedCategory,
    sort_by: sortBy
  });
}, [selectedCategory, sortBy]);

// Track group view
const handleViewGroup = (group) => {
  analyticsService.trackGroupView(group.id, {
    ...group,
    source: 'browse'
  });
  navigate(`/group/${group.id}`);
};

// Track search
const handleSearch = (query) => {
  analyticsService.trackSearch(query, {
    category: selectedCategory
  }, filteredGroups.length);
  setSearchQuery(query);
};

// Track filter
const handleFilterChange = (type, value) => {
  analyticsService.trackFilterApplied(type, value, filteredGroups.length);
  // ... apply filter
};
```

2. **GroupDetail.tsx** (Group Detail Page)

```typescript
import analyticsService from '../services/analytics';

useEffect(() => {
  if (group) {
    analyticsService.trackGroupView(group.id, {
      ...group,
      source: location.state?.source || 'direct'
    });
  }
}, [group]);

const handleJoinClick = () => {
  analyticsService.trackGroupJoinClick(group.id, group);
  // ... proceed with join
};
```

3. **PaymentPage.tsx** (Payment Page)

```typescript
import analyticsService from '../services/analytics';

useEffect(() => {
  analyticsService.trackPageView('payment_page', {
    action: action,
    amount: totalAmount,
    group_id: groupId
  });
}, []);

const handlePaymentInitiate = () => {
  analyticsService.trackPaymentInitiated({
    tx_ref: txRef,
    amount: totalAmount,
    currency: 'USD',
    group_id: groupId,
    action: action
  });
};
```

4. **PaymentSuccess.tsx** (Payment Success Page)

```typescript
import analyticsService from '../services/analytics';

useEffect(() => {
  if (status === 'success') {
    analyticsService.trackPaymentSuccess({
      tx_ref: txRef,
      transaction_id: transactionId,
      amount: amount,
      group_id: groupId,
      action: action
    });
  }
}, [status]);
```

5. **GroupList.tsx** (My Groups Page)

```typescript
import analyticsService from '../services/analytics';

useEffect(() => {
  analyticsService.trackPageView('my_groups');
}, []);

const handleUpdateQuantity = (group) => {
  analyticsService.trackQuantityIncrease(
    group.id,
    group.quantity,
    newQuantity,
    delta,
    price
  );
};
```

6. **Recommendations Page** (If exists)

```typescript
import analyticsService from '../services/analytics';

useEffect(() => {
  if (recommendations.length > 0) {
    analyticsService.trackRecommendationView(recommendations);
  }
}, [recommendations]);

const handleRecommendationClick = (rec, index) => {
  analyticsService.trackRecommendationClick({
    ...rec,
    position: index
  });
};
```

### Phase 3: ETL Pipeline (Week 3-4)

**Create Daily ETL Job** (`analytics/etl_pipeline.py`):

```python
# Aggregate user features
def update_user_features(db):
    for user in users:
        # Calculate engagement metrics
        # Update category preferences
        # Compute behavioral scores
      
# Aggregate group metrics
def update_group_metrics(db):
    for group in groups:
        # Calculate conversion rates
        # Update popularity scores
        # Compute trending scores
      
# Update interaction matrix
def update_interaction_matrix(db):
    # Build user-group interaction data
    # Compute implicit ratings
  
# Compute user similarities
def compute_user_similarities(db):
    # Find similar users
    # Store similarity scores
```

**Schedule ETL**:

- Use cron job or APScheduler
- Run daily at 2 AM
- Alert on failures

### Phase 4: Model Enhancement (Week 5-6)

**Update Recommendation Models** (`ml/ml.py`):

1. **Use New Features**:

```python
def get_recommendations_for_user(user, db):
    # Get user behavior features
    features = db.query(UserBehaviorFeatures).filter(
        UserBehaviorFeatures.user_id == user.id
    ).first()
  
    # Use engagement_score, category_scores, etc.
    # Weight recommendations based on propensity_to_buy
    # Filter by price_sensitivity
```

2. **Incorporate Interaction Data**:

```python
# Use UserGroupInteractionMatrix for CF
interactions = db.query(UserGroupInteractionMatrix).filter(
    UserGroupInteractionMatrix.user_id == user.id
).all()

# Use implicit_rating as signal strength
```

3. **Add Real-time Scoring**:

```python
# Use FeatureStore for low-latency lookups
features = get_cached_features(user_id)
recommendations = score_candidates(user, candidates, features)
```

---

## 📊 Data Collection Events Reference

### Event Types & Properties

| Event Type                  | Properties                                                 | When to Track             |
| --------------------------- | ---------------------------------------------------------- | ------------------------- |
| `page_view`               | `page_name`, `referrer`                                | Every page load           |
| `group_view`              | `group_id`, `product_name`, `price`, `source`      | Group detail page view    |
| `group_join_click`        | `group_id`, `quantity`, `price`                      | Click "Join Group"        |
| `group_join_complete`     | `group_id`, `quantity`, `amount`, `payment_method` | After successful join     |
| `quantity_increase_click` | `group_id`, `old_qty`, `new_qty`, `delta`          | Click quantity increase   |
| `payment_initiated`       | `tx_ref`, `amount`, `group_id`, `action`           | Start payment flow        |
| `payment_success`         | `tx_ref`, `transaction_id`, `amount`, `group_id`   | Payment completes         |
| `payment_failed`          | `tx_ref`, `amount`, `reason`                         | Payment fails             |
| `search`                  | `query`, `filters`, `result_count`                   | Search submission         |
| `filter_applied`          | `filter_type`, `filter_value`, `result_count`        | Filter changed            |
| `sort_applied`            | `sort_by`, `result_count`                              | Sort changed              |
| `share`                   | `group_id`, `share_method`                             | Social share              |
| `qr_scan`                 | `qr_id`, `group_id`, `scan_result`                   | QR code scanned           |
| `recommendation_shown`    | `recommendation_ids`, `top_scores`                     | Recommendations displayed |
| `recommendation_clicked`  | `group_id`, `position`, `score`, `reason`          | Click recommendation      |
| `session_start`           | `session_id`, `is_authenticated`                       | Session begins            |
| `session_end`             | `session_id`, `duration_seconds`                       | Session ends              |
| `location_changed`        | `old_location`, `new_location`                         | User changes location     |
| `profile_updated`         | `fields_changed`                                         | Profile edited            |
| `preferences_updated`     | `preferred_categories`, `budget_range`                 | Preferences changed       |

---

## 📈 Using Collected Data

### 1. Improve Recommendations

**Behavioral Signals**:

- Users who view groups for 30+ seconds are more likely to join → Boost longer-viewed groups
- Users who search specific categories → Show more groups in those categories
- Users who join groups within 2 hours of discovery → Show "ending soon" groups prominently

**Collaborative Filtering**:

- Find similar users based on `UserSimilarity` table
- Recommend groups that similar users joined
- Weight by similarity_score

**Content-Based Filtering**:

- Use category_scores from `UserBehaviorFeatures`
- Match group categories to user preferences
- Consider price_sensitivity for price-based ranking

**Hybrid Approach**:

- Combine CF + CBF + Popularity + Context
- Weight by user's engagement_score
- Adjust by time of day / day of week patterns

### 2. Personalization

**Dynamic UI**:

- Show categories user views most at top
- Adjust default filters based on past selections
- Surface "Continue Shopping" for abandoned groups

**Smart Notifications**:

- Send push notifications at user's peak_activity_hour
- Alert for groups in top categories
- Remind about groups viewed but not joined

**Adaptive Pricing Display**:

- Emphasize discounts for price-sensitive users
- Show total savings for value-focused users

### 3. Performance Monitoring

**Track Key Metrics**:

- Recommendation click-through rate
- Recommendation conversion rate
- Time to join after recommendation
- Search success rate
- Page abandonment rates

**A/B Testing**:

- Test different recommendation algorithms
- Compare UI variations
- Measure feature effectiveness

### 4. Business Intelligence

**User Segmentation**:

- High-value users (high engagement_score, multiple joins)
- At-risk users (high churn_risk_score)
- New users (low total_events)
- Power users (high loyalty_score)

**Product Insights**:

- Which groups convert best
- Optimal pricing strategies
- Best-performing categories
- Seasonal trends

**Operational Metrics**:

- Peak traffic times
- Conversion funnels
- Drop-off points
- Feature adoption rates

---

## 🔒 Privacy & Compliance

### Data Collection Principles

1. **Transparency**: Inform users about data collection
2. **Consent**: Get explicit consent for tracking
3. **Anonymization**: Hash PII, store minimal identifiable data
4. **Retention**: Define data retention policies
5. **Access Control**: Limit who can access raw data

### GDPR/CCPA Compliance

- Provide data export functionality
- Allow users to opt-out of tracking
- Implement data deletion on request
- Store data processing records
- Conduct regular audits

### Security

- Encrypt sensitive data at rest
- Use HTTPS for all data transmission
- Implement rate limiting on analytics endpoints
- Monitor for suspicious activity
- Regular security audits

---

## 🚀 Quick Start Checklist

### Immediate Actions (This Week)

- [ ] Add analytics router to `main.py`
- [ ] Run database migrations to create analytics tables
- [ ] Instrument AllGroups.tsx with tracking
- [ ] Instrument GroupDetail.tsx with tracking
- [ ] Test event ingestion pipeline

### Week 2

- [ ] Instrument PaymentPage.tsx
- [ ] Instrument PaymentSuccess.tsx
- [ ] Instrument GroupList.tsx
- [ ] Add search tracking
- [ ] Test complete user journey tracking

### Week 3

- [ ] Create ETL pipeline script
- [ ] Schedule daily ETL job
- [ ] Verify feature computation
- [ ] Build monitoring dashboard

### Week 4

- [ ] Update ML models to use new features
- [ ] Test recommendation improvements
- [ ] Measure baseline metrics
- [ ] Launch A/B test

---

## 📚 Additional Resources

### Implementation Files Created

1. `/sys/Front-end/connectsphere/src/services/analytics.js` - Frontend tracking service
2. `/sys/backend/models/analytics_models.py` - Database schema
3. `/sys/backend/analytics/analytics_router.py` - API endpoints

### Files to Create

1. `/sys/backend/analytics/__init__.py` - Package init
2. `/sys/backend/analytics/etl_pipeline.py` - Daily aggregation jobs
3. `/sys/backend/analytics/feature_engineering.py` - Feature computation logic

### Files to Update

1. `/sys/backend/main.py` - Add analytics router
2. `/sys/Front-end/connectsphere/src/pages/*.tsx` - Add tracking calls

### Testing

- Unit tests for analytics service
- Integration tests for event ingestion
- E2E tests for complete tracking flow
- Load tests for high-volume scenarios

---

## 🎯 Expected Outcomes

After implementing this data collection plan:

1. **Recommendation Accuracy**: 30-50% improvement in click-through rate
2. **Personalization**: Better user experience with tailored recommendations
3. **Business Insights**: Data-driven decisions on product offerings
4. **Model Performance**: Richer features for ML models
5. **User Engagement**: Increased session duration and conversion rates

rovide data for explainable AI and model evaluation---

## 📞 Supportrovide data for explainable AI and model evaluation

For questions or issues:

- Review implementation files in `/sys/backend/analytics/`
- Check database schema in `analytics_models.py`
- Refer to frontend service in `analytics.js`
- Test endpoints in Swagger UI: `http://localhost:8000/docs`

---

**Last Updated**: November 8, 2025
**Version**: 1.0
**Status**: Ready for Implementation
