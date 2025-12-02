# ML Analytics - Admin Dashboard

## Overview

The ML Analytics feature provides comprehensive monitoring and analysis of machine learning model performance within the ConnectSphere platform. This feature is exclusively available to administrators and displays real-time metrics, performance comparisons, and system health indicators.

## Features

### 1. **System Status Overview**
Four key metrics cards displaying:
- **System Health**: Overall ML system status (Excellent/Good/Fair/Poor)
- **Active Models**: Number of active models out of total models
- **Average Accuracy**: Mean accuracy across all active models
- **Predictions Today**: Total number of predictions made today

### 2. **Model Performance Cards**
Detailed performance metrics for each ML model:
- **Accuracy**: Overall model correctness
- **Precision**: Positive prediction accuracy
- **Recall**: True positive detection rate
- **F1 Score**: Harmonic mean of precision and recall
- **Training Time**: Time taken to train the model
- **Prediction Time**: Average time for a single prediction
- **Status**: Current model state (Active/Training/Inactive/Error)
- **Last Trained**: Timestamp of last training session

### 3. **Model Comparison Table**
Side-by-side comparison of all models sorted by F1 score, showing:
- Model name and icon
- All performance metrics
- Status badges
- Color-coded performance indicators

### 4. **Performance Insights**
Three highlighted cards showing:
- **Best Performer**: Model with highest F1 score
- **Fastest Predictor**: Model with lowest prediction time
- **Most Recent**: Most recently trained model

### 5. **Model Retraining**
One-click button to trigger retraining of all ML models with:
- Loading state during retraining
- Automatic refresh after completion
- Error handling and user feedback

## Technical Implementation

### Frontend Components

**File**: `sys/Front-end/connectsphere/src/pages/admin/MLAnalytics.tsx`

- React component with TypeScript
- Uses Lucide React icons for visual elements
- Integrates with existing UI components (Card, Button, Badge)
- Real-time data fetching with error handling
- Responsive grid layouts for all screen sizes

### Backend Endpoints

**File**: `sys/backend/models/admin.py`

#### 1. GET `/api/admin/ml-performance`
Returns list of ML model performance metrics.

**Response Format**:
```json
[
  {
    "id": 1,
    "model_name": "Hybrid Recommender",
    "accuracy": 0.89,
    "precision": 0.87,
    "recall": 0.85,
    "f1_score": 0.86,
    "training_time": 145.3,
    "prediction_time": 0.08,
    "last_trained": "2024-11-19T10:30:00",
    "status": "active"
  }
]
```

#### 2. GET `/api/admin/ml-system-status`
Returns overall ML system health and statistics.

**Response Format**:
```json
{
  "total_models": 4,
  "active_models": 3,
  "avg_accuracy": 0.85,
  "total_predictions_today": 2487,
  "system_health": "Good",
  "last_training": "2024-11-19T08:15:00"
}
```

#### 3. POST `/api/admin/retrain`
Triggers retraining of ML models.

**Response Format**:
```json
{
  "status": "success",
  "message": "Model retraining initiated"
}
```

### Navigation Integration

#### Desktop Navigation (TopNavigation)
- Added "ML Analytics" menu item with Brain icon
- Located between "Moderation" and "QR Scanner"
- Only visible to admin users

#### Mobile Navigation (MobileBottomNav)
- Added "ML" tab with Brain icon
- Grid layout adjusted to accommodate 6 admin navigation items
- Responsive design maintained

### Routing

**File**: `sys/Front-end/connectsphere/src/App.tsx`

- Route: `/admin/ml-analytics`
- Lazy-loaded component for performance
- Wrapped in MainLayout for consistent UI

## Data Flow

```
Admin User
    ↓
Navigation (clicks "ML Analytics")
    ↓
MLAnalytics Component
    ↓
API Service (apiService.getMLPerformance(), apiService.get('/api/admin/ml-system-status'))
    ↓
Backend (admin.py endpoints)
    ↓
Database Query (MLModel table) OR Mock Data
    ↓
JSON Response
    ↓
Frontend State Update
    ↓
Render Performance Cards & Charts
```

## Mock Data

The system currently returns mock data when no ML models exist in the database:

**Mock Models**:
1. **Hybrid Recommender**: Accuracy 89%, F1 Score 86% (Active)
2. **Collaborative Filter**: Accuracy 82%, F1 Score 79% (Active)
3. **Content-Based Filter**: Accuracy 76%, F1 Score 73% (Active)
4. **Deep Learning Model**: Accuracy 91%, F1 Score 88.5% (Training)

**Mock System Status**:
- Total Models: 4
- Active Models: 3
- Average Accuracy: 85%
- Predictions Today: 2,487
- System Health: Good

## Performance Indicators

### Health Status Colors
- **Excellent**: Green (3+ active models)
- **Good**: Blue (2 active models)
- **Fair**: Yellow (1 active model)
- **Poor**: Red (0 active models)

### Model Status Icons
- **Active**: ✓ Green check circle
- **Training**: ↻ Blue spinning refresh
- **Error**: ! Red alert circle
- **Inactive**: ⏰ Gray clock

### Performance Color Coding
- **Good** (>80% F1): Green
- **Acceptable** (>60% F1): Yellow
- **Poor** (<60% F1): Red

## User Interface

### Color Scheme
- **Accuracy Metrics**: Blue background
- **Precision Metrics**: Green background
- **Recall Metrics**: Purple background
- **F1 Score Metrics**: Yellow background

### Responsive Design
- **Desktop**: 2-column grid for model cards, 4-column for stats
- **Tablet**: 2-column grid maintained
- **Mobile**: Single column layout with stacked cards

### Loading States
- Spinning refresh icon with "Loading ML analytics..." message
- Centered in page with minimum height
- Gray color for non-intrusive appearance

### Error States
- Red banner at top of page
- Alert icon with descriptive error message
- Does not prevent page from loading if partial data available

### Empty States
- Database icon with explanatory message
- "No ML Models" heading
- Call-to-action button to train first model

## Best Practices

### For Developers
1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Use mock data fallbacks**: Ensure UI always displays something useful
3. **Format dates consistently**: Use ISO format from backend, display localized on frontend
4. **Color-code performance**: Use semantic colors (green=good, red=poor)
5. **Optimize queries**: Limit database queries to recent/active models only

### For Administrators
1. **Monitor system health**: Check the status card regularly
2. **Review model performance**: Compare models in the comparison table
3. **Retrain periodically**: Use the retrain button when accuracy drops
4. **Track prediction volume**: Monitor "Predictions Today" for usage patterns
5. **Investigate errors**: Models in "error" state need immediate attention

## Future Enhancements

Potential improvements for production:
1. **Historical Trends**: Line charts showing accuracy over time
2. **Model Versioning**: Track and compare different versions of the same model
3. **A/B Testing**: Compare model performance in production
4. **Auto-Retraining**: Schedule automatic retraining based on performance thresholds
5. **Detailed Logs**: View training logs and error messages
6. **Resource Metrics**: CPU/Memory usage during training and inference
7. **Custom Metrics**: Allow admins to define custom performance metrics
8. **Export Reports**: Download performance reports as PDF/CSV
9. **Alerts & Notifications**: Email/SMS alerts for model performance issues
10. **Model Explainability**: Visualize what factors influence model predictions

## Related Files

### Frontend
- `sys/Front-end/connectsphere/src/pages/admin/MLAnalytics.tsx` - Main component
- `sys/Front-end/connectsphere/src/App.tsx` - Routing configuration
- `sys/Front-end/connectsphere/src/components/navigation/TopNavigation.tsx` - Desktop nav
- `sys/Front-end/connectsphere/src/components/navigation/MobileBottomNav.tsx` - Mobile nav
- `sys/Front-end/connectsphere/src/services/api.js` - API service methods

### Backend
- `sys/backend/models/admin.py` - ML endpoints and business logic
- `sys/backend/models/models.py` - MLModel database model

### UI Components
- `sys/Front-end/connectsphere/src/components/ui/card.tsx`
- `sys/Front-end/connectsphere/src/components/ui/button.tsx`
- `sys/Front-end/connectsphere/src/components/ui/badge.tsx`
- `sys/Front-end/connectsphere/src/components/layout/PageLayout.tsx`

## Testing

To test the ML Analytics feature:

1. **Start the backend server**:
   ```bash
   cd sys/backend
   python main.py
   ```

2. **Start the frontend**:
   ```bash
   cd sys/Front-end/connectsphere
   npm run dev
   ```

3. **Login as admin**:
   - Email: `admin@connectsphere.com`
   - Password: `admin123`

4. **Navigate to ML Analytics**:
   - Click "ML Analytics" in the top navigation
   - Or navigate to `/admin/ml-analytics`

5. **Verify features**:
   - ✓ System status cards display correctly
   - ✓ Model performance cards show mock data
   - ✓ Comparison table is sortable
   - ✓ Performance insights highlight key models
   - ✓ Retrain button triggers API call
   - ✓ Loading states appear during data fetch
   - ✓ Error handling works correctly

## Troubleshooting

### "Failed to load ML analytics data"
- Check backend server is running
- Verify admin authentication token is valid
- Check browser console for detailed error messages
- Ensure `/api/admin/ml-performance` endpoint is accessible

### Models not displaying
- Verify mock data is being returned from backend
- Check network tab for API response
- Ensure MLModelPerformance schema matches frontend interface

### Retrain button not working
- Check `/api/admin/retrain` endpoint exists
- Verify admin has proper permissions
- Check backend logs for errors during retraining

### Navigation not showing ML Analytics
- Verify user is logged in as admin (is_admin: true)
- Check navigation components imported Brain icon
- Ensure route is defined in App.tsx

## API Service Methods

The following methods are available in `apiService`:

```javascript
// Get ML model performance data
await apiService.getMLPerformance();

// Get ML system status
await apiService.get('/api/admin/ml-system-status');

// Trigger model retraining
await apiService.retrainMLModels();
```

## Security

- **Authentication Required**: All ML analytics endpoints require admin authentication
- **Admin-Only Access**: Frontend components check for admin role before rendering
- **Token Verification**: Backend uses `verify_admin` dependency to validate requests
- **Rate Limiting**: Consider adding rate limiting for retrain endpoint in production

## Performance Considerations

- **Lazy Loading**: ML Analytics component is lazy-loaded to reduce initial bundle size
- **Debounced Updates**: Consider debouncing the refresh button to prevent API spam
- **Caching**: Backend could implement caching for system status (updates every 5 minutes)
- **Pagination**: If model list grows large, implement pagination on backend

## Conclusion

The ML Analytics feature provides administrators with comprehensive insights into the machine learning models powering ConnectSphere's recommendation system. With real-time metrics, performance comparisons, and easy retraining capabilities, admins can ensure the ML system maintains optimal performance and delivers accurate recommendations to users.

