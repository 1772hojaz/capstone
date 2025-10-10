# ConnectSphere API Endpoints - Quick Reference

## 🔍 Quick Overview

Your frontend expects a **FastAPI backend** running on `http://localhost:8000` with the following endpoint structure:

```
http://localhost:8000
├── /                          # Root health check
├── /health                    # Detailed health check
└── /api/                      # All API endpoints
    ├── auth/                  # Authentication
    ├── products/              # Product management
    ├── groups/                # Group-buy operations
    ├── ml/                    # Machine learning & recommendations
    └── admin/                 # Admin operations
```

---

## 📋 Complete Endpoint List

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Create new user account |
| POST | `/login` | No | Login and get JWT token |
| GET | `/me` | Yes | Get current user info |

### 📦 Products (`/api/products`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | No | Get all products |
| GET | `/{id}` | No | Get product by ID |
| POST | `/` | Yes (Trader/Admin) | Create new product |
| PUT | `/{id}` | Yes (Trader/Admin) | Update product |
| DELETE | `/{id}` | Yes (Admin) | Delete product |

### 👥 Group-Buys (`/api/groups`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | No | Get all group-buys |
| GET | `/{id}` | No | Get specific group-buy |
| GET | `/my` | Yes | Get user's group-buys |
| POST | `/` | Yes | Create new group-buy |
| POST | `/{id}/join` | Yes | Join a group-buy |
| POST | `/{id}/leave` | Yes | Leave a group-buy |
| GET | `/{id}/participants` | No | Get group-buy participants |

### 🤖 Machine Learning (`/api/ml`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/recommendations` | Yes | Get recommendations for current user |
| GET | `/recommendations/{user_id}` | Yes (Admin) | Get recommendations for specific user |
| GET | `/metrics` | Yes | Get ML model metrics |
| GET | `/cluster/{user_id}` | Yes | Get user's cluster info |
| GET | `/clusters` | Yes (Admin) | Get all cluster information |
| GET | `/training-visualization` | Yes (Admin) | Get training visualization data |
| GET | `/recommendation-performance` | Yes (Admin) | Get recommendation performance metrics |
| POST | `/retrain` | Yes (Admin) | Trigger ML model retraining |

### 🛡️ Admin (`/api/admin`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/dashboard` | Yes (Admin) | Get dashboard statistics |
| GET | `/groups` | Yes (Admin) | Get all group-buys with filters |
| GET | `/users` | Yes (Admin) | Get all users with filters |
| GET | `/reports` | Yes (Admin) | Generate reports (week/month/year) |
| POST | `/groups/{id}/complete` | Yes (Admin) | Mark group-buy as completed |
| POST | `/groups/{id}/cancel` | Yes (Admin) | Cancel a group-buy |
| POST | `/retrain` | Yes (Admin) | Trigger ML model retraining |

---

## 🎯 Most Important Endpoints to Implement First

### Phase 1: Core Functionality (MVP)
1. **`POST /api/auth/register`** - User registration
2. **`POST /api/auth/login`** - User authentication
3. **`GET /api/auth/me`** - Get current user
4. **`GET /api/products`** - List all products
5. **`GET /api/groups`** - List all group-buys
6. **`POST /api/groups`** - Create group-buy
7. **`POST /api/groups/{id}/join`** - Join group-buy

### Phase 2: Admin Features
8. **`GET /api/admin/dashboard`** - Admin dashboard stats
9. **`GET /api/admin/users`** - User management
10. **`GET /api/admin/groups`** - Group-buy management

### Phase 3: ML Features
11. **`GET /api/ml/recommendations`** - Get recommendations
12. **`GET /api/ml/metrics`** - ML model metrics
13. **`POST /api/ml/retrain`** - Retrain models

---

## 📊 Expected Data Structures

### User Object
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "is_admin": false,
  "created_at": "2025-10-10T12:00:00Z"
}
```

### Product Object
```json
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

### Group-Buy Object
```json
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

### Auth Token Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_admin": false
  }
}
```

### Recommendation Object
```json
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
    }
  ],
  "algorithm": "hybrid_nmf_tfidf_clustering",
  "generated_at": "2025-10-10T15:00:00Z"
}
```

---

## 🔒 Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend returns JWT token
   ↓
3. Frontend stores token in localStorage
   ↓
4. Frontend includes token in all requests:
   Authorization: Bearer {token}
   ↓
5. Backend validates token and returns user data
```

### Frontend Token Storage (Already Implemented)
```typescript
// In src/services/api.ts
setToken(token: string) {
  this.token = token;
  localStorage.setItem('token', token);
}
```

---

## 🚀 Quick Start Commands

### 1. Start Backend
```bash
cd sys/backend
source venv/bin/activate
python main.py
# Backend runs on http://localhost:8000
```

### 2. Start Frontend (ConnectSphere)
```bash
cd sys/Front-end/connectsphere
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. Test Connection
```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📝 Database Tables Needed

1. **users** - User accounts and authentication
2. **products** - Product catalog
3. **group_buys** - Group buying instances
4. **group_buy_participants** - Users who joined group-buys
5. **transactions** - Payment and order records
6. **ml_models** - ML model metadata and metrics
7. **recommendation_events** - Track recommendation performance

---

## 🎨 API Documentation

Once your backend is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive API documentation and testing interface.

---

## 🔍 Troubleshooting

### Frontend Can't Connect to Backend
```
Error: Failed to fetch
```
**Solution**: 
1. Check backend is running on port 8000
2. Verify CORS is configured in backend
3. Check `.env` file has correct `VITE_API_BASE_URL`

### Authentication Errors
```
Error: Invalid token
```
**Solution**:
1. Ensure JWT token is being sent in headers
2. Check SECRET_KEY matches in backend
3. Verify token hasn't expired

### Database Errors
```
Error: No such table: users
```
**Solution**:
1. Run database migrations
2. Ensure `Base.metadata.create_all()` is called
3. Check DATABASE_URL in `.env`

---

## 📚 Additional Resources

- **Full API Spec**: `API_SPECIFICATION.md` (700+ lines of detailed documentation)
- **Backend Setup**: `BACKEND_QUICKSTART.md` (Step-by-step setup guide)
- **Frontend Code**: `/connectsphere/src/services/` (API service implementations)

---

## ✅ Implementation Checklist

- [ ] Set up FastAPI project structure
- [ ] Create database models (User, Product, GroupBuy, etc.)
- [ ] Implement authentication endpoints (register, login)
- [ ] Implement product CRUD endpoints
- [ ] Implement group-buy endpoints
- [ ] Add ML recommendation system
- [ ] Implement admin endpoints
- [ ] Add CORS middleware
- [ ] Test all endpoints with frontend
- [ ] Add data seeding script
- [ ] Deploy to production

---

**Your backend is already partially implemented!** Check `sys/backend/` folder for existing code.

The frontend is **fully complete** and waiting for the backend to be connected! 🚀
