# 📱 QR Code System Guide

## Overview
The QR code system allows traders to generate QR codes for their purchases and admins to scan them during product pickup/collection.

---

## 🎯 Where to Find QR Codes

### **For Traders (Users):**

#### **1. Group Status Page**
- **Location:** `/groups/status/:groupId`
- **File:** `sys/Front-end/connectsphere/src/pages/GroupStatus.tsx`
- **Access:** After joining a group buy
- **Features:**
  - View group buy status
  - Button: **"Show QR Code"** (when order is ready for pickup)
  - Displays QR code for collection

#### **2. Group Detail Page**
- **Location:** `/groups/:groupId`
- **File:** `sys/Front-end/connectsphere/src/pages/GroupDetail.tsx`
- **Access:** Click on any group
- **Features:**
  - Join group buy
  - Generate QR code after successful join

---

## 🔧 Backend Endpoints

### **Admin Endpoints** (`/api/admin/qr/...`)

All QR admin endpoints are in: `sys/backend/models/admin.py`

#### **1. Generate QR Code**
```
POST /api/admin/qr/generate
```
**Request Body:**
```json
{
  "user_id": 123,
  "group_buy_id": 456,
  "validity_days": 30,
  "pickup_location": "Harare Central Branch"
}
```

**Response:**
```json
{
  "qr_code_data": "QR-ABC123DEF456",
  "expires_at": "2025-12-19T10:30:00",
  "message": "QR code generated successfully"
}
```

---

#### **2. Scan QR Code (POST)**
```
POST /api/admin/qr/scan
```
**Request Body:**
```json
{
  "qr_code_data": "QR-ABC123DEF456"
}
```

**Response:**
```json
{
  "user_info": {
    "id": 123,
    "email": "trader@example.com",
    "full_name": "John Trader"
  },
  "product_info": {
    "product_id": 789,
    "product_name": "Mealie Meal 10kg",
    "quantity": 5,
    "unit_price": 7.20
  },
  "purchase_info": {
    "group_buy_id": 456,
    "total_amount": 36.00,
    "purchase_date": "2025-11-15T12:00:00"
  },
  "qr_status": {
    "is_used": false,
    "generated_at": "2025-11-15T12:00:00",
    "expires_at": "2025-12-15T12:00:00",
    "pickup_location": "Harare Central Branch"
  }
}
```

---

#### **3. Scan QR Code (GET)**
```
GET /api/admin/qr/scan/{qr_code_data}
```
**Example:**
```
GET /api/admin/qr/scan/QR-ABC123DEF456
```

---

#### **4. Get User's Purchases**
```
GET /api/admin/qr/user/{user_id}/purchases
```
**Response:** List of all purchases for a user

---

#### **5. Get Product Purchasers**
```
GET /api/admin/qr/product/{product_id}/purchasers
```
**Response:** List of all users who purchased a specific product

---

#### **6. Get QR Scan History**
```
GET /api/admin/qr/scan-history?limit=50&offset=0
```
**Response:** Historical record of all QR scans

---

#### **7. Get QR Code Status**
```
GET /api/admin/qr/status/{qr_code_id}
```
**Response:** Current status of a specific QR code (used/unused, expired, etc.)

---

#### **8. Mark QR as Used**
```
POST /api/admin/qr/mark-used/{qr_code_id}
```
**Purpose:** Mark a QR code as used after product collection

---

### **Trader Endpoints** (`/api/groups/...`)

Located in: `sys/backend/models/groups.py`

#### **Generate QR Code for Group**
```
GET /api/groups/{group_id}/qr-code
```
**Headers:**
```
Authorization: Bearer <trader_token>
```

**Response:**
```json
{
  "qr_code": "iVBORw0KGgoAAAANSUhEUgAA...base64_image...",
  "qr_id": "QR-ABC123DEF456",
  "pickup_location": "Harare Central Branch",
  "expires_at": "2025-12-15T12:00:00",
  "message": "QR code generated successfully"
}
```

---

## 💾 Database Tables

### **1. `qr_code_pickups` Table**
**Model:** `QRCodePickup` in `sys/backend/models/models.py`

**Fields:**
- `id` - Primary key
- `qr_code_data` - Unique QR ID (e.g., "QR-ABC123DEF456")
- `user_id` - Trader who owns this QR
- `group_buy_id` - Associated group buy
- `pickup_location` - Where to collect
- `generated_at` - When QR was created
- `expires_at` - Expiration date
- `is_used` - Boolean (whether product was collected)
- `used_at` - When QR was scanned
- `used_by_staff` - Admin who scanned it
- `used_location` - Actual pickup location

### **2. `qr_scan_history` Table**
**Model:** `QRScanHistory` in `sys/backend/models/models.py`

**Purpose:** Audit trail of all QR scans

**Fields:**
- `id` - Primary key
- `qr_code_data` - QR that was scanned
- `scanned_by_user_id` - Admin who scanned
- `scanned_user_id` - Trader whose QR was scanned
- `group_buy_id` - Associated group
- `product_id` - Product being collected
- `quantity` - Amount collected
- `amount` - Total value
- `scanned_at` - Timestamp
- `pickup_location` - Location
- `scan_result` - Full scan details (JSON)

---

## 🎨 Frontend Implementation

### **Current Status:**
- ❌ **No dedicated QR Scanner page exists yet**
- ❌ **No QR Code display component exists yet**
- ✅ **Backend API is fully implemented**
- ✅ **Database models are ready**

### **Files that Reference QR:**
1. `sys/Front-end/connectsphere/src/pages/GroupStatus.tsx`
   - Shows "Show QR Code" button
   - Ready for integration

2. `sys/Front-end/connectsphere/src/pages/GroupDetail.tsx`
   - Can display QR after joining group

---

## 🚀 To Use QR Codes:

### **For Traders:**
1. Join a group buy
2. Wait for group to complete
3. Navigate to **Group Status** page
4. Click **"Show QR Code"** button
5. Show QR code at pickup location

### **For Admins:**
1. Use QR scanner (mobile camera or app)
2. Scan trader's QR code
3. Backend validates:
   - QR exists in database
   - QR not expired
   - QR not already used
4. System returns purchase details
5. Admin verifies and hands over product
6. QR marked as used

---

## 📦 NPM Packages Needed (Frontend)

To display and scan QR codes, install:

```bash
npm install qrcode.react
npm install @zxing/library  # For QR scanning
```

---

## 🔐 Security Features

1. **Unique QR IDs** - Each QR has a unique random ID
2. **Expiration** - QR codes expire after set period (default 30 days)
3. **One-time use** - QR marked as used after scanning
4. **Encryption** - QR data is hashed for security
5. **Audit trail** - All scans logged in `qr_scan_history`
6. **Admin-only scanning** - Only admins can scan QR codes

---

## 🎯 Next Steps to Fully Implement QR System:

### **Frontend (Need to Create):**

1. **QR Code Display Component** (`QRCodeDisplay.tsx`)
   - Shows QR code image
   - Display QR ID
   - Show expiration date
   - Download/share options

2. **QR Scanner Page** (`QRScanner.tsx`)
   - Admin-only access
   - Camera integration
   - Scan and validate
   - Display purchase info
   - Mark as collected

3. **Update GroupStatus Page**
   - Connect "Show QR Code" button to API
   - Display generated QR code
   - Show pickup instructions

### **Backend (Already Complete):**
- ✅ All endpoints ready
- ✅ Database models created
- ✅ Security implemented
- ✅ Validation logic done

---

## 📝 Example Flow:

```mermaid
1. Trader joins group buy
   ↓
2. Group buy completes
   ↓
3. Trader clicks "Show QR Code"
   ↓
4. Frontend calls: GET /api/groups/{group_id}/qr-code
   ↓
5. Backend generates QR, saves to DB, returns image
   ↓
6. Frontend displays QR code to trader
   ↓
7. Trader goes to pickup location
   ↓
8. Admin scans QR code
   ↓
9. Frontend calls: POST /api/admin/qr/scan
   ↓
10. Backend validates QR, returns purchase info
    ↓
11. Admin confirms and hands over product
    ↓
12. System marks QR as used
```

---

## 🎉 Summary

**QR Code System Status:**
- ✅ **Backend:** Fully implemented and tested
- ✅ **Database:** Tables and models ready
- ✅ **API:** All endpoints working
- ⚠️ **Frontend:** Partially implemented (needs completion)

**Files to Check:**
- Backend: `sys/backend/models/admin.py` (lines 1473-2389)
- Backend: `sys/backend/models/groups.py` (lines 222-400)
- Frontend: `sys/Front-end/connectsphere/src/pages/GroupStatus.tsx`
- Models: `sys/backend/models/models.py` (QRCodePickup, QRScanHistory)

