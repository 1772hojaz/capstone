# Deployment Guide - Enhanced Group Buy Workflow

## 🎯 Overview

This deployment guide covers the enhanced group buy workflow with supplier integration, QR code pickup, and automatic refund processing.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

Ensure the following environment variables are set in `sys/backend/.env`:

```bash
# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=dz5rslegb
CLOUDINARY_API_KEY=596291411567142
CLOUDINARY_API_SECRET=7wR7cVkBDXHKVSI83-cG0bcD8Qk

# JWT Secret Key
SECRET_KEY=your-secret-key-here

# Flutterwave Payment Integration (for refunds)
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_ENCRYPTION_KEY=your-flutterwave-encryption-key
```

### 2. Dependencies

All required dependencies are already in `requirements.txt`:
- `qrcode[pil]==7.4.2` - QR code generation
- Other existing dependencies

## 🗄️ Database Migration

### Option 1: Automatic (Recommended for Development)

SQLAlchemy will automatically create new columns when the application starts:

```bash
cd sys/backend
python main.py
```

New columns added:
- **GroupBuy**: `supplier_status`, `supplier_response_at`, `ready_for_collection_at`, `supplier_notes`
- **Contribution**: `is_collected`, `collected_at`, `qr_code_token`, `refund_status`, `refunded_at`
- **SupplierOrder**: `admin_verification_status`, `admin_verified_at`, `qr_codes_generated`

### Option 2: Manual Backup and Migration

```bash
cd sys/backend

# 1. Backup existing database
cp groupbuy.db groupbuy.db.backup.$(date +%Y%m%d_%H%M%S)

# 2. Start application (will apply schema changes)
python main.py
```

## 🚀 Deployment Steps

### Step 1: Update Backend

```bash
cd sys/backend

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install/update dependencies
pip install -r requirements.txt

# Verify environment variables
cat .env  # Linux/Mac
type .env  # Windows

# Start backend server
python main.py
```

Backend will start on `http://localhost:8000`

### Step 2: Update Frontend

```bash
cd sys/Front-end/connectsphere

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### Step 3: Setup Auto-Complete Scheduler (Optional but Recommended)

To automatically complete groups when MOQ is met and deadline reached:

#### Linux/Mac (Cron):

```bash
crontab -e

# Add this line to run every hour
0 * * * * cd /path/to/sys/backend && ./venv/bin/python worker/auto_complete_groups.py >> logs/auto_complete.log 2>&1
```

#### Windows (Task Scheduler):

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, repeat every 1 hour
4. Action: Start a program
   - Program: `C:\path\to\sys\backend\venv\Scripts\python.exe`
   - Arguments: `worker/auto_complete_groups.py`
   - Start in: `C:\path\to\sys\backend`

#### Alternative - Manual Trigger:

```bash
cd sys/backend
python worker/auto_complete_groups.py
```

## 🧪 Testing the Workflow

### 1. Test Trader Flow

```bash
# As a trader:
1. Navigate to http://localhost:5173/trader
2. Join a group buy
3. Make payment
4. Check group status in "My Groups"
5. Wait for MOQ to be met
6. Status should show "Waiting for supplier confirmation"
```

### 2. Test Supplier Flow

```bash
# As a supplier:
1. Navigate to http://localhost:5173/supplier
2. Go to "Orders" tab
3. See pending order
4. Click "Confirm Order" to accept
5. OR click "Reject Order" to decline (will trigger refunds)
```

### 3. Test Admin Flow

```bash
# As admin:
1. Navigate to http://localhost:5173/admin
2. Go to management section
3. Manually complete groups if needed:
   curl -X POST http://localhost:8000/api/admin/groups/{group_id}/complete \
     -H "Authorization: Bearer {admin_token}"
4. Mark groups ready for collection:
   curl -X POST http://localhost:8000/api/admin/groups/{group_id}/mark-ready-for-collection \
     -H "Authorization: Bearer {admin_token}"
```

### 4. Test QR Code Flow

```bash
# As a trader:
1. Go to "My Groups"
2. Find group with status "Ready for pickup"
3. Click "Show QR Code"
4. QR code should display

# As admin:
1. Go to "QR Verification" tab in admin dashboard
2. Scan or enter QR code
3. System verifies and marks as collected
```

### 5. Test Refund Flow

```bash
# Trigger refund by supplier rejection:
1. As supplier, reject an order with reason
2. Backend automatically processes refunds
3. As trader, check "My Groups" - status should show "Cancelled"
4. Check refund status in group details

# Manual refund (admin):
curl -X POST http://localhost:8000/api/admin/groups/{group_id}/process-refunds \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Admin initiated refund"}'
```

## 📊 Monitoring

### Check Auto-Complete Groups

```bash
cd sys/backend
python worker/auto_complete_groups.py
```

Output should show:
```
✅ Group {id} auto-completed. MOQ: {moq}, Quantity: {quantity}
✅ Created supplier order ORD-{group_id}-{timestamp} for group {group_id}
Auto-complete check completed. {count} groups transitioned to completed status.
```

### Check Database Status

```bash
cd sys/backend
python -c "
from db.database import SessionLocal
from models.models import GroupBuy

db = SessionLocal()
groups = db.query(GroupBuy).filter(GroupBuy.supplier_status.isnot(None)).all()

for g in groups:
    print(f'Group {g.id}: status={g.status}, supplier_status={g.supplier_status}')

db.close()
"
```

### Check Logs

```bash
# Backend logs
tail -f sys/backend/logs/backend.log

# Auto-complete logs (if scheduled)
tail -f sys/backend/logs/auto_complete.log
```

## 🐛 Troubleshooting

### Issue: Groups not auto-completing

**Solution:**
```bash
cd sys/backend
python worker/auto_complete_groups.py
```

Check output for:
- "MOQ not met" - Need more participants
- "Not all contributions are paid" - Payment issue
- "Deadline not reached" - Wait for deadline or manually complete

### Issue: QR codes not generating

**Check:**
1. `qrcode` library installed: `pip show qrcode`
2. Group status is `supplier_accepted`
3. Admin marked group as ready for collection

**Fix:**
```bash
curl -X POST http://localhost:8000/api/admin/groups/{group_id}/mark-ready-for-collection \
  -H "Authorization: Bearer {admin_token}"
```

### Issue: Refunds not processing

**Check:**
1. Flutterwave credentials in `.env`
2. Check logs for refund errors
3. Contributions have `paid_amount > 0`

**Manual trigger:**
```bash
curl -X POST http://localhost:8000/api/admin/groups/{group_id}/process-refunds \
  -H "Authorization: Bearer {admin_token}"
```

### Issue: Supplier orders not created

**Check:**
1. Supplier exists for the product
2. Group has `supplier_status = "pending_supplier"`
3. Run auto-complete manually to create order

**Manual fix:**
```python
cd sys/backend
python -c "
from db.database import SessionLocal
from worker.auto_complete_groups import create_supplier_order_for_group
from models.models import GroupBuy

db = SessionLocal()
group = db.query(GroupBuy).filter(GroupBuy.id == {group_id}).first()
if group:
    create_supplier_order_for_group(db, group)
    db.commit()
db.close()
"
```

## 📈 Performance Optimization

### For Large Datasets

1. **Add Database Indices:**
```sql
CREATE INDEX idx_group_supplier_status ON group_buys(supplier_status);
CREATE INDEX idx_contrib_refund_status ON contributions(refund_status);
CREATE INDEX idx_contrib_qr_token ON contributions(qr_code_token);
```

2. **Batch Processing:**
Modify `auto_complete_groups.py` to process in batches if you have many groups.

3. **Caching:**
Consider caching frequently accessed group statuses using Redis.

## 🔐 Security Considerations

1. **QR Code Tokens:** Secure SHA-256 hashed tokens prevent forgery
2. **Refund Processing:** Only triggered by authenticated supplier or admin
3. **Status Transitions:** Only allowed via authenticated API endpoints
4. **Admin Actions:** Require admin role verification

## 📞 Support

### Common Commands

```bash
# Check database schema
cd sys/backend
python -c "from models.models import GroupBuy; print(GroupBuy.__table__.columns.keys())"

# List all groups with supplier status
python -c "
from db.database import SessionLocal
from models.models import GroupBuy
db = SessionLocal()
groups = db.query(GroupBuy).all()
for g in groups:
    print(f'{g.id}: {g.status} -> {g.supplier_status}')
db.close()
"

# Check API health
curl http://localhost:8000/api/health

# Test QR generation
curl -X GET http://localhost:8000/api/groups/{group_id}/qr-code \
  -H "Authorization: Bearer {trader_token}"
```

## ✅ Deployment Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Environment variables are set
- [ ] Database schema updated (new columns exist)
- [ ] Trader can join groups
- [ ] Supplier can see pending orders
- [ ] Supplier can accept/reject orders
- [ ] Admin can complete groups manually
- [ ] QR codes generate successfully
- [ ] Refunds process on supplier rejection
- [ ] Auto-complete scheduler is configured (optional)

## 🎉 Success!

Your enhanced group buy workflow is now deployed and operational!

Key Features:
- ✅ Automatic group completion
- ✅ Supplier order management  
- ✅ QR code pickup system
- ✅ Automatic refund processing
- ✅ Complete status tracking

For questions or issues, refer to:
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - Full feature documentation
- `IMPLEMENTATION_PROGRESS.md` - Development progress
- Backend logs: `sys/backend/logs/backend.log`

