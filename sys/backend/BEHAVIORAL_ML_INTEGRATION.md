# Behavioral ML Integration Guide

## Overview
The Behavioral ML Service enhances recommendation quality by leveraging comprehensive behavioral analytics data. It integrates seamlessly with the existing hybrid recommendation system.

## Architecture

### Components Created

1. **BehavioralMLService** (`ml/behavioral_ml_service.py`)
   - Phase 1: Implicit ratings & feature extraction
   - Phase 2: Content-based enhancement  
   - Phase 3: Sequential pattern mining & session-based recommendations
   - Phase 4: Real-time updates

2. **Behavioral ML Router** (`analytics/behavioral_ml_router.py`)
   - 9 REST API endpoints for behavioral recommendations
   - Authentication & authorization integrated

## Key Features

### 1. Implicit Rating Calculation
Converts behavioral signals to 0-5 ratings with time decay:
- Purchase: 10.0 points
- Group join: 9.0 points
- Cart checkout: 7.0 points
- Add to cart: 6.0 points
- Product view: 2.0 points
- etc.

### 2. Comprehensive Feature Extraction
Extracts 22+ behavioral features per user:
- Activity metrics (events, products, groups)
- Engagement metrics (purchases, views, joins)
- Conversion rates (view→click, click→join, join→purchase)
- Temporal patterns (peak hours, days, recency)
- Category preferences (diversity, exploration)

### 3. Sequential Pattern Mining
Predicts next likely products from browsing sequences:
- Pattern: User views A → B → C, then likely to buy D
- Uses sliding window approach
- Sample top 200 users for performance

### 4. Session-Based Recommendations
Context-aware recommendations based on current session:
- Infers intent (transactional, research, browsing, etc.)
- Recommends based on recently viewed categories
- Real-time session tracking

### 5. Real-Time Feature Updates
Updates UserBehaviorFeatures immediately on interactions:
- View, click, join, purchase events
- Recalculates conversion rates
- Updates engagement scores

## API Endpoints

### 1. Get Behavioral Recommendations
```http
POST /api/behavioral-ml/recommendations
Authorization: Bearer <token>

{
  "user_id": 123,
  "session_id": "abc-def-123",
  "limit": 10,
  "weights": {
    "content": 0.5,
    "sequential": 0.3,
    "session": 0.2
  }
}
```

Response:
```json
[
  {
    "group_buy_id": 45,
    "product_id": 12,
    "product_name": "Cooking Oil 5L",
    "recommendation_score": 0.87,
    "reasons": [
      "Matches your interests",
      "Based on your browsing pattern"
    ],
    "weights_used": {"content": 0.5, "sequential": 0.3, "session": 0.2},
    "behavioral_enhanced": true
  }
]
```

### 2. Track User Interaction
```http
POST /api/behavioral-ml/track-interaction
Authorization: Bearer <token>

{
  "product_id": 12,
  "interaction_type": "view"
}
```

### 3. Get User Behavioral Profile
```http
GET /api/behavioral-ml/user-profile/behavioral?user_id=123
Authorization: Bearer <token>
```

Response:
```json
{
  "user_id": 123,
  "static_preferences": {
    "preferred_categories": ["Food", "Household"],
    "budget_range": "medium"
  },
  "behavioral_preferences": {
    "top_categories": ["Food", "Household", "Electronics"],
    "engagement_level": 45,
    "conversion_rate": 0.32
  },
  "behavioral_features": {
    "total_events": 45,
    "purchases": 3,
    "view_to_click_rate": 0.45,
    "recency_score": 0.87
  }
}
```

### 4. Explain Recommendation
```http
GET /api/behavioral-ml/recommendations/explain?group_buy_id=45&user_id=123
Authorization: Bearer <token>
```

### 5. Get Implicit Rating
```http
GET /api/behavioral-ml/features/implicit-rating?product_id=12&user_id=123
Authorization: Bearer <token>
```

### 6. Session-Based Recommendations
```http
GET /api/behavioral-ml/session/recommendations?session_id=abc-def-123&limit=10
```

### 7. Sequential Pattern Predictions
```http
GET /api/behavioral-ml/sequential/next-products?recent_product_ids=12,15,18&top_k=10
Authorization: Bearer <token>
```

### 8. Health Check
```http
GET /api/behavioral-ml/health
```

## Integration with Existing ML System

### Option 1: Replace Current Recommendations (Full Integration)
Modify `ml/ml.py` `get_recommendations_for_user()`:

```python
from ml.behavioral_ml_service import get_behavioral_ml_service

def get_recommendations_for_user(user: User, db: Session) -> List[dict]:
    """Generate recommendations using Behavioral ML"""
    
    # Get behavioral ML service
    behavioral_service = get_behavioral_ml_service(db)
    
    # Get enhanced recommendations
    recommendations = behavioral_service.get_enhanced_recommendations(
        user_id=user.id,
        session_id=None,  # Get from request if available
        limit=10
    )
    
    # Format for existing response structure
    formatted_recs = []
    for rec in recommendations:
        group_buy = db.query(GroupBuy).get(rec['group_buy_id'])
        formatted_recs.append({
            'group_buy_id': rec['group_buy_id'],
            'product_id': rec['product_id'],
            'product_name': rec['product_name'],
            'score': rec['recommendation_score'],
            'reasons': rec['reasons'],
            'group_buy': group_buy  # Full object if needed
        })
    
    return formatted_recs
```

### Option 2: Hybrid Approach (Gradual Migration)
Blend existing hybrid model with behavioral model:

```python
def get_recommendations_for_user(user: User, db: Session) -> List[dict]:
    """Blended recommendations: 50% existing + 50% behavioral"""
    
    # Get existing hybrid recommendations
    existing_recs = get_hybrid_recommendations_original(user, db, limit=10)
    
    # Get behavioral recommendations
    behavioral_service = get_behavioral_ml_service(db)
    behavioral_recs = behavioral_service.get_enhanced_recommendations(
        user_id=user.id,
        limit=10
    )
    
    # Blend scores (50/50)
    blended_recs = {}
    for rec in existing_recs:
        blended_recs[rec['group_buy_id']] = {
            'score': rec['score'] * 0.5,
            'data': rec
        }
    
    for rec in behavioral_recs:
        if rec['group_buy_id'] in blended_recs:
            blended_recs[rec['group_buy_id']]['score'] += rec['recommendation_score'] * 0.5
        else:
            blended_recs[rec['group_buy_id']] = {
                'score': rec['recommendation_score'] * 0.5,
                'data': rec
            }
    
    # Sort by blended score
    final_recs = sorted(
        blended_recs.values(),
        key=lambda x: x['score'],
        reverse=True
    )[:10]
    
    return [r['data'] for r in final_recs]
```

### Option 3: A/B Testing (Recommended)
Run both systems in parallel and compare:

```python
import random

def get_recommendations_for_user(user: User, db: Session) -> List[dict]:
    """A/B test: 50% users get behavioral, 50% get original"""
    
    # Determine variant (deterministic based on user_id)
    variant = 'behavioral' if user.id % 2 == 0 else 'original'
    
    if variant == 'behavioral':
        behavioral_service = get_behavioral_ml_service(db)
        recs = behavioral_service.get_enhanced_recommendations(
            user_id=user.id,
            limit=10
        )
        # Log variant for analytics
        log_recommendation_variant(user.id, 'behavioral', recs)
    else:
        recs = get_hybrid_recommendations_original(user, db, limit=10)
        log_recommendation_variant(user.id, 'original', recs)
    
    return recs
```

## Frontend Integration

### Track Interactions
```typescript
// services/analytics.js
import axios from 'axios';

export const trackProductView = async (productId: number) => {
  await axios.post('/api/behavioral-ml/track-interaction', {
    product_id: productId,
    interaction_type: 'view'
  }, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
};

export const trackProductClick = async (productId: number) => {
  await axios.post('/api/behavioral-ml/track-interaction', {
    product_id: productId,
    interaction_type: 'click'
  }, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
};
```

### Get Behavioral Recommendations
```typescript
// pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const DashboardPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      const sessionId = sessionStorage.getItem('session_id');
      
      const response = await axios.post('/api/behavioral-ml/recommendations', {
        session_id: sessionId,
        limit: 10
      }, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      setRecommendations(response.data);
    };
    
    fetchRecommendations();
  }, []);
  
  return (
    <div>
      <h2>Recommended for You</h2>
      {recommendations.map(rec => (
        <div key={rec.group_buy_id}>
          <h3>{rec.product_name}</h3>
          <p>Score: {rec.recommendation_score.toFixed(2)}</p>
          <ul>
            {rec.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
```

## Performance Considerations

### 1. Caching
The behavioral ML service calculates features on-demand. For production:

```python
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=1000)
def get_cached_user_profile(user_id: int, cache_key: str):
    """Cache user profiles for 5 minutes"""
    # cache_key includes timestamp rounded to 5-min intervals
    service = get_behavioral_ml_service(db)
    return service.content_filter.build_user_profile_with_behavior(user_id)

# Usage
cache_key = f"{user_id}_{datetime.now().replace(second=0, microsecond=0).isoformat()}"
profile = get_cached_user_profile(user_id, cache_key)
```

### 2. Background Processing
For sequential pattern mining (expensive operation):

```python
from celery import Celery

celery = Celery('behavioral_ml')

@celery.task
def precompute_sequential_patterns():
    """Run nightly to precompute patterns"""
    service = get_behavioral_ml_service(db)
    
    # Compute patterns for all active users
    active_users = db.query(User).filter(User.is_active).limit(1000).all()
    
    for user in active_users:
        patterns = service.sequential_miner.extract_user_sequences(user.id)
        # Cache patterns in Redis or database
        cache_patterns(user.id, patterns)
```

### 3. Database Indexing
Add indexes for performance:

```sql
-- Index for event queries
CREATE INDEX idx_events_user_timestamp ON events_raw(user_id, timestamp);
CREATE INDEX idx_events_session ON events_raw(session_id);
CREATE INDEX idx_events_type ON events_raw(event_type);

-- Index for behavioral features
CREATE INDEX idx_behavior_features_user ON user_behavior_features(user_id);
CREATE INDEX idx_behavior_features_updated ON user_behavior_features(last_updated);
```

## Testing

### Unit Tests
```python
# tests/test_behavioral_ml.py
import pytest
from ml.behavioral_ml_service import BehavioralFeatureExtractor

def test_implicit_rating_calculation(test_db):
    extractor = BehavioralFeatureExtractor(test_db)
    
    # Create test events
    create_test_events(user_id=1, product_id=10, event_types=['view', 'click', 'purchase'])
    
    rating = extractor.calculate_implicit_rating(user_id=1, product_id=10)
    
    assert 0 <= rating <= 5
    assert rating > 0  # Should have positive rating with purchase

def test_feature_extraction(test_db):
    extractor = BehavioralFeatureExtractor(test_db)
    
    features = extractor.extract_user_features(user_id=1)
    
    assert 'total_events' in features
    assert 'conversion_rate' in features
    assert features['total_events'] >= 0
```

### Integration Tests
```python
def test_behavioral_recommendations_endpoint(client, auth_headers):
    response = client.post(
        '/api/behavioral-ml/recommendations',
        json={'limit': 5},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 5
    assert all('recommendation_score' in rec for rec in data)
```

## Monitoring & Metrics

Track these metrics in production:

1. **Recommendation Quality**
   - Click-through rate (CTR)
   - Conversion rate
   - Average recommendation score
   - User engagement time

2. **Performance**
   - API response time
   - Feature extraction time
   - Sequential pattern computation time
   - Cache hit rate

3. **Coverage**
   - % users with behavioral data
   - Average events per user
   - Feature completeness

## Migration Checklist

- [ ] Deploy behavioral ML service files
- [ ] Register router in main.py
- [ ] Add database indexes for performance
- [ ] Test all endpoints with Postman/curl
- [ ] Implement caching strategy
- [ ] Add monitoring/logging
- [ ] Run A/B test (2 weeks minimum)
- [ ] Compare metrics: behavioral vs original
- [ ] Gradually increase behavioral traffic (25% → 50% → 100%)
- [ ] Monitor for regression
- [ ] Full cutover or hybrid approach based on results

## Expected Improvements

Based on implementation:

1. **With Limited Data (5-50 users)**
   - Precision@10: 17.5% → 25-30%
   - Recall@10: 5.2% → 10-15%
   - Behavioral features help cold start

2. **With Moderate Data (100-500 users)**
   - Precision@10: 30-40%
   - Recall@10: 15-25%
   - Sequential patterns emerge
   - Session-based recommendations effective

3. **With Rich Data (500+ users, 5000+ interactions)**
   - Precision@10: 40-60%
   - Recall@10: 25-40%
   - Strong personalization
   - Accurate next-item prediction

## Troubleshooting

### Issue: Low recommendation scores
**Solution**: Adjust weights in recommendation request:
```json
{
  "weights": {
    "content": 0.6,
    "sequential": 0.2,
    "session": 0.2
  }
}
```

### Issue: Slow sequential pattern mining
**Solution**: Reduce user sample size in `SequentialPatternMiner`:
```python
all_users = self.db.query(User.id).limit(100).all()  # Reduce from 200
```

### Issue: Missing behavioral features
**Solution**: Ensure analytics events are being tracked:
```bash
# Check events table
sqlite3 groupbuy.db "SELECT COUNT(*), event_type FROM events_raw GROUP BY event_type;"
```

## Support

For issues or questions:
1. Check logs: `backend/logs/backend.log`
2. Test health endpoint: `GET /api/behavioral-ml/health`
3. Review error messages in API responses
4. Check database for missing data

## Next Steps

1. **Data Collection**: Ensure events are tracked consistently
2. **Feature Engineering**: Add more behavioral signals as needed
3. **Model Tuning**: Adjust weights based on A/B test results
4. **Advanced Features**: 
   - Add collaborative filtering with behavioral data
   - Implement deep learning models (RNN for sequences)
   - Add context-aware features (time of day, location)
   - Implement multi-armed bandit for weight optimization
