# Supplier Payment Flow Test Plan

## Overview
This document outlines the complete test plan for the supplier payment flow from admin processing to supplier receiving payment notification.

---

## Payment Flow Architecture

```
Admin Processes Payment 
    ↓
Backend Creates Records
    ├─ SupplierOrder (status: "ready_for_pickup")
    ├─ SupplierPayment (status: "completed")
    └─ Transaction records
    ↓
Supplier Dashboard Updates
    ├─ Payments Tab shows new payment
    ├─ Metrics update (revenue, earnings)
    └─ Orders Tab shows updated order status
```

---

## Backend Implementation

### Endpoint: `POST /api/admin/groups/{group_id}/process-payment`

**What it does:**
1. Validates group has reached target
2. Creates/Updates SupplierOrder
3. Creates SupplierPayment record
4. Creates Transaction records for participants
5. Updates group status

**Payment Record Created:**
```python
SupplierPayment(
    supplier_id=supplier.id,
    order_id=supplier_order.id,
    amount=supplier_payout,
    platform_fee=0.0,  # No platform fee
    payment_method="admin_processed",
    reference_number="PAY-AG-{group_id}-{timestamp}",
    status="completed",
    processed_at=datetime.utcnow()
)
```

### Endpoint: `GET /api/supplier/payments`

**Returns:**
```json
[
  {
    "id": 1,
    "reference_number": "PAY-AG-123-20251125120000",
    "amount": 2520.00,
    "payment_method": "admin_processed",
    "status": "completed",
    "processed_at": "2025-11-25T12:00:00",
    "created_at": "2025-11-25T12:00:00"
  }
]
```

---

## Frontend Implementation

### Supplier Dashboard - Payments Tab

**Features:**
- ✅ Displays payment history
- ✅ Shows payment reference number
- ✅ Displays amount with proper formatting
- ✅ Shows payment status with color-coded badges
- ✅ Empty state when no payments exist
- ✅ Payment summary totals

**Payment Card Display:**
```
┌─────────────────────────────────────┐
│ Payment #PAY-AG-123-...      [✓]   │
│ Reference: PAY-AG-123-...          │
│ Method: admin_processed             │
│ Processed: 11/25/2025              │
│ Created: 11/25/2025 12:00 PM       │
│                  Amount Received    │
│                  $2,520.00          │
└─────────────────────────────────────┘
```

---

## Test Plan

### Test Case 1: Admin Processes Payment

**Prerequisites:**
- Admin user logged in
- Group buy has reached target
- Supplier confirmed the order

**Steps:**
1. Navigate to Group Moderation (`/group-moderation`)
2. Find a completed group with supplier confirmation
3. Click "Process Payment" button
4. Verify success message appears

**Expected Results:**
- ✅ Success alert: "Payment processed successfully!"
- ✅ Group status updates in UI
- ✅ Backend creates SupplierPayment record
- ✅ Backend creates SupplierOrder record

**Backend Verification:**
```sql
-- Check payment was created
SELECT * FROM supplier_payments 
WHERE reference_number LIKE 'PAY-AG-{group_id}%';

-- Check order was updated
SELECT * FROM supplier_orders 
WHERE admin_group_id = {group_id} 
AND status = 'ready_for_pickup';
```

---

### Test Case 2: Supplier Views Payment

**Prerequisites:**
- Payment processed in Test Case 1
- Supplier user logged in

**Steps:**
1. Navigate to Supplier Dashboard (`/supplier-dashboard`)
2. Click on "Payments" tab
3. Verify payment appears in list

**Expected Results:**
- ✅ Payment card displays with correct information
- ✅ Amount shows $2,520.00 (formatted)
- ✅ Status badge shows "completed" in green
- ✅ Reference number matches backend
- ✅ Processed date shows correctly

---

### Test Case 3: Payment Metrics Update

**Prerequisites:**
- Payment processed in Test Case 1
- Supplier user on dashboard

**Steps:**
1. View Overview tab metrics
2. Check "Monthly Revenue" metric
3. Check "Total Savings Generated" metric
4. Navigate to Payments tab
5. Check "Payment Summary" section

**Expected Results:**
- ✅ Monthly Revenue increases by payment amount
- ✅ Payment Summary shows correct totals
- ✅ Total Completed Payments sum is accurate
- ✅ Pending Payments (if any) displayed separately

---

### Test Case 4: Multiple Payments Display

**Prerequisites:**
- Multiple payments processed for supplier

**Steps:**
1. Process 3 different group payments
2. Navigate to Supplier Dashboard → Payments
3. Verify all payments display

**Expected Results:**
- ✅ All payments listed in reverse chronological order
- ✅ Each payment has unique reference number
- ✅ Total amount calculation is correct
- ✅ Each payment shows proper status

---

### Test Case 5: Empty State

**Prerequisites:**
- New supplier with no payments

**Steps:**
1. Login as supplier with no payment history
2. Navigate to Payments tab

**Expected Results:**
- ✅ Empty state displays
- ✅ Message: "No payments yet"
- ✅ Description: "Payments from completed orders will appear here"
- ✅ No error messages

---

### Test Case 6: Real-time Update

**Prerequisites:**
- Supplier dashboard open
- Admin in another window

**Steps:**
1. Open supplier dashboard (payments tab)
2. In admin panel, process a payment
3. Refresh supplier dashboard

**Expected Results:**
- ✅ New payment appears after refresh
- ✅ Metrics update correctly
- ✅ Payment count increases

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/admin/groups/{id}/process-payment` | POST | Admin processes group payment | Admin only |
| `/api/supplier/payments` | GET | Get supplier payment history | Supplier only |
| `/api/supplier/payments/dashboard` | GET | Get payment dashboard metrics | Supplier only |
| `/api/supplier/orders` | GET | Get supplier orders | Supplier only |
| `/api/supplier/groups/active` | GET | Get active supplier groups | Supplier only |

---

## Troubleshooting

### Payment not appearing?

**Check:**
1. Supplier ID matches in payment record
2. Payment status is "completed" or "pending"
3. API endpoint returns data: `/api/supplier/payments`
4. Frontend correctly maps response fields
5. Browser console for errors

**Debug Query:**
```sql
SELECT 
    sp.id,
    sp.reference_number,
    sp.amount,
    sp.status,
    sp.created_at,
    u.email as supplier_email
FROM supplier_payments sp
JOIN users u ON u.id = sp.supplier_id
WHERE u.email = '{supplier_email}';
```

### Amount displaying incorrectly?

**Check:**
1. Database amount field (should be DECIMAL)
2. Frontend formatting: `toLocaleString('en-US', { minimumFractionDigits: 2 })`
3. Currency symbol displays once: `$`

### Status badge not showing?

**Check:**
1. Payment status value: "completed", "pending", "processing"
2. Badge variant mapping in code
3. Tailwind classes properly applied

---

## Success Criteria

✅ **Admin can process payments**  
✅ **Backend creates payment records correctly**  
✅ **Supplier sees payments in dashboard**  
✅ **Payment amount displays accurately**  
✅ **Status badges show correct colors**  
✅ **Empty state works properly**  
✅ **Metrics update correctly**  
✅ **No console errors**  

---

## Related Files

**Frontend:**
- `sys/Front-end/connectsphere/src/pages/SupplierDashboard.tsx`
- `sys/Front-end/connectsphere/src/pages/GroupModeration.tsx`
- `sys/Front-end/connectsphere/src/services/api.js`

**Backend:**
- `sys/backend/models/admin.py` (process payment)
- `sys/backend/models/supplier.py` (get payments)
- `sys/backend/models/models.py` (SupplierPayment model)

---

## Notes

- Platform fee is currently 0% (can be adjusted in admin.py line 864)
- Payment method is "admin_processed" for admin-initiated payments
- All payments are created with "completed" status when admin processes
- Reference numbers format: `PAY-AG-{group_id}-{timestamp}`

---

*Last Updated: November 25, 2025*

