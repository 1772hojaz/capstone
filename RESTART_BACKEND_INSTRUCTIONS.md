# ⚠️ RESTART BACKEND TO FIX TARGET AMOUNTS

## Current Situation

**Database**: ✅ Has correct values
- Fresh Spinach: target = $210.00
- Mixed Bell Peppers: target = $280.00
- Fresh Carrots: target = $105.00

**Backend Code**: ✅ Fixed to calculate and return these values

**Your Browser**: ❌ Still showing "$0.00 target" because backend hasn't been restarted with new code

## Solution: Restart Backend

### Step 1: Stop Current Backend

Go to the terminal where backend is running and press:
```
Ctrl + C
```

### Step 2: Start Backend with New Code

```bash
cd sys/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Clear Browser Cache

**Quick refresh:**
```
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)
```

### Step 4: Verify Fix

1. Go to "All Groups"
2. Click any group
3. Should now see:
   ```
   $0.00 raised
   $210.00 target  ← Should be actual amount, not $0!
   ```

## What You Should See After Restart

### Example: Fresh Spinach
- **Current**: $0.00 (no one joined yet) ✅
- **Target**: $210.00 (price $4.20 × 50 max) ✅
- **Progress**: 0% ✅

### Example: Mixed Bell Peppers
- **Current**: $0.00 (no one joined yet) ✅
- **Target**: $280.00 (price $5.60 × 50 max) ✅
- **Progress**: 0% ✅

## Why Restart is Required

The backend code was changed to:
1. Calculate `target_amount = price × max_participants`
2. Calculate `current_amount = joins × price`
3. Return these values in API response

**But** the backend server is still running the **OLD code** that doesn't include these calculations.

## Verification Commands

After restarting, you can test the API directly:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trader1@mbare.co.zw","password":"password123"}'

# Get groups (use token from login response)
curl http://localhost:8000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Look for `"target_amount": 210.0` in the JSON response (not 0!).

## Files That Were Fixed

1. **`sys/backend/models/groups.py`** (Lines 738-793)
   - Added calculation: `target_amount = group.price * group.max_participants`
   - Added calculation: `current_amount = joins * group.price`
   - Added these fields to API response

2. **`sys/Front-end/connectsphere/src/pages/GroupDetail.tsx`** (Line 116)
   - Fixed: Only show "goal reached" if `targetAmount > 0`

## Summary

✅ **Database**: Has correct prices  
✅ **Backend Code**: Fixed to calculate amounts  
⏳ **Backend Server**: Needs restart to use new code  
⏳ **Frontend**: Needs cache clear to get new data

**Action Required**: Restart the backend server now!

