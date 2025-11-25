# All Groups Page - Troubleshooting Guide

## Issue
Trader cannot see groups on the "All Groups" page.

## Investigation Results ✅

### Backend Status: **WORKING CORRECTLY**

#### Test Results
```
✅ Endpoint: GET /api/groups
✅ Authentication: Working
✅ Data Returned: 32 groups
   - Admin-created groups: 28
   - User-created groups: 4
```

#### Sample Response
```json
{
  "name": "Organic Tomatoes",
  "category": "Vegetables",
  "price": 3.50,
  "participants": 0,
  "adminCreated": true,
  ...
}
```

### Frontend Flow

1. **Component**: `sys/Front-end/connectsphere/src/pages/AllGroups.tsx`
2. **API Call**: `apiService.getGroups()` (line 61)
3. **Service**: `sys/Front-end/connectsphere/src/services/apiWithMock.ts`
4. **Endpoint**: `/api/groups`

## Possible Causes

### 1. **Authentication Issue** (Most Likely)
The trader user might not be logged in on the frontend, or the authentication token is missing/expired.

**Check:**
- Open browser DevTools → Application → Local Storage
- Look for `token` or `auth_token`
- If missing, the user needs to log in

### 2. **Network Error**
The frontend might not be able to reach the backend.

**Check:**
- Open browser DevTools → Network tab
- Look for a request to `/api/groups`
- Check if it returns 200 or an error (401, 403, 500)

### 3. **Error Display**
The error might be displayed but not obvious in the UI.

**Check:**
- Look for error messages on the page
- Check browser console for JavaScript errors

## Solution Steps

### For the User

1. **Make sure the backend is running:**
   ```bash
   cd sys/backend
   uvicorn main:app --reload
   ```

2. **Make sure the frontend is running:**
   ```bash
   cd sys/Front-end/connectsphere
   npm run dev
   ```

3. **Log in as a trader:**
   - Email: `trader1@mbare.co.zw`
   - Password: `password123`

4. **Navigate to "All Groups":**
   - Should see 32 groups displayed

### For Debugging

1. **Open Browser DevTools (F12)**

2. **Check Console Tab:**
   - Look for errors like:
     - `Failed to load groups`
     - `401 Unauthorized`
     - `Network Error`

3. **Check Network Tab:**
   - Filter for `groups`
   - Click on the `/api/groups` request
   - Check the response:
     - **200**: Data is returned → check the preview
     - **401**: Not authenticated → log in again
     - **403**: Wrong role → make sure you're a trader
     - **500**: Server error → check backend logs

4. **Check Local Storage:**
   - Application → Local Storage → `http://localhost:5173`
   - Look for `token`
   - If missing → log in
   - If present → check if it's valid (not expired)

## Verification Test

Run this script to verify backend is working:
```bash
cd sys/backend
python test_all_groups_endpoint.py
```

Expected output:
```
✅ Login successful!
✅ Success! Received 32 groups
✅ Test completed successfully!
```

## Frontend Connection

The connection chain is:
1. `AllGroups.tsx` → `apiService.getGroups()`
2. `apiWithMock.ts` → `apiService.getGroups(params)`
3. `api.js` → `request('/api/groups')`
4. Backend → `groups.py:727` → Returns data

## Quick Fix Checklist

- [ ] Backend is running on `http://localhost:8000`
- [ ] Frontend is running on `http://localhost:5173`
- [ ] User is logged in as a trader
- [ ] Authentication token exists in Local Storage
- [ ] No JavaScript errors in the console
- [ ] Network request to `/api/groups` returns 200

## Test Credentials

### Trader
- Email: `trader1@mbare.co.zw`
- Password: `password123`

### Admin
- Email: `admin@connectsphere.com`
- Password: `admin123`

### Supplier
- Email: `fresh@produce.co.zw`
- Password: `password123`

## Next Steps

If the issue persists after checking all of the above:

1. **Clear browser cache and local storage**
2. **Restart both frontend and backend**
3. **Log in fresh as a trader**
4. **Check browser console for specific error messages**
5. **Take a screenshot of the Network tab showing the `/api/groups` request**

