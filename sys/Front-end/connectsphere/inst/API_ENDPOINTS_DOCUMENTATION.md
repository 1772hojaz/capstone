# ConnectSphere API Endpoints Documentation

**Version:** 1.0  
**Date:** October 11, 2025  
**Project:** ConnectSphere - Group Buying Platform

---

## Table of Contents

1. [Authentication & Users](#authentication--users)
2. [User Management (Admin)](#user-management-admin)
3. [Groups](#groups)
4. [Products](#products)
5. [Group Chat/Messages](#group-chatmessages)
6. [Moderation (Admin)](#moderation-admin)
7. [Notifications](#notifications)
8. [Analytics/Dashboard (Admin)](#analyticsdashboard-admin)
9. [Settings (Admin)](#settings-admin)
10. [Machine Learning/Recommendations](#machine-learningrecommendations)
11. [Currency](#currency)
12. [Query Parameters](#query-parameters)
13. [Response Formats](#response-formats)
14. [Error Codes](#error-codes)
15. [Authentication](#authentication)

---

## Authentication & Users

### Register New User
- **Endpoint:** `POST /api/auth/register`
- **Description:** Register a new user account
- **Authentication:** None
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+263771234567",
  "location": "Harare"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "trader"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

### User Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticate user and get access token
- **Authentication:** None
- **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "trader"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### User Logout
- **Endpoint:** `POST /api/auth/logout`
- **Description:** Logout user and invalidate token
- **Authentication:** Required (Bearer Token)
- **Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Description:** Get authenticated user's profile
- **Authentication:** Required (Bearer Token)
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+263771234567",
    "location": "Harare",
    "role": "trader",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Update Current User Profile
- **Endpoint:** `PUT /api/auth/me`
- **Description:** Update authenticated user's profile
- **Authentication:** Required (Bearer Token)
- **Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+263771234568",
  "location": "Bulawayo"
}
```

### Refresh Token
- **Endpoint:** `POST /api/auth/refresh-token`
- **Description:** Get new access token using refresh token
- **Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Description:** Request password reset link
- **Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Description:** Reset password with token
- **Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

---

## User Management (Admin)

### Get All Users
- **Endpoint:** `GET /api/users`
- **Description:** Get list of all users (admin only)
- **Authentication:** Required (Admin)
- **Query Parameters:**
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `role` (string): Filter by role (trader, admin)
  - `status` (string): Filter by status (active, suspended)
  - `search` (string): Search by name or email
- **Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "trader",
        "status": "active",
        "lastActive": "2 hours ago"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### Get Specific User
- **Endpoint:** `GET /api/users/:id`
- **Description:** Get details of a specific user
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+263771234567",
    "location": "Harare",
    "role": "trader",
    "status": "active",
    "stats": {
      "groupsJoined": 15,
      "groupsCreated": 3,
      "totalSpent": 450.00
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Update User
- **Endpoint:** `PUT /api/users/:id`
- **Description:** Update user details (admin only)
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "role": "admin",
  "status": "active"
}
```

### Delete User
- **Endpoint:** `DELETE /api/users/:id`
- **Description:** Delete user account (admin only)
- **Authentication:** Required (Admin)

### Suspend User
- **Endpoint:** `PATCH /api/users/:id/suspend`
- **Description:** Suspend user account
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "reason": "Violation of terms"
}
```

### Activate User
- **Endpoint:** `PATCH /api/users/:id/activate`
- **Description:** Activate suspended user
- **Authentication:** Required (Admin)

### Get User Statistics
- **Endpoint:** `GET /api/users/stats`
- **Description:** Get overall user statistics
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 1000,
    "suspendedUsers": 50,
    "newUsersThisMonth": 120,
    "growthRate": 15.5
  }
}
```

---

## Groups

### Get All Groups
- **Endpoint:** `GET /api/groups`
- **Description:** Get list of all groups with filters
- **Authentication:** Required
- **Query Parameters:**
  - `status` (string): Filter by status (active, pending, completed, closed)
  - `currency` (string): Filter by currency (USD, ZIG)
  - `category` (string): Filter by product category
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `search` (string): Search by group name or product
- **Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "Wireless Mechanical Keyboard",
        "product": {
          "id": 10,
          "name": "Wireless Mechanical Keyboard",
          "price": 89.99,
          "bulkPrice": 62.99,
          "image": "keyboard.jpg"
        },
        "status": "active",
        "progress": "8/10",
        "participants": 8,
        "targetParticipants": 10,
        "deadline": "2025-01-15T23:59:59Z",
        "savings": 27.00,
        "savingsPercent": 30
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100
    }
  }
}
```

### Get Specific Group
- **Endpoint:** `GET /api/groups/:id`
- **Description:** Get detailed information about a specific group
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Mechanical Keyboard",
    "description": "High-performance mechanical keyboard",
    "product": {
      "id": 10,
      "name": "Wireless Mechanical Keyboard",
      "price": 89.99,
      "bulkPrice": 62.99,
      "moq": 10,
      "image": "keyboard.jpg",
      "category": "Electronics"
    },
    "creator": {
      "id": 5,
      "name": "Sarah Johnson",
      "avatar": "sarah.jpg"
    },
    "status": "active",
    "participants": 8,
    "targetParticipants": 10,
    "currentMembers": [
      {
        "id": 1,
        "name": "John Doe",
        "joinedAt": "2025-01-10T14:30:00Z"
      }
    ],
    "deadline": "2025-01-15T23:59:59Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### Create New Group
- **Endpoint:** `POST /api/groups`
- **Description:** Create a new group buy
- **Authentication:** Required
- **Request Body:**
```json
{
  "productId": 10,
  "name": "Wireless Mechanical Keyboard Group",
  "description": "Join us to get this amazing keyboard at 30% off",
  "targetParticipants": 10,
  "deadlineDays": 7,
  "currency": "USD"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "Wireless Mechanical Keyboard Group",
    "status": "pending",
    "createdAt": "2025-10-11T04:30:00Z"
  },
  "message": "Group created successfully and pending approval"
}
```

### Update Group
- **Endpoint:** `PUT /api/groups/:id`
- **Description:** Update group details
- **Authentication:** Required (Creator or Admin)
- **Request Body:**
```json
{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

### Delete Group
- **Endpoint:** `DELETE /api/groups/:id`
- **Description:** Delete a group
- **Authentication:** Required (Creator or Admin)

### Get My Groups
- **Endpoint:** `GET /api/groups/my-groups`
- **Description:** Get groups created by or joined by current user
- **Authentication:** Required
- **Query Parameters:**
  - `type` (string): Filter by type (created, joined)
  - `status` (string): Filter by status
- **Response:**
```json
{
  "success": true,
  "data": {
    "createdGroups": [...],
    "joinedGroups": [...]
  }
}
```

### Get Group Members
- **Endpoint:** `GET /api/groups/:id/members`
- **Description:** Get list of group members
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "name": "John Doe",
        "avatar": "john.jpg",
        "joinedAt": "2025-01-10T14:30:00Z",
        "role": "member"
      }
    ],
    "totalMembers": 8
  }
}
```

### Join Group
- **Endpoint:** `POST /api/groups/:id/join`
- **Description:** Join an existing group
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "message": "Successfully joined the group",
  "data": {
    "groupId": 1,
    "memberId": 15,
    "joinedAt": "2025-10-11T04:30:00Z"
  }
}
```

### Leave Group
- **Endpoint:** `POST /api/groups/:id/leave`
- **Description:** Leave a group
- **Authentication:** Required

### Get Recommended Groups
- **Endpoint:** `GET /api/groups/recommended`
- **Description:** Get AI-recommended groups based on user interests
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Number of recommendations
- **Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 1,
        "name": "Wireless Mechanical Keyboard",
        "matchScore": 95,
        "reason": "Based on your interest in tech accessories",
        "product": {...}
      }
    ]
  }
}
```

### Get Active Groups
- **Endpoint:** `GET /api/groups/active`
- **Description:** Get active groups for current user
- **Authentication:** Required

### Get Past Groups
- **Endpoint:** `GET /api/groups/past`
- **Description:** Get completed/closed groups for current user
- **Authentication:** Required

---

## Products

### Get All Products
- **Endpoint:** `GET /api/products`
- **Description:** Get product catalog
- **Authentication:** Optional
- **Query Parameters:**
  - `category` (string): Filter by category
  - `minPrice` (number): Minimum price
  - `maxPrice` (number): Maximum price
  - `search` (string): Search products
  - `page` (number): Page number
  - `limit` (number): Items per page
- **Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Wireless Bluetooth Headphones",
        "category": "Electronics",
        "price": 89.99,
        "bulkPrice": 62.99,
        "moq": 10,
        "savingsFactor": 0.30,
        "stock": 150,
        "image": "headphones.jpg",
        "description": "Premium wireless headphones"
      }
    ],
    "pagination": {...}
  }
}
```

### Get Specific Product
- **Endpoint:** `GET /api/products/:id`
- **Description:** Get detailed product information
- **Authentication:** Optional
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Bluetooth Headphones",
    "category": "Electronics",
    "price": 89.99,
    "bulkPrice": 62.99,
    "moq": 10,
    "savingsFactor": 0.30,
    "stock": 150,
    "images": ["img1.jpg", "img2.jpg"],
    "description": "Premium wireless headphones with noise cancellation",
    "features": ["40h battery", "Active noise cancellation"],
    "activeGroups": 5,
    "averageRating": 4.5
  }
}
```

### Create Product
- **Endpoint:** `POST /api/products`
- **Description:** Add new product to catalog (admin only)
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "name": "New Product",
  "category": "Electronics",
  "price": 99.99,
  "bulkPrice": 69.99,
  "moq": 10,
  "stock": 200,
  "description": "Product description",
  "images": ["image1.jpg"]
}
```

### Update Product
- **Endpoint:** `PUT /api/products/:id`
- **Description:** Update product details (admin only)
- **Authentication:** Required (Admin)

### Delete Product
- **Endpoint:** `DELETE /api/products/:id`
- **Description:** Delete product from catalog (admin only)
- **Authentication:** Required (Admin)

### Get Product Categories
- **Endpoint:** `GET /api/products/categories`
- **Description:** Get list of all product categories
- **Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "productCount": 45
      },
      {
        "id": 2,
        "name": "Home & Garden",
        "productCount": 32
      }
    ]
  }
}
```

### Search Products
- **Endpoint:** `GET /api/products/search`
- **Description:** Advanced product search
- **Query Parameters:**
  - `q` (string): Search query
  - `category` (string): Category filter
  - `minPrice` (number): Minimum price
  - `maxPrice` (number): Maximum price

---

## Group Chat/Messages

### Get Group Messages
- **Endpoint:** `GET /api/groups/:groupId/messages`
- **Description:** Get chat messages for a group
- **Authentication:** Required (Group Member)
- **Query Parameters:**
  - `page` (number): Page number
  - `limit` (number): Messages per page (default: 50)
  - `before` (timestamp): Get messages before this timestamp
- **Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "groupId": 5,
        "sender": {
          "id": 10,
          "name": "John Doe",
          "avatar": "john.jpg"
        },
        "content": "Hello everyone!",
        "type": "text",
        "attachments": [],
        "createdAt": "2025-10-11T04:25:00Z",
        "readBy": [1, 2, 3]
      }
    ],
    "hasMore": true
  }
}
```

### Send Message
- **Endpoint:** `POST /api/groups/:groupId/messages`
- **Description:** Send a message to group chat
- **Authentication:** Required (Group Member)
- **Request Body:**
```json
{
  "content": "Hello everyone!",
  "type": "text",
  "attachments": []
}
```

### Delete Message
- **Endpoint:** `DELETE /api/groups/:groupId/messages/:msgId`
- **Description:** Delete a message (sender or admin only)
- **Authentication:** Required

### Mark Message as Read
- **Endpoint:** `POST /api/groups/:groupId/messages/:msgId/read`
- **Description:** Mark a message as read
- **Authentication:** Required

### Upload Attachment
- **Endpoint:** `POST /api/groups/:groupId/attachments`
- **Description:** Upload file attachment
- **Authentication:** Required (Group Member)
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `file`: File to upload
  - `type`: File type (image, video, document)
- **Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/file123.jpg",
    "filename": "image.jpg",
    "size": 245678,
    "type": "image"
  }
}
```

---

## Moderation (Admin)

### Get Pending Groups
- **Endpoint:** `GET /api/moderation/pending-groups`
- **Description:** Get groups pending approval
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "pendingGroups": [
      {
        "id": 1,
        "name": "Premium Watches Collective",
        "creator": "John Smith",
        "category": "Accessories",
        "createdAt": "2025-10-10T12:00:00Z",
        "productId": 15
      }
    ]
  }
}
```

### Approve Group
- **Endpoint:** `POST /api/moderation/groups/:id/approve`
- **Description:** Approve pending group
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "notes": "Approved - meets all criteria"
}
```

### Reject Group
- **Endpoint:** `POST /api/moderation/groups/:id/reject`
- **Description:** Reject pending group
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "reason": "Does not meet platform guidelines"
}
```

### Get Reported Users
- **Endpoint:** `GET /api/moderation/reported-users`
- **Description:** Get list of reported users
- **Authentication:** Required (Admin)

### Ban User
- **Endpoint:** `POST /api/moderation/users/:id/ban`
- **Description:** Ban a user from platform
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "reason": "Violation of terms",
  "duration": "permanent"
}
```

### Get Flagged Content
- **Endpoint:** `GET /api/moderation/flagged-content`
- **Description:** Get flagged messages/content
- **Authentication:** Required (Admin)

---

## Notifications

### Get Notifications
- **Endpoint:** `GET /api/notifications`
- **Description:** Get user notifications
- **Authentication:** Required
- **Query Parameters:**
  - `unreadOnly` (boolean): Show only unread notifications
  - `limit` (number): Number of notifications
- **Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "group_joined",
        "title": "New member joined",
        "message": "John Doe joined your group",
        "read": false,
        "createdAt": "2025-10-11T03:00:00Z",
        "data": {
          "groupId": 5,
          "userId": 10
        }
      }
    ],
    "unreadCount": 3
  }
}
```

### Mark as Read
- **Endpoint:** `PUT /api/notifications/:id/read`
- **Description:** Mark notification as read
- **Authentication:** Required

### Mark All as Read
- **Endpoint:** `PUT /api/notifications/read-all`
- **Description:** Mark all notifications as read
- **Authentication:** Required

### Delete Notification
- **Endpoint:** `DELETE /api/notifications/:id`
- **Description:** Delete a notification
- **Authentication:** Required

---

## Analytics/Dashboard (Admin)

### Get Overview Statistics
- **Endpoint:** `GET /api/analytics/overview`
- **Description:** Get dashboard overview statistics
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeGroups": 45,
    "totalRevenue": 125000,
    "growthRate": 15.5,
    "trends": {
      "users": [150, 180, 220, 280],
      "groups": [20, 25, 30, 45],
      "revenue": [25000, 30000, 35000, 35000]
    }
  }
}
```

### Get User Analytics
- **Endpoint:** `GET /api/analytics/users`
- **Description:** Get detailed user analytics
- **Authentication:** Required (Admin)
- **Query Parameters:**
  - `period` (string): Time period (day, week, month, year)

### Get Group Analytics
- **Endpoint:** `GET /api/analytics/groups`
- **Description:** Get group activity analytics
- **Authentication:** Required (Admin)

### Get Revenue Analytics
- **Endpoint:** `GET /api/analytics/revenue`
- **Description:** Get revenue and financial analytics
- **Authentication:** Required (Admin)

### Get Platform Trends
- **Endpoint:** `GET /api/analytics/trends`
- **Description:** Get platform trends and insights
- **Authentication:** Required (Admin)

---

## Settings (Admin)

### Get System Settings
- **Endpoint:** `GET /api/settings`
- **Description:** Get current system settings
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "platformName": "ConnectSphere",
    "maintenanceMode": false,
    "emailNotifications": true,
    "smsNotifications": false,
    "passwordPolicy": "strong",
    "sessionTimeout": 30,
    "backupEnabled": true,
    "backupRetentionDays": 30
  }
}
```

### Update System Settings
- **Endpoint:** `PUT /api/settings`
- **Description:** Update system settings
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
  "maintenanceMode": true,
  "emailNotifications": false,
  "sessionTimeout": 60
}
```

### Create Backup
- **Endpoint:** `POST /api/settings/backup`
- **Description:** Create database backup
- **Authentication:** Required (Admin)
- **Response:**
```json
{
  "success": true,
  "data": {
    "backupId": "backup_20251011_043000",
    "filename": "backup_20251011_043000.sql",
    "size": 15728640,
    "createdAt": "2025-10-11T04:30:00Z"
  }
}
```

### Get Backups
- **Endpoint:** `GET /api/settings/backups`
- **Description:** Get list of available backups
- **Authentication:** Required (Admin)

---

## Machine Learning/Recommendations

### Get Personalized Recommendations
- **Endpoint:** `GET /api/ml/recommendations`
- **Description:** Get AI-powered product/group recommendations
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Number of recommendations
  - `type` (string): Type (products, groups)
- **Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 1,
        "name": "Wireless Mechanical Keyboard",
        "matchScore": 95,
        "reason": "Based on your interest in tech accessories",
        "image": "keyboard.jpg",
        "price": 89.99,
        "savings": 27.00
      }
    ]
  }
}
```

### Track User Interaction
- **Endpoint:** `POST /api/ml/track-interaction`
- **Description:** Track user interaction for ML learning
- **Authentication:** Required
- **Request Body:**
```json
{
  "type": "view",
  "entityType": "product",
  "entityId": 10,
  "metadata": {
    "duration": 45,
    "source": "recommendation"
  }
}
```

### Get Similar Groups
- **Endpoint:** `GET /api/ml/similar-groups`
- **Description:** Get groups similar to specified group
- **Authentication:** Required
- **Query Parameters:**
  - `groupId` (number): Reference group ID
  - `limit` (number): Number of results

---

## Currency

### Get Exchange Rates
- **Endpoint:** `GET /api/currency/rates`
- **Description:** Get current USD/ZIG exchange rates
- **Authentication:** Optional
- **Response:**
```json
{
  "success": true,
  "data": {
    "baseCurrency": "USD",
    "rates": {
      "ZIG": 1.35,
      "USD": 1.00
    },
    "lastUpdated": "2025-10-11T04:00:00Z"
  }
}
```

### Convert Currency
- **Endpoint:** `POST /api/currency/convert`
- **Description:** Convert amount between currencies
- **Authentication:** Optional
- **Request Body:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "ZIG"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "amount": 100,
    "from": "USD",
    "to": "ZIG",
    "result": 135.00,
    "rate": 1.35
  }
}
```

---

## Query Parameters

### Common Query Parameters

**Pagination:**
```
?page=1&limit=10
```

**Filtering:**
```
?status=active&currency=USD
```

**Sorting:**
```
?sortBy=createdAt&order=desc
```

**Search:**
```
?search=keyboard
```

**Date Range:**
```
?startDate=2025-01-01&endDate=2025-01-31
```

### Example Combined Query
```
GET /api/groups?status=active&currency=USD&page=1&limit=10&sortBy=participants&order=desc
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful",
  "timestamp": "2025-10-11T04:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-10-11T04:30:00Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Detailed Error Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

**Authentication Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Not Found Error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Group with ID 123 not found"
  }
}
```

---

## Authentication

### Bearer Token Authentication

Include the JWT token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

### Token Expiration

- **Access Token:** Expires in 1 hour
- **Refresh Token:** Expires in 7 days

### Refreshing Tokens

When access token expires, use the refresh token endpoint:

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

---

## Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Authenticated:** 1000 requests per 15 minutes per user
- **Admin:** No rate limit

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696999200
```

---

## WebSocket Events (Real-time)

### Connection
```javascript
const socket = io('wss://api.connectsphere.com', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

**New Message:**
```javascript
socket.on('new_message', (data) => {
  // Handle new message
});
```

**Group Update:**
```javascript
socket.on('group_update', (data) => {
  // Handle group status change
});
```

**User Joined:**
```javascript
socket.on('user_joined', (data) => {
  // Handle new member
});
```

---

## API Base URL

- **Production:** `https://api.connectsphere.com`
- **Development:** `http://localhost:3000/api`
- **Staging:** `https://staging-api.connectsphere.com`

---

## Support & Contact

For API support and questions:
- **Email:** api-support@connectsphere.com
- **Documentation:** https://docs.connectsphere.com
- **Status Page:** https://status.connectsphere.com

---

**Document Version:** 1.0  
**Last Updated:** October 11, 2025  
**© 2025 ConnectSphere. All rights reserved.**
