# Payment Callback URL Fixed ✅

**Issue:** After payment, users were redirected to `http://localhost:8000/api/payment/callback` instead of the production backend.

**Root Cause:** The redirect URL was hardcoded to `localhost:8000` in the payment initialization code.

---

## ✅ What Was Fixed

### File 1: `models/groups.py` (2 occurrences)

**Before:**
```python
redirect_url=f"http://localhost:8000/api/payment/callback?group_id={group_id}"
```

**After:**
```python
redirect_url=f"{os.getenv('BACKEND_URL', 'https://api.asked.qzz.io')}/api/payment/callback?group_id={group_id}"
```

### File 2: `payment/flutterwave_service.py`

**Before:**
```python
"redirect_url": redirect_url or "http://localhost:8000/api/payment/callback"
```

**After:**
```python
"redirect_url": redirect_url or f"{os.getenv('BACKEND_URL', 'https://api.asked.qzz.io')}/api/payment/callback"
```

---

## 🎯 How It Works Now

When a user initiates a payment:
1. ✅ Backend initializes payment with redirect URL: `https://api.asked.qzz.io/api/payment/callback`
2. ✅ User completes payment on Flutterwave
3. ✅ Flutterwave redirects to: `https://api.asked.qzz.io/api/payment/callback?...`
4. ✅ Production backend processes callback
5. ✅ Backend shows loading page and redirects to: `https://connectsphere-p5t9.onrender.com/payment/success`

---

## 🚀 Next Steps

### If Backend is Running Locally:
**Restart the backend** to apply changes:
```bash
# Stop current server (Ctrl+C)
cd capstone-back-end
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### If Using Production Backend (Recommended):
1. **Push changes to production:**
   ```bash
   cd capstone-back-end
   git add models/groups.py payment/flutterwave_service.py
   git commit -m "Fix payment callback URL for production"
   git push
   ```

2. **Wait for deployment** (Render will auto-deploy)

3. **Test payment** - it should now redirect properly!

---

## 🧪 Testing

After deploying:

1. **Go to your app:** `https://connectsphere-p5t9.onrender.com`
2. **Join a group buy**
3. **Complete payment**
4. **Expected result:**
   - ✅ After payment, see loading page
   - ✅ Auto-redirect to success page
   - ✅ Group appears in "My Groups"

---

## 📊 Backend Logs to Expect

```
💳 Payment callback received: tx_ref=..., transaction_id=..., status=successful
✅ Processing successful payment (test mode)
🌐 Redirecting to: https://connectsphere-p5t9.onrender.com/payment/success?...
```

---

## 🎉 Summary

- ✅ **Production URL:** `https://api.asked.qzz.io` (default)
- ✅ **Flexible:** Can override with `BACKEND_URL` env var
- ✅ **Works immediately** after deploying to production
- ✅ **No more localhost redirects!**

**Deploy and test!** 🚀


