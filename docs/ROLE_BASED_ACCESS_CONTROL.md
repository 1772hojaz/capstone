# Backend Role-Based Access Control (RBAC)

## Overview

This document describes the comprehensive role-based access control system implemented across the ConnectSphere backend API.

## Authentication & Authorization Functions

### Location: `sys/backend/authentication/auth.py`

#### Core Functions

1. **`verify_token(credentials, db)`**
   - **Purpose**: Base authentication - verifies JWT token and returns User object
   - **Access**: All authenticated users
   - **Returns**: User object or raises HTTP 401

2. **`verify_admin(user)`**
   - **Purpose**: Verifies user has admin role
   - **Access**: Admin users only
   - **Returns**: User object or raises HTTP 403
   - **Error Message**: "Admin access required"

3. **`verify_supplier(user)`**
   - **Purpose**: Verifies user has supplier role
   - **Access**: Supplier users only
   - **Returns**: User object or raises HTTP 403
   - **Error Message**: "Supplier access required"

4. **`verify_trader(user)`**
   - **Purpose**: Verifies user has trader role (not admin, not supplier)
   - **Access**: Trader users only (regular users)
   - **Returns**: User object or raises HTTP 403
   - **Error Messages**: 
     - "Admins cannot access trader features"
     - "Suppliers cannot access trader features"

## API Endpoint Protection

### Admin Endpoints

**Module**: `sys/backend/models/admin.py`  
**Protected by**: `verify_admin`  
**Base Path**: `/api/admin`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/groups` | GET | Get all admin groups |
| `/groups` | POST | Create admin group |
| `/groups/{group_id}` | GET | Get group details |
| `/groups/{group_id}` | PUT | Update group |
| `/groups/{group_id}` | DELETE | Delete group |
| `/groups/{group_id}/image` | PUT | Update group image |
| `/groups/{group_id}/process-payment` | POST | Process group payment |
| `/groups/stats` | GET | Get group statistics |
| `/users` | GET | Get all users |
| `/users/{user_id}` | GET | Get user details |
| `/users/{user_id}/ban` | POST | Ban user |
| `/users/{user_id}/unban` | POST | Unban user |
| `/users/{user_id}/role` | PUT | Update user role |
| `/qr/scan` | POST | Scan QR code |
| `/qr/history` | GET | Get scan history |
| `/ml-performance` | GET | Get ML performance metrics |
| `/ml-system-status` | GET | Get ML system status |
| `/upload-image` | POST | Upload image to Cloudinary |

### Supplier Endpoints

**Module**: `sys/backend/models/supplier.py`  
**Protected by**: `verify_supplier`  
**Base Path**: `/api/supplier`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/metrics` | GET | Get supplier dashboard metrics |
| `/products` | GET | Get supplier products |
| `/products` | POST | Create product |
| `/products/{id}/pricing` | PUT | Update pricing |
| `/orders` | GET | Get supplier orders |
| `/orders/{id}/action` | POST | Process order action |
| `/orders/{id}/ship` | POST | Mark order as shipped |
| `/orders/{id}/deliver` | POST | Mark order as delivered |
| `/pickup-locations` | GET, POST | Manage pickup locations |
| `/pickup-locations/{id}` | PUT, DELETE | Update/delete location |
| `/invoices` | GET | Get invoices |
| `/orders/{id}/invoice` | POST | Generate invoice |
| `/payments` | GET | Get supplier payments |
| `/payments/dashboard` | GET | Get payment dashboard |
| `/groups` | GET | Get supplier groups |
| `/groups/active` | GET | Get active groups |
| `/groups/pending-orders` | GET | Get pending orders |
| `/groups/ready-for-payment` | GET | Get ready for payment groups |
| `/groups/moderation-stats` | GET | Get moderation statistics |
| `/groups/{id}` | GET, PUT, DELETE | Manage specific group |
| `/groups/{id}/image` | PUT | Update group image |
| `/groups/{id}/process-payment` | POST | Process group payment |
| `/groups/create` | POST | Create new group |
| `/notifications` | GET | Get notifications |
| `/notifications/{id}/read` | PUT | Mark notification as read |
| `/notifications/mark-all-read` | PUT | Mark all as read |
| `/products/bulk-upload` | POST | Bulk upload products |
| `/upload-image` | POST | Upload image |
| `/analytics/overview` | GET | Get analytics overview |
| `/analytics/revenue-trend` | GET | Get revenue trends |
| `/analytics/group-insights` | GET | Get group insights |

### Trader Endpoints

**Module**: `sys/backend/models/groups.py`  
**Protected by**: `verify_trader`  
**Base Path**: `/api/groups`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{group_id}/qr-code` | GET | Get group QR code |
| `/my-groups` | GET | Get trader's groups |
| `/refunds` | GET | Get trader's refunds |
| `/past-groups-summary` | GET | Get past groups summary |
| `/{group_id}/join` | POST | Join a group |
| `/{group_id}/contribution` | PUT | Update contribution |
| `/{group_id}/update-quantity` | POST | Update quantity |

**Module**: `sys/backend/ml/ml.py`  
**Protected by**: `verify_trader`  
**Base Path**: `/api/ml`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommendations` | GET | Get personalized recommendations |
| `/explain/{group_buy_id}` | GET | Explain recommendation |
| `/explain-cluster` | GET | Explain user cluster |
| `/explain-all-recommendations` | GET | Explain all recommendations |
| `/explain/lime/{group_buy_id}` | GET | LIME explanation |

### ML Admin Endpoints

**Module**: `sys/backend/ml/ml.py`  
**Protected by**: `verify_admin`  
**Base Path**: `/api/ml`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/clusters` | GET | Get cluster information |
| `/retrain` | POST | Trigger model retraining |

### Supplier Endpoints in Groups Module

**Module**: `sys/backend/models/groups.py`  
**Protected by**: `verify_supplier`  
**Base Path**: `/api/groups/supplier/groups`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/active` | GET | Get active groups |
| `/ready-for-payment` | GET | Get completed group orders |
| `/moderation-stats` | GET | Get moderation statistics |
| `/create` | POST | Create supplier group |
| `/{group_id}` | GET | Get group details |
| `/{group_id}/process-payment` | POST | Process payment |
| `/{group_id}/qr/generate` | POST | Generate QR code |

### Public/Mixed Endpoints

Some endpoints use `verify_token` (base authentication) and implement role checks within the function logic:

| Endpoint | Module | Access Control |
|----------|--------|----------------|
| `/api/groups/` (GET) | groups.py | Any authenticated user |
| `/api/groups/{group_id}` (GET) | groups.py | Any authenticated user |
| `/api/auth/register` | auth.py | Public (no auth) |
| `/api/auth/login` | auth.py | Public (no auth) |
| `/api/auth/register-supplier` | auth.py | Public (no auth) |
| `/api/auth/me` | auth.py | Any authenticated user |
| `/api/auth/profile` | auth.py | Any authenticated user |
| `/api/auth/password` | auth.py | Any authenticated user |
| `/api/auth/supplier/profile` | auth.py | Supplier only (inline check) |

## Role Hierarchy

```
┌─────────────────────────────────────┐
│           Role Hierarchy            │
├─────────────────────────────────────┤
│                                     │
│  Admin                              │
│  ├─ Full system access              │
│  ├─ User management                 │
│  ├─ Group moderation                │
│  ├─ ML model management             │
│  ├─ QR code scanning                │
│  └─ Analytics & reporting           │
│                                     │
│  Supplier                           │
│  ├─ Product management              │
│  ├─ Order management                │
│  ├─ Group creation                  │
│  ├─ Payment tracking                │
│  └─ Supplier analytics              │
│                                     │
│  Trader (Regular User)              │
│  ├─ Browse groups                   │
│  ├─ Join groups                     │
│  ├─ View recommendations            │
│  ├─ Make contributions              │
│  └─ Generate QR codes               │
│                                     │
└─────────────────────────────────────┘
```

## Error Responses

### HTTP 401 - Unauthorized
- **Cause**: Invalid, expired, or missing JWT token
- **Messages**:
  - "Invalid token"
  - "Token expired"
  - "User not found"

### HTTP 403 - Forbidden
- **Cause**: Valid authentication but insufficient permissions
- **Messages**:
  - "Admin access required"
  - "Supplier access required"
  - "Admins cannot access trader features"
  - "Suppliers cannot access trader features"

## Implementation Details

### How Role Verification Works

1. **Request arrives** → Extract JWT token from `Authorization: Bearer <token>` header
2. **Token validation** → `verify_token` decodes JWT and retrieves user from database
3. **Role check** → Role-specific function (`verify_admin`, `verify_supplier`, `verify_trader`) checks user roles
4. **Access granted/denied** → Return user object or raise HTTPException

### Example Usage in Endpoints

```python
from authentication.auth import verify_admin, verify_supplier, verify_trader

# Admin-only endpoint
@router.get("/admin/dashboard")
async def get_admin_dashboard(
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    # Only admins can access this
    return {"data": "admin dashboard"}

# Supplier-only endpoint
@router.get("/supplier/orders")
async def get_supplier_orders(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    # Only suppliers can access this
    return {"orders": []}

# Trader-only endpoint
@router.get("/groups/my-groups")
async def get_my_groups(
    trader: User = Depends(verify_trader),
    db: Session = Depends(get_db)
):
    # Only traders can access this
    return {"groups": []}
```

## User Roles in Database

The `User` model includes these role fields:

- `is_admin: bool` - Admin privileges
- `is_supplier: bool` - Supplier account

**Role Logic**:
- `is_admin = True` → Admin user
- `is_supplier = True` → Supplier user  
- `is_admin = False AND is_supplier = False` → Trader (regular user)

## Security Considerations

1. **JWT Expiration**: Tokens expire after 24 hours (configurable)
2. **Role Immutability**: Only admins can change user roles
3. **Password Hashing**: All passwords are hashed using bcrypt
4. **Token Secret**: SECRET_KEY must be kept secure and environment-specific
5. **HTTPS Only**: All API calls should use HTTPS in production
6. **Rate Limiting**: Consider implementing rate limiting for public endpoints

## Testing Role-Based Access

### Test Admin Access
```bash
# Login as admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mbare.co.zw","password":"admin123"}'

# Use admin endpoint
curl -X GET http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer <admin_token>"
```

### Test Supplier Access
```bash
# Login as supplier
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fresh@produce.co.zw","password":"supplier123"}'

# Use supplier endpoint
curl -X GET http://localhost:8000/api/supplier/dashboard/metrics \
  -H "Authorization: Bearer <supplier_token>"
```

### Test Trader Access
```bash
# Login as trader
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tino@gmail.com","password":"tinashe123"}'

# Use trader endpoint
curl -X GET http://localhost:8000/api/ml/recommendations \
  -H "Authorization: Bearer <trader_token>"
```

### Test Cross-Role Access (Should Fail)
```bash
# Try to access trader endpoint with supplier token
curl -X GET http://localhost:8000/api/ml/recommendations \
  -H "Authorization: Bearer <supplier_token>"
# Expected: HTTP 403 - "Suppliers cannot access trader features"

# Try to access admin endpoint with trader token
curl -X GET http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer <trader_token>"
# Expected: HTTP 403 - "Admin access required"
```

## Future Enhancements

1. **Permission System**: Implement fine-grained permissions beyond basic roles
2. **Role Groups**: Create role groups for complex organizations
3. **API Key Authentication**: Add API key support for service-to-service calls
4. **Audit Logging**: Log all role-based access attempts
5. **Two-Factor Authentication**: Add 2FA for admin accounts
6. **OAuth Integration**: Support OAuth providers (Google, Facebook, etc.)

## Changelog

### 2024-11-20 - Initial RBAC Implementation
- Added `verify_supplier` and `verify_trader` functions
- Applied role protection to all supplier endpoints in `supplier.py`
- Applied role protection to trader endpoints in `groups.py`
- Applied role protection to ML endpoints
- Applied role protection to ML explainability endpoints
- Updated supplier group endpoints with proper role checks
- Created comprehensive RBAC documentation

---

**Last Updated**: November 20, 2024  
**Author**: ConnectSphere Development Team

