# 📧 Email Verification Implementation Guide

## Overview

Email verification has been implemented to ensure users verify their email addresses before accessing the ConnectSphere platform. This document explains the implementation and how to integrate it with the frontend.

## Backend Changes

### 1. Database Schema Updates

**New fields added to `users` table:**
- `email_verified` (Boolean) - Whether the email has been verified
- `email_verification_token` (String) - Token sent in verification email
- `email_verification_expires` (DateTime) - When the verification token expires

### 2. New API Endpoints

#### Register User (Modified)
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "location_zone": "Mbare",
  "preferred_categories": ["Vegetables", "Grains"],
  "budget_range": "medium",
  "experience_level": "beginner",
  "preferred_group_sizes": ["small", "medium"],
  "participation_frequency": "occasional"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "email": "user@example.com",
  "user_id": 123,
  "verification_required": true,
  "status": "pending_verification"
}
```

#### Verify Email
```
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Success Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "status": "verified",
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user_id": 123,
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

**Error Responses:**
- `400`: Invalid or expired token
- Token already used: `{"status": "already_verified"}`
- Token expired: `{"status": "expired", "email": "user@example.com"}`

#### Resend Verification Email
```
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent! Please check your inbox.",
  "status": "sent",
  "email": "user@example.com"
}
```

#### Login (Modified)
```
POST /api/auth/login
```

**New Error Response:**
```json
{
  "detail": "Email not verified. Please check your email for the verification link or request a new one."
}
```
Status Code: `403 FORBIDDEN`

## Frontend Implementation

### 1. Update Registration Flow

**File:** `sys/Front-end/connectsphere/src/pages/EnhancedRegistrationPage.tsx`

Modify the registration submit handler:

```typescript
const handleSubmit = async () => {
  try {
    const response = await apiService.post('/api/auth/register', formData);
    
    if (response.verification_required) {
      // Show success message
      setSuccessMessage(response.message);
      
      // Redirect to verification pending page
      navigate('/verification-pending', {
        state: { email: response.email }
      });
    }
  } catch (error) {
    // Handle errors
    setError(error.message);
  }
};
```

### 2. Create Verification Pending Page

**File:** `sys/Front-end/connectsphere/src/pages/VerificationPendingPage.tsx`

```typescript
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const VerificationPendingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await apiService.post('/api/auth/resend-verification', { email });
      setMessage(response.message);
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to
          </p>
          <p className="text-gray-900 font-semibold mt-1">{email}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Check your email inbox</li>
            <li>Click the verification link</li>
            <li>You'll be automatically logged in</li>
          </ol>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : "Didn't receive the email? Resend"}
          </button>

          {message && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
              {message}
            </p>
          )}

          <button
            onClick={() => navigate('/login')}
            className="block w-full text-gray-600 hover:text-gray-900 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPendingPage;
```

### 3. Create Email Verification Page

**File:** `sys/Front-end/connectsphere/src/pages/EmailVerificationPage.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await apiService.post('/api/auth/verify-email', { token });
        
        if (response.status === 'verified') {
          setStatus('success');
          setMessage(response.message);
          
          // Store the access token
          if (response.access_token) {
            localStorage.setItem('token', response.access_token);
          }
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/trader-dashboard');
          }, 3000);
        } else if (response.status === 'already_verified') {
          setStatus('success');
          setMessage('Email already verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else if (response.status === 'expired') {
          setStatus('expired');
          setEmail(response.email);
          setMessage('Verification link has expired');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResend = async () => {
    if (!email) return;
    
    try {
      await apiService.post('/api/auth/resend-verification', { email });
      setMessage('New verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-gray-600">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Link Expired
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={handleResend}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Resend Verification Email
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
```

### 4. Update Routes

**File:** `sys/Front-end/connectsphere/src/App.tsx`

Add these new routes:

```typescript
import VerificationPendingPage from './pages/VerificationPendingPage';
import EmailVerificationPage from './pages/EmailVerificationPage';

// In your Routes:
<Route path="/verification-pending" element={<VerificationPendingPage />} />
<Route path="/verify-email" element={<EmailVerificationPage />} />
```

### 5. Update Login Page Error Handling

**File:** `sys/Front-end/connectsphere/src/pages/LoginPage.tsx`

Update error handling to show verification prompt:

```typescript
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    await apiService.login(credentials);
    navigate('/trader-dashboard');
  } catch (error) {
    if (error.status === 403 && error.message.includes('Email not verified')) {
      setError('Email not verified. Please check your email or request a new verification link.');
      setShowResendButton(true);
    } else {
      setError(error.message);
    }
  }
};
```

## Database Migration

Run the migration script to add the new fields:

```bash
cd sys/backend
python migrate_email_verification.py
```

This will:
1. Add the three new columns to the users table
2. Mark all existing users as verified (grandfather clause)
3. New registrations will require email verification

## Testing

### 1. Test Registration Flow
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "full_name": "Test User",
    "location_zone": "Mbare"
  }'
```

### 2. Test Verification
```bash
curl -X POST http://localhost:8000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_FROM_EMAIL"}'
```

### 3. Test Resend
```bash
curl -X POST http://localhost:8000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Email Template Preview

The verification email includes:
- Welcome message
- Large "Verify Email Address" button
- Clickable verification link
- Expiration notice (24 hours)
- Professional styling with ConnectSphere branding

## Environment Variables

Make sure these are set in your `.env` file:

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@connectsphere.com
FROM_NAME=ConnectSphere

# Frontend URL for verification links
FRONTEND_URL=http://localhost:5173
```

## Security Features

✅ Secure token generation using `secrets.token_urlsafe(32)`
✅ Token expiration (24 hours)
✅ One-time use tokens (cleared after verification)
✅ Email enumeration protection
✅ Graceful error handling
✅ Existing users grandfathered in as verified

## Next Steps

1. Run the database migration
2. Restart backend server
3. Implement frontend pages
4. Test complete flow
5. Update user documentation

## Support

If users have issues:
- They can request new verification emails unlimited times
- Admin can manually verify users if needed
- Existing users continue to work without interruption

