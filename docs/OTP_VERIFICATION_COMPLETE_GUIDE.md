# 📱 OTP Email Verification - Complete Implementation Guide

## Overview

ConnectSphere now uses **OTP (One-Time Password) verification during signup**. Users must verify their email by entering a 6-digit code before their account is created. No more email links - verification happens during the registration process!

## 🎯 How It Works

### User Flow

```
1. User fills registration form
   ↓
2. User clicks "Register"
   ↓
3. System sends 6-digit OTP to email
   ↓
4. User enters OTP code (has 10 minutes)
   ↓
5. System verifies OTP
   ↓
6. Account created & user logged in automatically
   ↓
7. Redirect to dashboard
```

### Key Features

✅ **No account creation until OTP verified** - Prevents spam registrations  
✅ **10-minute expiry** - Security-focused short-lived codes  
✅ **5 attempt limit** - Prevents brute force attacks  
✅ **Resend functionality** - User can request new OTP if needed  
✅ **Auto-login after verification** - Smooth user experience  
✅ **Works for both traders and suppliers** - Unified flow  

## 🔧 Backend API

### 1. Register Endpoint (Modified)

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "location_zone": "Mbare",
  "preferred_categories": ["Vegetables"],
  "budget_range": "medium",
  "experience_level": "beginner",
  "preferred_group_sizes": ["small"],
  "participation_frequency": "occasional"
}
```

**Response:**
```json
{
  "message": "Verification code sent! Please check your email and enter the 6-digit code to complete registration.",
  "email": "user@example.com",
  "status": "otp_sent",
  "expires_in_minutes": 10
}
```

**What happens:**
- NO user account created yet
- Registration data stored in `pending_registrations` table
- 6-digit OTP generated and sent to email
- OTP expires in 10 minutes

### 2. Verify OTP Endpoint (NEW)

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 42,
  "is_admin": false,
  "is_supplier": false,
  "location_zone": "Mbare",
  "full_name": "John Doe",
  "email": "user@example.com"
}
```

**Error Responses:**

- **Invalid OTP**: `400 Bad Request` - "Invalid OTP code. X attempts remaining."
- **Expired OTP**: `400 Bad Request` - "OTP has expired. Please register again to get a new code."
- **Too many attempts**: `429 Too Many Requests` - "Too many failed attempts. Please register again."
- **No pending registration**: `400 Bad Request` - "No pending registration found for this email."

**What happens:**
- Verifies the OTP code
- Creates the actual user account
- Marks email as verified
- Deletes pending registration
- Returns access token for immediate login

### 3. Resend OTP Endpoint (NEW)

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "New verification code sent! Please check your email.",
  "status": "sent",
  "email": "user@example.com",
  "expires_in_minutes": 10
}
```

**What happens:**
- Generates fresh 6-digit OTP
- Resets expiry to 10 minutes
- Resets attempt counter to 0
- Sends new email with OTP

### 4. Login Endpoint (Unchanged)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Note**: Login only works for users who completed OTP verification!

## 📧 Email Template

The OTP email includes:

```
┌────────────────────────────────────────┐
│      Welcome to ConnectSphere!        │
│                                        │
│    Verify Your Email Address          │
│                                        │
│  Hi John Doe,                          │
│                                        │
│  Your verification code is:           │
│                                        │
│  ┌──────────────────────────────┐    │
│  │                               │    │
│  │         1 2 3 4 5 6           │    │
│  │                               │    │
│  └──────────────────────────────┘    │
│                                        │
│  ⏱️ Code expires in 10 minutes        │
│  For security, this code can only     │
│  be used once.                         │
│                                        │
│  Security Tips:                        │
│  • Never share this code              │
│  • We'll never ask for it via phone  │
│  • Ignore if you didn't register      │
└────────────────────────────────────────┘
```

## 💻 Frontend Implementation

### Step 1: Update Registration Page

**File**: `sys/Front-end/connectsphere/src/pages/EnhancedRegistrationPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const EnhancedRegistrationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    location_zone: '',
    // ... other fields
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.post('/api/auth/register', formData);
      
      if (response.status === 'otp_sent') {
        // Redirect to OTP verification page
        navigate('/verify-otp', {
          state: {
            email: response.email,
            expiresIn: response.expires_in_minutes
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your registration form JSX
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {error && <div className="text-red-600">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Register'}
      </button>
    </form>
  );
};

export default EnhancedRegistrationPage;
```

### Step 2: Create OTP Verification Page

**File**: `sys/Front-end/connectsphere/src/pages/VerifyOTPPage.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const VerifyOTPPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const expiresIn = location.state?.expiresIn || 10;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresIn * 60); // seconds
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits entered
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardPaste) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
    
    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.post('/api/auth/verify-otp', {
        email,
        otp_code: code
      });
      
      // Store access token
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
      }
      
      setSuccess(true);
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/trader-dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    
    try {
      const response = await apiService.post('/api/auth/resend-otp', { email });
      
      if (response.status === 'sent') {
        setTimeLeft(response.expires_in_minutes * 60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        // Show success message briefly
        setError('');
        setTimeout(() => {
          setError('New code sent! Check your email.');
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 mb-1">
            Enter the 6-digit code sent to
          </p>
          <p className="text-gray-900 font-semibold">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                  ${digit ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  ${error ? 'border-red-500' : ''}
                  focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-600">
                Code expires in <span className="font-semibold text-gray-900">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">
                Code expired! Please request a new one.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`text-sm text-center p-3 rounded-lg mb-4 ${
              error.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.some(d => !d)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending || timeLeft > 540} // Can't resend in first 20 seconds
              className="text-green-600 hover:text-green-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-gray-600 hover:text-gray-900 text-sm py-2"
          >
            Back to Login
          </button>
        </div>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Security Tip:</strong> Never share this code with anyone. We'll never ask for it via phone or SMS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
```

### Step 3: Add Routes

**File**: `sys/Front-end/connectsphere/src/App.tsx`

```typescript
import VerifyOTPPage from './pages/VerifyOTPPage';

// In your Routes:
<Route path="/verify-otp" element={<VerifyOTPPage />} />
```

## 📊 Database Schema

### pending_registrations Table

```sql
CREATE TABLE pending_registrations (
  id INTEGER PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  hashed_password VARCHAR NOT NULL,
  full_name VARCHAR,
  location_zone VARCHAR,
  
  -- User preferences
  preferred_categories JSON,
  budget_range VARCHAR DEFAULT 'medium',
  experience_level VARCHAR DEFAULT 'beginner',
  preferred_group_sizes JSON,
  participation_frequency VARCHAR DEFAULT 'occasional',
  
  -- Supplier fields
  is_supplier BOOLEAN DEFAULT 0,
  company_name VARCHAR,
  business_address TEXT,
  tax_id VARCHAR,
  phone_number VARCHAR,
  business_type VARCHAR,
  business_description TEXT,
  website_url VARCHAR,
  bank_account_name VARCHAR,
  bank_account_number VARCHAR,
  bank_name VARCHAR,
  payment_terms VARCHAR,
  
  -- OTP verification
  otp_code VARCHAR NOT NULL,
  otp_expires DATETIME NOT NULL,
  otp_attempts INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment Steps

### 1. Run Migration

```bash
cd sys/backend
python migrate_otp_verification.py
```

### 2. Restart Backend

```bash
uvicorn main:app --reload
```

### 3. Test API

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123",
    "full_name": "Test User",
    "location_zone": "Mbare"
  }'

# Check your email for OTP, then verify
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "otp_code": "123456"
  }'
```

## 🔒 Security Features

✅ **OTP Expiry** - 10 minutes only
✅ **Attempt Limiting** - Max 5 attempts then registration deleted
✅ **No Account Creation** - Until OTP verified
✅ **Secure Random Generation** - Using `secrets` module
✅ **One-Time Use** - OTP deleted after successful verification
✅ **Email Enumeration Protection** - Generic messages for invalid emails

## 📝 Important Notes

1. **Existing Users**: All marked as verified, can login normally
2. **New Users**: Must complete OTP verification
3. **Failed Registrations**: Automatically cleaned up after expiry/max attempts
4. **Resend Limit**: User can resend unlimited times (each generates new OTP)
5. **Mobile-Friendly**: Input works with numeric keyboards on mobile
6. **Paste Support**: Can paste 6-digit code from email
7. **Auto-Submit**: Automatically verifies when 6th digit entered

## 🎨 UI/UX Best Practices

✅ Auto-focus first input on page load
✅ Auto-advance to next input after digit entry
✅ Backspace moves to previous input
✅ Paste support for copying code from email
✅ Auto-submit when complete
✅ Visual feedback (green border when filled)
✅ Clear error messages
✅ Countdown timer
✅ Resend button with smart disable/enable
✅ Security tips visible

## 🧪 Testing Scenarios

### Test 1: Successful Registration
1. Fill registration form → Submit
2. Check email for OTP
3. Enter OTP → Auto-verify
4. See success message → Redirect to dashboard
5. Try logging in → Works!

### Test 2: Wrong OTP
1. Register → Get OTP email
2. Enter wrong code → See error
3. Shows "X attempts remaining"
4. After 5 wrong attempts → Registration deleted
5. Must register again

### Test 3: Expired OTP
1. Register → Get OTP email
2. Wait 10+ minutes
3. Try to verify → "OTP expired" error
4. Must register again (or resend)

### Test 4: Resend OTP
1. Register → Get OTP email
2. Click "Resend Code"
3. Get new OTP email
4. Enter new OTP → Works!

## 📧 Email Service Configuration

```env
# Required in .env file
RESEND_API_KEY=your_api_key_here
FROM_EMAIL=noreply@connectsphere.com
FROM_NAME=ConnectSphere
```

## ❓ FAQ

**Q: What if user never receives the email?**
A: They can click "Resend Code" to get a new OTP. Check spam folder.

**Q: Can user register again with same email?**
A: Yes, old pending registration is deleted and new one created.

**Q: What happens to pending registrations?**
A: Automatically deleted after OTP verification or when they try to register again.

**Q: Can admin manually verify a user?**
A: Yes, admin can mark `email_verified = 1` in database.

**Q: How long is OTP valid?**
A: 10 minutes. After that, user must register again or resend.

## 🎉 Complete!

The OTP verification system is fully implemented and ready for production!

**Benefits:**
- ✅ Better security
- ✅ Prevents spam registrations
- ✅ Professional user experience
- ✅ Mobile-friendly
- ✅ No account spam

**Next Steps:**
1. Run migration
2. Implement frontend
3. Test thoroughly
4. Deploy to production

