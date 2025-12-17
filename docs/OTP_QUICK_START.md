# 🚀 OTP Email Verification - Quick Start (5 Minutes)

## What Changed?

**OLD FLOW:**
1. User registers → Account created → Can login ❌

**NEW FLOW:**
1. User registers → OTP sent to email
2. User enters 6-digit code on screen
3. Account created only after OTP verified ✅
4. User automatically logged in

## Get Running in 3 Steps

### Step 1: Run Migration (1 minute)

```bash
cd sys/backend
python migrate_otp_verification.py
```

✅ Creates `pending_registrations` table  
✅ Marks existing users as verified

### Step 2: Restart Backend (30 seconds)

```bash
uvicorn main:app --reload
```

### Step 3: Test It (3 minutes)

```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123",
    "full_name": "Test User",
    "location_zone": "Mbare"
  }'

# Response:
{
  "message": "Verification code sent! Check your email...",
  "status": "otp_sent",
  "expires_in_minutes": 10
}

# Check email for 6-digit code, then:
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "otp_code": "123456"
  }'

# Response: access_token + user data
```

✅ **Backend is working!**

---

## New API Endpoints

### 1. Register (Modified)
```http
POST /api/auth/register
→ Sends OTP to email
→ Returns: { "status": "otp_sent", "email": "..." }
```

### 2. Verify OTP (NEW)
```http
POST /api/auth/verify-otp
Body: { "email": "...", "otp_code": "123456" }
→ Creates user account
→ Returns: access_token
```

### 3. Resend OTP (NEW)
```http
POST /api/auth/resend-otp
Body: { "email": "..." }
→ Sends new OTP
```

---

## Frontend TODO

### Required: OTP Verification Page

Create `src/pages/VerifyOTPPage.tsx`:
- 6 input boxes for OTP digits
- Auto-focus next box after digit entry
- Auto-submit when all 6 digits entered
- Countdown timer (10 minutes)
- Resend button
- Error handling

**Complete code example in**: `docs/OTP_VERIFICATION_COMPLETE_GUIDE.md`

### Update Registration Page

After registration success:
```typescript
if (response.status === 'otp_sent') {
  navigate('/verify-otp', {
    state: { email: response.email }
  });
}
```

### Add Route

```typescript
<Route path="/verify-otp" element={<VerifyOTPPage />} />
```

---

## Key Features

✅ **6-digit OTP** sent to email  
✅ **10-minute expiry** for security  
✅ **5 attempt limit** prevents brute force  
✅ **Auto-login** after verification  
✅ **Resend** unlimited times  
✅ **No account** created until OTP verified  

---

## Email Template

```
Subject: Your Verification Code - ConnectSphere

Hi John Doe,

Your verification code is:

┌──────────────────────┐
│                      │
│    1  2  3  4  5  6  │
│                      │
└──────────────────────┘

⏱️ Code expires in 10 minutes
For security, this code can only be used once.

Never share this code with anyone!
```

---

## Security Features

✅ **Short-lived**: 10 minutes only  
✅ **One-time use**: Deleted after verification  
✅ **Attempt limiting**: Max 5 tries  
✅ **Secure generation**: Using `secrets` module  
✅ **No spam**: Account only created after verification  

---

## Database

### New Table: `pending_registrations`

Stores registration data + OTP code temporarily.
Deleted after:
- OTP verified (account created)
- OTP expired (10 minutes)
- Max attempts reached (5 failures)
- User registers again

---

## Testing Checklist

- [ ] Registration sends OTP email
- [ ] OTP code is 6 digits
- [ ] Entering correct OTP creates account
- [ ] Wrong OTP shows error with attempts remaining
- [ ] 5 wrong attempts deletes pending registration
- [ ] OTP expires after 10 minutes
- [ ] Resend generates new OTP
- [ ] User can login after verification
- [ ] Existing users can still login

---

## Environment Variables

```env
# Required for email
RESEND_API_KEY=your_api_key
FROM_EMAIL=noreply@connectsphere.com
FROM_NAME=ConnectSphere
```

> System works in simulation mode without API key (for testing)

---

## Existing Users

✅ **All existing users are automatically marked as verified**  
✅ **They can login normally without any changes**  
✅ **Only NEW registrations require OTP**  

---

## Need Help?

📖 **Complete Guide**: `docs/OTP_VERIFICATION_COMPLETE_GUIDE.md`  
- Full frontend code
- Detailed API docs
- Testing scenarios
- UI/UX best practices

🔧 **API Docs**: `http://localhost:8000/docs`

---

## Quick Summary

**What you need to do:**
1. ✅ Run migration (done)
2. ✅ Restart backend (done)
3. 📝 Create OTP verification page (frontend)
4. 📝 Update registration page redirect (frontend)
5. 🧪 Test the flow

**Time estimate:**
- Backend: ✅ Complete (0 minutes)
- Frontend: 30-60 minutes
- Testing: 15 minutes

**Result:**
🎉 Secure, professional OTP-based email verification!

