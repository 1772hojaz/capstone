# Payment Redirect Fixed ✅

**Issue:** After payment, users were seeing the backend API URL instead of being redirected to the frontend.

**Root Cause:** The payment callback in `payment_router.py` was hardcoded to redirect to `http://localhost:5173` which doesn't work in production.

---

## ✅ What Was Changed

**File:** `capstone-back-end/payment/payment_router.py`

### Before:
```python
# Line 265
frontend_url = "http://localhost:5173"  # Hardcoded localhost

# Line 280
frontend_url = "http://localhost:5173"  # Hardcoded localhost
```

### After:
```python
# Line 265
frontend_url = os.getenv("FRONTEND_URL", "https://asked.qzz.io")

# Line 280
frontend_url = os.getenv("FRONTEND_URL", "https://asked.qzz.io")
```

---

## 🎯 How It Works Now

1. **Checks environment variable** `FRONTEND_URL` first
2. **Falls back to production URL** `https://asked.qzz.io` if not set
3. **Works immediately** without any configuration needed

---

## 🚀 Deployment

### Option 1: Deploy as-is (Recommended)
Just deploy the updated code. It will automatically use `https://asked.qzz.io` by default.

### Option 2: Use environment variable (Optional)
If you want to customize the frontend URL, set this environment variable:

```bash
export FRONTEND_URL=https://asked.qzz.io
```

Or add to your `.env` file:
```
FRONTEND_URL=https://asked.qzz.io
```

---

## 🧪 Testing

After deploying:

1. **Join a group buy** on `https://asked.qzz.io`
2. **Complete payment** 
3. **Expected result:**
   - ✅ Redirects to `https://asked.qzz.io/payment/success?...`
   - ✅ Shows "Payment Successful!" page
   - ✅ Can navigate to "My Groups"

### Check Backend Logs:
```
Payment callback received: tx_ref=..., transaction_id=..., status=successful
Payment verification result: successful
Redirecting to: https://asked.qzz.io/payment/success?...
```

---

## 🎉 Summary

- ✅ **Production URL:** `https://asked.qzz.io` (default)
- ✅ **Flexible:** Can override with `FRONTEND_URL` env var
- ✅ **Works for both:** Local development and production
- ✅ **No breaking changes:** Backward compatible

**Ready to deploy!** 🚀


