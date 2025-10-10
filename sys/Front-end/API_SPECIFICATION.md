# ConnectSphere Backend API Specification

This document outlines all the API endpoints your FastAPI backend should implement to work with the ConnectSphere frontend.

**Base URL**: `http://localhost:8000`  
**API Prefix**: `/api`

---

## 🔐 Authentication Endpoints

### Base Path: `/api/auth`

#### 1. **Register User**
```http
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "phone_number": "+1234567890",  // Optional
  "is_admin": false                // Optional, defaults to false
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+1234567890",
    "is_admin": false,
    "created_at": "2025-10-10T12:00:00Z"
  }
}
```

#### 2. **Login User**
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+1234567890",
    "is_admin": false,
    "created_at": "2025-10-10T12:00:00Z"
  }
}
```

#### 3. **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "is_admin": false,
  "created_at": "2025-10-10T12:00:00Z"
}
```

---

## 📦 Products Endpoints

### Base Path: `/api/products`

#### 1. **Get All Products**
```http
GET /api/products

Response: 200 OK
[
  {
    "id": 1,
    "name": "Wireless Mouse",
    "category": "Electronics",
    "unit": "piece",
    "description": "Ergonomic wireless mouse",
    "current_price": 25.99,
    "image_url": "https://example.com/mouse.jpg",
    "created_at": "2025-10-01T12:00:00Z"
  },
  // ... more products
]
```

#### 2. **Get Product by ID**
```http
GET /api/products/{id}

Response: 200 OK
{
  "id": 1,
  "name": "Wireless Mouse",
  "category": "Electronics",
  "unit": "piece",
  "description": "Ergonomic wireless mouse",
  "current_price": 25.99,
  "image_url": "https://example.com/mouse.jpg",
  "created_at": "2025-10-01T12:00:00Z"
}
```

#### 3. **Create Product** (Admin/Trader)
```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "Wireless Mouse",
  "category": "Electronics",
  "unit": "piece",
  "description": "Ergonomic wireless mouse",
  "current_price": 25.99,
  "image_url": "https://example.com/mouse.jpg"
}

Response: 201 Created
{
  "id": 1,
  "name": "Wireless Mouse",
  "category": "Electronics",
  "unit": "piece",
  "description": "Ergonomic wireless mouse",
  "current_price": 25.99,
  "image_url": "https://example.com/mouse.jpg",
  "created_at": "2025-10-01T12:00:00Z"
}
```

#### 4. **Update Product**
```http
PUT /api/products/{id}
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "Updated Product Name",
  "current_price": 29.99
}

Response: 200 OK
{
  "id": 1,
  "name": "Updated Product Name",
  "category": "Electronics",
  "unit": "piece",
  "description": "Ergonomic wireless mouse",
  "current_price": 29.99,
  "image_url": "https://example.com/mouse.jpg",
  "created_at": "2025-10-01T12:00:00Z"
}
```

#### 5. **Delete Product**
```http
DELETE /api/products/{id}
Authorization: Bearer {token}

Response: 204 No Content
```

---

## 👥 Group-Buys Endpoints

### Base Path: `/api/groups`

#### 1. **Get All Group-Buys**
```http
GET /api/groups

Response: 200 OK
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Wireless Mouse",
    "initiator_id": 2,
    "initiator_name": "Jane Doe",
    "target_quantity": 100,
    "current_quantity": 45,
    "deadline": "2025-10-20T23:59:59Z",
    "status": "open",
    "price_per_unit": 20.99,
    "created_at": "2025-10-05T12:00:00Z"
  },
  // ... more group-buys
]
```

#### 2. **Get Group-Buy by ID**
```http
GET /api/groups/{id}

Response: 200 OK
{
  "id": 1,
  "product_id": 1,
  "product_name": "Wireless Mouse",
  "initiator_id": 2,
  "initiator_name": "Jane Doe",
  "target_quantity": 100,
  "current_quantity": 45,
  "deadline": "2025-10-20T23:59:59Z",
  "status": "open",
  "price_per_unit": 20.99,
  "created_at": "2025-10-05T12:00:00Z"
}
```

#### 3. **Create Group-Buy**
```http
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "product_id": 1,
  "target_quantity": 100,
  "deadline": "2025-10-20T23:59:59Z",
  "price_per_unit": 20.99
}

Response: 201 Created
{
  "id": 1,
  "product_id": 1,
  "product_name": "Wireless Mouse",
  "initiator_id": 2,
  "initiator_name": "Jane Doe",
  "target_quantity": 100,
  "current_quantity": 0,
  "deadline": "2025-10-20T23:59:59Z",
  "status": "open",
  "price_per_unit": 20.99,
  "created_at": "2025-10-05T12:00:00Z"
}
```

#### 4. **Join Group-Buy**
```http
POST /api/groups/{id}/join
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "quantity": 5
}

Response: 200 OK
{
  "id": 1,
  "group_buy_id": 1,
  "user_id": 3,
  "user_name": "John Smith",
  "quantity": 5,
  "joined_at": "2025-10-10T14:30:00Z"
}
```

#### 5. **Leave Group-Buy**
```http
POST /api/groups/{id}/leave
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Successfully left the group-buy"
}
```

#### 6. **Get Group-Buy Participants**
```http
GET /api/groups/{id}/participants

Response: 200 OK
[
  {
    "id": 1,
    "group_buy_id": 1,
    "user_id": 3,
    "user_name": "John Smith",
    "quantity": 5,
    "joined_at": "2025-10-10T14:30:00Z"
  },
  // ... more participants
]
```

#### 7. **Get User's Group-Buys**
```http
GET /api/groups/my
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Wireless Mouse",
    "initiator_id": 2,
    "initiator_name": "Jane Doe",
    "target_quantity": 100,
    "current_quantity": 45,
    "deadline": "2025-10-20T23:59:59Z",
    "status": "open",
    "price_per_unit": 20.99,
    "created_at": "2025-10-05T12:00:00Z"
  },
  // ... more group-buys
]
```

---

## 🤖 Machine Learning Endpoints

### Base Path: `/api/ml`

#### 1. **Get Recommendations for Current User**
```http
GET /api/ml/recommendations
Authorization: Bearer {token}

Response: 200 OK
{
  "user_id": 1,
  "recommendations": [
    {
      "product_id": 5,
      "product_name": "Smart Watch",
      "score": 0.95,
      "reason": "Based on your previous purchases",
      "category": "Wearables",
      "price": 199.99
    },
    {
      "product_id": 8,
      "product_name": "Bluetooth Headphones",
      "score": 0.87,
      "reason": "Popular in your cluster",
      "category": "Audio",
      "price": 89.99
    }
  ],
  "algorithm": "hybrid_nmf_tfidf_clustering",
  "generated_at": "2025-10-10T15:00:00Z"
}
```

#### 2. **Get Recommendations for Specific User** (Admin)
```http
GET /api/ml/recommendations/{user_id}
Authorization: Bearer {token}

Response: 200 OK
{
  "user_id": 5,
  "recommendations": [
    // ... recommendations
  ],
  "algorithm": "hybrid_nmf_tfidf_clustering",
  "generated_at": "2025-10-10T15:00:00Z"
}
```

#### 3. **Retrain ML Models** (Admin)
```http
POST /api/ml/retrain
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Model retraining initiated",
  "metrics": {
    "silhouette_score": 0.42,
    "n_clusters": 5,
    "nmf_rank": 10,
    "tfidf_vocab_size": 150
  }
}
```

#### 4. **Get Model Metrics**
```http
GET /api/ml/metrics
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "model_type": "hybrid_recommender",
  "trained_at": "2025-10-10T10:00:00Z",
  "metrics": {
    "silhouette_score": 0.42,
    "n_clusters": 5,
    "nmf_rank": 10,
    "tfidf_vocab_size": 150
  }
}
```

#### 5. **Get Cluster Information for User**
```http
GET /api/ml/cluster/{user_id}
Authorization: Bearer {token}

Response: 200 OK
{
  "cluster_id": 2,
  "similar_users": [5, 12, 23, 45, 67]
}
```

#### 6. **Get All Clusters** (Admin)
```http
GET /api/ml/clusters
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "cluster_id": 0,
    "size": 45,
    "avg_quantity": 12.5,
    "avg_contribution": 85.30,
    "dominant_location": "Zone A"
  },
  // ... more clusters
]
```

#### 7. **Get Training Visualization** (Admin)
```http
GET /api/ml/training-visualization
Authorization: Bearer {token}

Response: 200 OK
{
  "silhouette_scores": [0.35, 0.38, 0.42, 0.40],
  "cluster_sizes": [45, 52, 38, 60, 35],
  "training_dates": ["2025-10-01", "2025-10-05", "2025-10-08", "2025-10-10"],
  "feature_importance": {
    "purchase_frequency": 0.35,
    "avg_order_value": 0.28,
    "category_preference": 0.22,
    "location": 0.15
  }
}
```

#### 8. **Get Recommendation Performance** (Admin)
```http
GET /api/ml/recommendation-performance?days=7
Authorization: Bearer {token}

Response: 200 OK
{
  "period_days": 7,
  "total_recommendations": 1250,
  "total_clicks": 350,
  "total_joins": 95,
  "click_through_rate": 28.0,
  "conversion_rate": 7.6,
  "daily_labels": ["2025-10-04", "2025-10-05", "2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09", "2025-10-10"],
  "daily_ctr": [25.5, 27.2, 28.5, 29.1, 28.8, 27.9, 28.3],
  "daily_conversion": [6.5, 7.1, 7.8, 8.2, 7.5, 7.3, 7.9],
  "daily_recommendations": [180, 175, 182, 178, 185, 170, 180]
}
```

---

## 🛡️ Admin Endpoints

### Base Path: `/api/admin`

#### 1. **Get Dashboard Statistics**
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "total_users": 1245,
  "total_products": 342,
  "active_group_buys": 189,
  "completed_group_buys": 856,
  "total_revenue": 24987.50,
  "total_savings": 8432.20
}
```

#### 2. **Get All Group-Buys** (with filters)
```http
GET /api/admin/groups?status=active&location_zone=Zone A
Authorization: Bearer {admin_token}

Response: 200 OK
[
  {
    "id": 1,
    "product_name": "Wireless Mouse",
    "creator_email": "jane@example.com",
    "location_zone": "Zone A",
    "deadline": "2025-10-20T23:59:59Z",
    "status": "active",
    "total_quantity": 100,
    "moq": 50,
    "moq_progress": 0.9,
    "participants_count": 12,
    "total_contributions": 1890.00,
    "total_paid": 1890.00,
    "is_fully_funded": true
  },
  // ... more group-buys
]
```

#### 3. **Get All Users** (with filters)
```http
GET /api/admin/users?location_zone=Zone A&cluster_id=2
Authorization: Bearer {admin_token}

Response: 200 OK
[
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "location_zone": "Zone A",
    "cluster_id": 2,
    "total_transactions": 15,
    "total_spent": 450.75,
    "created_at": "2025-09-01T12:00:00Z"
  },
  // ... more users
]
```

#### 4. **Complete Group-Buy** (Admin action)
```http
POST /api/admin/groups/{id}/complete
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Group-buy marked as completed",
  "group_buy_id": 1,
  "status": "completed"
}
```

#### 5. **Cancel Group-Buy** (Admin action)
```http
POST /api/admin/groups/{id}/cancel
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Group-buy cancelled",
  "group_buy_id": 1,
  "status": "cancelled"
}
```

#### 6. **Get Reports**
```http
GET /api/admin/reports?period=month
Authorization: Bearer {admin_token}

Query Parameters:
- period: "week" | "month" | "year"

Response: 200 OK
{
  "period": "month",
  "total_group_buys": 156,
  "successful_group_buys": 142,
  "total_participants": 523,
  "total_revenue": 15678.90,
  "avg_savings": 18.5,
  "top_products": [
    {
      "product": "Wireless Mouse",
      "group_count": 23
    },
    {
      "product": "USB-C Cable",
      "group_count": 19
    }
  ],
  "cluster_distribution": [
    {
      "cluster_id": 0,
      "user_count": 105
    },
    {
      "cluster_id": 1,
      "user_count": 98
    }
  ]
}
```

#### 7. **Trigger ML Retraining**
```http
POST /api/admin/retrain
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Model retraining initiated in background",
  "started_at": "2025-10-10T16:00:00Z"
}
```

---

## 🏥 Health Check Endpoints

### Base Path: `/`

#### 1. **Root Health Check**
```http
GET /

Response: 200 OK
{
  "message": "ConnectSphere API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

#### 2. **Detailed Health Check**
```http
GET /health

Response: 200 OK
{
  "status": "healthy",
  "database": "connected",
  "ml_models": "loaded",
  "timestamp": "2025-10-10T16:30:00Z"
}
```

---

## 🔒 Authentication & Authorization

### Headers
All protected endpoints require a Bearer token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Format (JWT)
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "is_admin": false,
  "exp": 1696953600
}
```

### Role-Based Access
- **Public**: Login, Register, Get Products, Get Group-Buys
- **Authenticated**: Create Group-Buy, Join Group-Buy, Get Recommendations
- **Admin**: All `/api/admin/*` endpoints, ML retraining, User management

---

## 📝 Error Responses

### Standard Error Format
```json
{
  "detail": "Error message description",
  "status_code": 400
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

### Example Error Response
```json
{
  "detail": "Email already registered",
  "status_code": 400
}
```

---

## 🚀 Implementation Checklist

### Core Requirements
- [ ] FastAPI framework
- [ ] SQLAlchemy ORM for database
- [ ] PostgreSQL/SQLite database
- [ ] JWT authentication
- [ ] Password hashing (bcrypt)
- [ ] CORS middleware configured for `http://localhost:5173`

### Database Models Needed
- [ ] User (id, email, password_hash, full_name, phone_number, is_admin, created_at)
- [ ] Product (id, name, category, unit, description, current_price, image_url, created_at)
- [ ] GroupBuy (id, product_id, initiator_id, target_quantity, current_quantity, deadline, status, price_per_unit, created_at)
- [ ] GroupBuyParticipant (id, group_buy_id, user_id, quantity, joined_at)
- [ ] Transaction (id, user_id, group_buy_id, amount, quantity, created_at)
- [ ] MLModel (id, model_type, trained_at, metrics_json)

### ML Components
- [ ] scikit-learn for clustering (KMeans)
- [ ] NMF for collaborative filtering
- [ ] TF-IDF for content-based filtering
- [ ] Model persistence (joblib)
- [ ] Background tasks for training

### Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost/connectsphere
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📚 Additional Notes

1. **Pagination**: Consider adding pagination for list endpoints (products, groups, users)
2. **Rate Limiting**: Implement rate limiting for production
3. **Caching**: Cache ML recommendations for performance
4. **WebSockets**: Consider adding WebSocket support for real-time group updates
5. **File Uploads**: May need endpoint for product image uploads
6. **Search**: Add search/filter capabilities to list endpoints

---

## 🧪 Testing the API

Use tools like:
- **Postman** or **Insomnia** for manual testing
- **pytest** with FastAPI TestClient for automated tests
- **Swagger UI** available at `http://localhost:8000/docs`
- **ReDoc** available at `http://localhost:8000/redoc`

---

## 📞 Frontend Integration

The frontend is configured to connect to:
```
Base URL: http://localhost:8000
API Prefix: /api
```

Ensure your FastAPI app runs on port 8000 and has CORS configured:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

**Generated for**: ConnectSphere Capstone Project  
**Last Updated**: October 10, 2025
