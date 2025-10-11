# Frontend-Backend Integration Guide

## Overview

The new Vite + React + TypeScript frontend has been successfully integrated with the FastAPI backend.

## Architecture

```
Frontend (Vite + React + TS)     Backend (FastAPI + Python)
    Port: 3000                       Port: 8000
         |                                |
         |---- API Requests (/api) ----->|
         |<--- JSON Responses ------------|
```

## Files Created

### 1. API Service Layer (`src/services/`)

- **`api.ts`**: Base API client with authentication handling
- **`auth.ts`**: Authentication endpoints (login, register, me)
- **`products.ts`**: Products CRUD operations
- **`groups.ts`**: Group-buys management
- **`ml.ts`**: ML recommendations and model metrics
- **`index.ts`**: Central export for all services

### 2. Configuration

- **`vite.config.ts`**: Updated with proxy configuration for `/api` → `http://localhost:8000`
- **`.env`**: Environment variables for API base URL
- **`.env.example`**: Template for environment variables

### 3. Components

- **`components/ConnectionTest.tsx`**: Test component to verify backend connection

## How to Run

### 1. Start the Backend (Terminal 1)

```bash
cd ~/capstone/sys/backend

# Activate virtual environment (if using one)
source venv/bin/activate  # or: source ~/.venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Initialize database (first time only)
python init_db.py

# Seed data (optional)
python seed_mbare_data.py

# Start the backend
python main.py
```

Backend will run on: **http://localhost:8000**

### 2. Start the Frontend (Terminal 2)

```bash
cd ~/capstone/sys/Front-end

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

### 3. Access the Application

Open your browser to: **http://localhost:3000**

You should see the Connection Test page showing:
- Backend health status
- Products from the database
- Available API endpoints

## API Usage Examples

### Authentication

```typescript
import { authApi } from './services';

// Login
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});
// Token is automatically stored

// Get current user
const user = await authApi.getCurrentUser();

// Logout
authApi.logout();
```

### Products

```typescript
import { productsApi } from './services';

// Get all products
const products = await productsApi.getAll();

// Get single product
const product = await productsApi.getById(1);

// Create product (admin only)
const newProduct = await productsApi.create({
  name: 'Rice',
  category: 'Grains',
  unit: 'kg',
  current_price: 50
});
```

### Group-Buys

```typescript
import { groupsApi } from './services';

// Get all group-buys
const groups = await groupsApi.getAll();

// Create new group-buy
const newGroup = await groupsApi.create({
  product_id: 1,
  initiator_id: userId,
  target_quantity: 100,
  deadline: '2025-12-31',
  price_per_unit: 45
});

// Join a group-buy
await groupsApi.join(groupId, 10); // Join with 10 units
```

### Recommendations

```typescript
import { mlApi } from './services';

// Get recommendations for current user
const recommendations = await mlApi.getRecommendations();

// Get recommendations for specific user (admin)
const userRecs = await mlApi.getRecommendations(userId);

// Retrain ML model (admin)
const result = await mlApi.retrain();
```

## Backend API Endpoints

All endpoints are prefixed with `/api`:

### Authentication (`/api/auth`)
- `POST /auth/login` - Login
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user

### Products (`/api/products`)
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `POST /products` - Create product (admin)
- `PUT /products/{id}` - Update product (admin)
- `DELETE /products/{id}` - Delete product (admin)

### Group-Buys (`/api/groups`)
- `GET /groups` - Get all group-buys
- `GET /groups/{id}` - Get group-buy by ID
- `POST /groups` - Create group-buy
- `POST /groups/{id}/join` - Join group-buy
- `POST /groups/{id}/leave` - Leave group-buy
- `GET /groups/{id}/participants` - Get participants
- `GET /groups/my` - Get user's group-buys

### Machine Learning (`/api/ml`)
- `GET /ml/recommendations` - Get recommendations for current user
- `GET /ml/recommendations/{user_id}` - Get recommendations for user
- `POST /ml/retrain` - Retrain ML model (admin)
- `GET /ml/metrics` - Get model metrics
- `GET /ml/cluster/{user_id}` - Get user's cluster info

### Admin (`/api/admin`)
- Various admin endpoints for dashboard data

### Chat (`/api/chat`)
- Chat/messaging endpoints for group-buys

## Proxy Configuration

The Vite proxy is configured to forward all `/api/*` requests to `http://localhost:8000/api/*`.

This means in your frontend code:
```typescript
// This request:
fetch('/api/products')

// Is automatically proxied to:
fetch('http://localhost:8000/api/products')
```

## CORS Configuration

The backend is already configured to allow requests from:
- `http://localhost:3000` (Vite dev server)
- `http://localhost:3001` (Alternative port)

## Environment Variables

Create a `.env` file in `sys/Front-end/`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL=/api
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## TypeScript Types

All API responses have TypeScript types defined in the service files:

```typescript
import type { User, Product, GroupBuy, Recommendation } from './services';
```

## Authentication Flow

1. User logs in via `authApi.login()`
2. JWT token is received and stored in localStorage
3. Token is automatically included in all subsequent requests
4. On logout, token is cleared via `authApi.logout()`

## Error Handling

All API calls include error handling:

```typescript
try {
  const products = await productsApi.getAll();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Failed to fetch products:', error);
}
```

## Next Steps

1. **Build UI Components**: Create login, dashboard, product list, etc.
2. **Add Routing**: Install React Router for navigation
3. **State Management**: Consider React Context or Zustand for global state
4. **UI Library**: Install Tailwind CSS, Material-UI, or Chakra UI
5. **Forms**: Add form validation with React Hook Form or Formik

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is running
curl http://localhost:8000/health

# Expected response:
{"status":"healthy"}
```

### Frontend can't connect
1. Check backend is running on port 8000
2. Check frontend is running on port 3000
3. Check browser console for CORS errors
4. Verify proxy configuration in `vite.config.ts`

### Database errors
```bash
# Reset database
cd sys/backend
python init_db.py

# Seed with test data
python seed_mbare_data.py
```

## Production Build

```bash
cd sys/Front-end

# Build for production
npm run build

# Preview production build
npm run preview
```

The built files will be in `sys/Front-end/dist/`.

## Testing the Integration

1. Start both backend and frontend
2. Open http://localhost:3000
3. You should see the Connection Test page
4. Backend status should show "✅ Backend is healthy"
5. Products should be listed (if database is seeded)

If everything works, the integration is complete! 🎉
