# 🚀 Email Verification - Quick Start Guide

## TL;DR - Get It Running in 5 Minutes

### Step 1: Run Database Migration (1 min)

```bash
cd sys/backend
python migrate_email_verification.py
```

✅ **Done!** Existing users can still log in. New users need verification.

### Step 2: Restart Backend (1 min)

```bash
# Make sure you're in sys/backend with venv activated
uvicorn main:app --reload
```

### Step 3: Test It Works (2 mins)

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
```

**Expected Response:**
```json
{
  "message": "Registration successful! Please check your email...",
  "verification_required": true,
  "status": "pending_verification"
}
```

✅ **Backend is working!**

---

## What Changed?

### 1. Registration
- ❌ Before: User registers → Gets access token → Can login immediately
- ✅ Now: User registers → Gets verification email → Must verify → Then can login

### 2. Login
- ❌ Before: Any registered user can login
- ✅ Now: Only verified users can login (existing users auto-verified)

---

## New API Endpoints

### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

### Resend Verification
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## Frontend TODO Checklist

### Required Pages

- [ ] **Verification Pending Page** (`/verification-pending`)
  - Shows after registration
  - "Check your email" message
  - Resend button

- [ ] **Email Verification Page** (`/verify-email?token=...`)
  - Handles the link from email
  - Shows success/error
  - Auto-redirects to dashboard

### Required Updates

- [ ] **Registration Page**
  - Redirect to `/verification-pending` after success
  - Don't give access token anymore

- [ ] **Login Page**
  - Handle 403 "Email not verified" error
  - Show "Resend verification" option

---

## Environment Variables

```env
# Required for sending emails
RESEND_API_KEY=your_api_key_here
FROM_EMAIL=noreply@connectsphere.com
FROM_NAME=ConnectSphere

# Required for verification links
FRONTEND_URL=http://localhost:5173
```

> **Note**: System works in simulation mode without RESEND_API_KEY (for testing)

---

## Testing Scenarios

### Scenario 1: New User Registration ✅
1. User fills registration form
2. Submits → Gets "Check your email" message
3. Clicks link in email → Email verified
4. Automatically logged in → Redirected to dashboard

### Scenario 2: Login Before Verification ❌
1. User registers
2. Tries to login without verifying
3. Gets error: "Email not verified"
4. Can click "Resend verification email"

### Scenario 3: Expired Link 🔄
1. User registers
2. Waits > 24 hours
3. Clicks verification link → "Link expired"
4. Can request new link
5. New link works for another 24 hours

### Scenario 4: Existing User ✅
1. User already in database (before migration)
2. Can login normally
3. No verification required (grandfathered in)

---

## Email Template Preview

```
┌────────────────────────────────────────┐
│      Welcome to ConnectSphere!        │
│                                        │
│    Verify Your Email Address          │
│                                        │
│  Hi John Doe,                          │
│                                        │
│  Thank you for registering! Please    │
│  verify your email to get started.    │
│                                        │
│  ┌──────────────────────────────┐    │
│  │  VERIFY EMAIL ADDRESS        │    │
│  └──────────────────────────────┘    │
│                                        │
│  Or copy this link:                   │
│  http://localhost:5173/verify-email...│
│                                        │
│  Link expires in 24 hours              │
└────────────────────────────────────────┘
```

---

## Database Schema

```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR;
ALTER TABLE users ADD COLUMN email_verification_expires DATETIME;
```

**Migration script does this automatically!**

---

## Common Issues & Fixes

### Issue: "Email not sending"
**Fix**: Check `RESEND_API_KEY` in `.env` file

### Issue: "Token expired"
**Fix**: User can click "Resend verification email"

### Issue: "Existing user can't login"
**Fix**: Run migration script again - it marks existing users as verified

### Issue: "Frontend shows error"
**Fix**: Make sure backend is running on port 8000

---

## Quick Commands Reference

```bash
# Run migration
python migrate_email_verification.py

# Start backend
uvicorn main:app --reload

# Check user verification status
sqlite3 connectsphere.db "SELECT email, email_verified FROM users;"

# Manually verify a user (emergency)
sqlite3 connectsphere.db "UPDATE users SET email_verified=1 WHERE email='user@test.com';"
```

---

## What's Next?

1. ✅ **Backend is done** - All API endpoints working
2. 📝 **Frontend pages** - Follow guide in `EMAIL_VERIFICATION_GUIDE.md`
3. 🧪 **Testing** - Test complete user flow
4. 🚀 **Deploy** - Push to production

---

## Need More Details?

📖 **Full Implementation Guide**: `docs/EMAIL_VERIFICATION_GUIDE.md`
📄 **Complete Summary**: `docs/EMAIL_VERIFICATION_SUMMARY.md`
🔧 **API Documentation**: `http://localhost:8000/docs`

---

## Support

**Questions?** The comprehensive guide has:
- Complete code examples
- Error handling scenarios
- Security best practices
- Frontend implementation details
- Testing procedures

**🎉 You're all set! Email verification is live!**

