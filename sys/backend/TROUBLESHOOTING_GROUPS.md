# Troubleshooting Group Moderation Display

## Issue: Ready for Payment and Completed groups not showing in frontend

### Step 1: Verify Database Has Data

Run this test script:
```bash
cd sys/backend
python test_groups_data.py
```

**Expected output:**
```
Ready for Payment Groups (should be 2): 2
   - Exercise Books (48 Pages) - Bulk for Schools
   - Geisha Bath Soap - 100g Bars

Completed Groups (should be 2): 2
   - Kapenta (Dried Fish) - 5kg Packs
   - Charcoal - 20kg Bags
```

If this passes, the database is correct ✅

---

### Step 2: Check Backend is Running

Make sure FastAPI backend is running:
```bash
cd sys/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### Step 3: Check Frontend is Running

Make sure React frontend is running:
```bash
cd sys/Front-end/connectsphere
npm run dev
```

You should see:
```
VITE v... ready in ...ms
Local: http://localhost:5173/
```

---

### Step 4: Login as Admin

1. Open browser to `http://localhost:5173`
2. Login with:
   - Email: `admin@connectsphere.com`
   - Password: `admin123`
3. Navigate to **Group Moderation** page (click "Moderation" in nav)

---

### Step 5: Check Browser Console

Open Developer Tools (F12) and check Console tab:

**You should see:**
```javascript
✅ API Response: {
  statsData: {...},
  activeData: [5 groups],
  readyData: [2 groups],  // ← Should have 2 groups
  completedData: [2 groups]  // ← Should have 2 groups
}
```

**If you see empty arrays:**
```javascript
readyData: []
completedData: []
```
Then the API calls are failing or returning empty.

---

### Step 6: Check Backend Terminal Logs

Look at your backend terminal (where uvicorn is running).

**You should see:**
```
🔍 GET /api/admin/groups/ready-for-payment called
   Admin: admin@connectsphere.com
   ✅ Returning 2 ready for payment groups
      - Exercise Books (48 Pages) - Bulk for Schools (members: 25/25)
      - Geisha Bath Soap - 100g Bars (members: 30/30)

🔍 GET /api/admin/groups/completed called
   Admin: admin@connectsphere.com
   ✅ Returning 2 completed groups
      - Kapenta (Dried Fish) - 5kg Packs (members: 30)
      - Charcoal - 20kg Bags (members: 20)
```

---

### Step 7: Check Network Tab

In Developer Tools, go to **Network** tab:
1. Refresh the Group Moderation page
2. Look for these requests:
   - `groups/ready-for-payment` - Status should be `200 OK`
   - `groups/completed` - Status should be `200 OK`
3. Click on each request and check **Response** tab

**Expected response for ready-for-payment:**
```json
[
  {
    "id": 6,
    "name": "Exercise Books (48 Pages) - Bulk for Schools",
    "members": 25,
    "targetMembers": 25,
    ...
  },
  {
    "id": 7,
    "name": "Geisha Bath Soap - 100g Bars",
    ...
  }
]
```

---

## Common Issues & Fixes

### Issue 1: Backend not returning data
**Symptom:** Backend logs show "Returning 0 groups"
**Fix:** Re-run seed script
```bash
cd sys/backend
python seed_admin_groups.py --clear
```

### Issue 2: 401 Unauthorized
**Symptom:** Network tab shows 401 errors
**Fix:** Login again or check token is valid

### Issue 3: CORS errors
**Symptom:** Console shows CORS policy errors
**Fix:** Make sure backend is running on port 8000 and frontend on 5173

### Issue 4: Empty arrays in frontend
**Symptom:** Browser console shows empty arrays for readyData/completedData
**Fix:** Check backend logs to see if endpoints are being called

---

## Quick Fix

If nothing else works:

1. **Stop both servers** (Ctrl+C)
2. **Reseed database:**
   ```bash
   cd sys/backend
   python seed_admin_groups.py --clear
   ```
3. **Restart backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. **Restart frontend:**
   ```bash
   cd sys/Front-end/connectsphere
   npm run dev
   ```
5. **Clear browser cache** (Ctrl+Shift+Delete)
6. **Login again** and navigate to Group Moderation

---

## Report Results

After following these steps, please report:
1. ✅/❌ Step 1 (Database test results)
2. ✅/❌ Step 5 (Browser console shows data?)
3. ✅/❌ Step 6 (Backend logs show groups?)
4. ✅/❌ What you see in Network tab

This will help identify the exact issue!

