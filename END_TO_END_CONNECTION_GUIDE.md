# ConnectSphere End-to-End Connection Guide

Complete guide for connecting the frontend to backend with all API endpoints properly configured.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [API Endpoint Reference](#api-endpoint-reference)
5. [Authentication Flow](#authentication-flow)
6. [Testing Connectivity](#testing-connectivity)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + Vite)                                   │
│  Port: 5173                                                │
│  ├── API Service (api.js)                                  │
│  ├── Components                                            │
│  └── Pages                                                 │
│       ↓ HTTP Requests                                      │
│       ↓ (JSON)                                            │
│  ────────────────────────────────────────                  │
│       ↓                                                    │
│  Backend (FastAPI)                                        │
│  Port: 8000                                               │
│  ├── Authentication (JWT)                                  │
│  ├── API Routers                                          │
│  │   ├── /api/auth     → Authentication                   │
│  │   ├── /api/groups   → Group Buys                       │
│  │   ├── /api/products → Products                         │
│  │   ├── /api/ml       → ML/Recommendations               │
│  │   ├── /api/admin    → Admin Operations                 │
│  │   ├── /api/supplier → Supplier Operations              │
│  │   └── /api/payment  → Payment Processing               │
│  ├── Database (PostgreSQL)                                │
│  └── External Services                                    │
│      ├── Flutterwave (Payments)                           │
│      └── Cloudinary (Images)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Setup

### 1. Environment Variables

Create a `.env` file in `sys/backend/`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/connectsphere

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
CORS_ALLOW_CREDENTIALS=true

# Payment (Flutterwave)
FLUTTERWAVE_PUBLIC_KEY=your-public-key
FLUTTERWAVE_SECRET_KEY=your-secret-key
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key

# Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_PER_MIN=60
RATE_LIMIT_BURST=120
```

### 2. Start Backend

```bash
cd sys/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verify Backend is Running

```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### 4. Check API Documentation

Visit: http://localhost:8000/docs

---

## 💻 Frontend Setup

### 1. Environment Variables

Create a `.env` file in `sys/Front-end/connectsphere/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
cd sys/Front-end/connectsphere
npm install
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend will run on: http://localhost:5173

---

## 🔌 API Endpoint Reference

### Authentication Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

### Trader Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/groups` | Get all group buys | Yes |
| GET | `/api/groups/my-groups` | Get user's joined groups | Yes |
| POST | `/api/groups/{id}/join` | Join a group buy | Yes |
| PUT | `/api/groups/{id}/contribution` | Update contribution | Yes |
| GET | `/api/groups/{id}/qr-code` | Generate QR code for pickup | Yes |
| GET | `/api/ml/recommendations` | Get ML recommendations | Yes |
| GET | `/api/products` | Get all products | Yes |

### Supplier Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/supplier/dashboard/metrics` | Get dashboard metrics | Yes (Supplier) |
| GET | `/api/supplier/orders` | Get supplier orders | Yes (Supplier) |
| GET | `/api/supplier/groups` | Get supplier's groups | Yes (Supplier) |
| GET | `/api/supplier/payments` | Get payment history | Yes (Supplier) |
| GET | `/api/supplier/products` | Get supplier products | Yes (Supplier) |
| POST | `/api/supplier/products` | Create new product | Yes (Supplier) |
| PUT | `/api/supplier/products/{id}/pricing` | Update pricing | Yes (Supplier) |

### Admin Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/admin/dashboard` | Get admin dashboard data | Yes (Admin) |
| GET | `/api/admin/users` | Get all users | Yes (Admin) |
| GET | `/api/admin/groups` | Get all admin groups | Yes (Admin) |
| GET | `/api/admin/groups/active` | Get active groups | Yes (Admin) |
| GET | `/api/admin/groups/ready-for-payment` | Get ready for payment | Yes (Admin) |
| GET | `/api/admin/groups/completed` | Get completed groups | Yes (Admin) |
| POST | `/api/admin/groups/create` | Create admin group | Yes (Admin) |
| PUT | `/api/admin/groups/{id}` | Update admin group | Yes (Admin) |
| DELETE | `/api/admin/groups/{id}` | Delete admin group | Yes (Admin) |
| POST | `/api/admin/upload-image` | Upload image to Cloudinary | Yes (Admin) |
| GET | `/api/admin/ml-performance` | Get ML model performance | Yes (Admin) |
| GET | `/api/admin/ml-system-status` | Get ML system health | Yes (Admin) |
| POST | `/api/admin/qr/scan` | Scan QR code | Yes (Admin) |

### Payment Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/payment/initialize` | Initialize payment | Yes |
| POST | `/api/payment/verify` | Verify payment | Yes |
| GET | `/api/payment/fee` | Get transaction fee | Yes |
| GET | `/api/payment/callback` | Payment callback (Flutterwave) | No |
| POST | `/api/payment/webhook` | Payment webhook (Flutterwave) | No |

---

## 🔐 Authentication Flow

### 1. Login Process

```javascript
// Frontend (api.js)
async login(credentials) {
  const response = await this.request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  // Store token
  localStorage.setItem('token', response.access_token);
  
  return response;
}
```

```python
# Backend (auth.py)
@router.post("/login", response_model=Token)
async def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    # Verify credentials
    user = authenticate_user(db, credentials.email, credentials.password)
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
```

### 2. Authenticated Requests

```javascript
// Frontend - Automatic token injection
async request(endpoint, options = {}) {
  const token = this.getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };
  
  // Add auth token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, config);
  return await response.json();
}
```

```python
# Backend - Token verification
async def verify_token(credentials: HTTPAuthorizationCredentials = Security(http_bearer)):
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        # ... get user from DB
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 3. Role-Based Access

```python
# Backend - Role verification
def verify_admin(user: User = Depends(verify_token)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def verify_supplier(user: User = Depends(verify_token)):
    if user.role != "supplier":
        raise HTTPException(status_code=403, detail="Supplier access required")
    return user
```

---

## 🧪 Testing Connectivity

### 1. Run Automated Test Script

```bash
cd sys/backend
python test_api_endpoints.py
```

This will test:
- ✓ Authentication (login for trader, supplier, admin)
- ✓ Trader endpoints (groups, products, recommendations)
- ✓ Supplier endpoints (dashboard, orders, groups, payments)
- ✓ Admin endpoints (dashboard, users, groups, ML)

### 2. Manual Testing

#### Test Health Check
```bash
curl http://localhost:8000/health
```

#### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "trader@connectsphere.co.zw", "password": "password123"}'
```

#### Test Authenticated Endpoint
```bash
# Replace YOUR_TOKEN with actual token from login response
curl http://localhost:8000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Credentials

#### Trader
- Email: `trader@connectsphere.co.zw`
- Password: `password123`

#### Supplier
- Email: `fresh@produce.co.zw`
- Password: `password123`

#### Admin
- Email: `admin@connectsphere.co.zw`
- Password: `admin123`

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Symptom**: Browser console shows "CORS policy" errors

**Solution**:
1. Check backend `.env` file has correct CORS settings:
   ```
   CORS_ALLOW_ORIGINS=http://localhost:5173
   ```
2. Restart backend server
3. Clear browser cache

### Issue: 401 Unauthorized

**Symptom**: All authenticated requests return 401

**Solutions**:
1. **Token expired**: Login again to get new token
2. **Token not sent**: Check if token is in localStorage:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
3. **Invalid token format**: Ensure "Bearer " prefix:
   ```javascript
   Authorization: `Bearer ${token}`
   ```

### Issue: 403 Forbidden

**Symptom**: Request returns 403 error

**Solution**: User doesn't have required role
- Check user role: `GET /api/auth/me`
- Ensure correct user type is logged in (admin, supplier, trader)

### Issue: Connection Refused

**Symptom**: `ERR_CONNECTION_REFUSED` or `Network Error`

**Solutions**:
1. **Backend not running**: Start backend with `uvicorn main:app --reload`
2. **Wrong port**: Check backend is on port 8000
3. **Wrong URL**: Verify `VITE_API_BASE_URL=http://localhost:8000`

### Issue: 500 Internal Server Error

**Symptom**: Requests return 500

**Solutions**:
1. **Check backend logs**: Look for Python errors in terminal
2. **Database connection**: Verify database is running and `.env` is correct
3. **Missing dependencies**: Run `pip install -r requirements.txt`
4. **Check backend console**: Look for detailed error stack traces

### Issue: Empty Response Data

**Symptom**: API returns empty arrays/objects

**Solutions**:
1. **Database is empty**: Run database seeding:
   ```bash
   cd sys/backend
   python recreate_db.py
   ```
2. **Wrong user**: Some endpoints filter by user (e.g., `/api/groups/my-groups`)
3. **Status filters**: Check if status parameters are excluding data

---

## ✅ Connection Checklist

Before deploying, verify:

- [ ] Backend `.env` file configured
- [ ] Frontend `.env` file configured  
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Database is running and seeded
- [ ] Can login as trader
- [ ] Can login as supplier
- [ ] Can login as admin
- [ ] Trader can view groups
- [ ] Trader can join groups
- [ ] Trader can see recommendations
- [ ] Supplier can see dashboard
- [ ] Supplier can see orders
- [ ] Supplier can see payments
- [ ] Admin can see dashboard
- [ ] Admin can manage groups
- [ ] Admin can see ML analytics
- [ ] QR code scanning works
- [ ] Payment initialization works
- [ ] All API endpoints documented
- [ ] Error handling working
- [ ] Loading states working

---

## 📚 Additional Resources

- **Backend API Docs**: http://localhost:8000/docs
- **API Mapping**: See `FRONTEND_BACKEND_API_MAPPING.md`
- **Database Schema**: See `sys/backend/models/models.py`
- **Frontend API Service**: See `sys/Front-end/connectsphere/src/services/api.js`

---

## 🎉 Success Criteria

Your frontend-backend connection is complete when:

1. ✅ All test users can login
2. ✅ All role-specific pages load with data
3. ✅ API calls show proper loading/error states
4. ✅ CRUD operations work for all entities
5. ✅ Real-time features work (WebSocket if applicable)
6. ✅ Payment flow completes successfully
7. ✅ QR code generation and scanning work
8. ✅ ML recommendations display
9. ✅ No console errors on any page
10. ✅ All automated tests pass

---

**Last Updated**: November 20, 2024  
**Status**: ✅ Fully Connected & Operational

