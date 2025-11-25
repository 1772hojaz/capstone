# Unified Login Page Implementation Guide

## Overview

ConnectSphere now has a **single unified sign-in page** that automatically detects user roles and redirects them to the appropriate dashboard.

## Architecture

### Single Sign-In, Multiple Dashboards

```
┌─────────────────────────────────────────┐
│      Unified Login Page (/login)        │
│                                         │
│  Email + Password                       │
│  ↓                                      │
│  Backend Authentication                 │
│  ↓                                      │
│  Role Detection                         │
└─────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ↓            ↓            ↓
┌─────────┐ ┌──────────┐ ┌────────┐
│  Admin  │ │ Supplier │ │ Trader │
│Dashboard│ │Dashboard │ │Dashboard│
│ /admin  │ │/supplier/│ │/trader │
│         │ │dashboard │ │        │
└─────────┘ └──────────┘ └────────┘
```

## Routes Structure

### Authentication Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | **UnifiedLoginPage** | **Single sign-in for all users** |
| `/register` | LoginPage (registration mode) | Trader registration |
| `/supplier/register` | SupplierLoginPage (registration mode) | Supplier registration |

### Old Routes (Removed/Deprecated)

| Old Route | Status |
|-----------|--------|
| `/trader/login` | ❌ Removed |
| `/supplier/login` | ❌ Removed |
| `/admin/login` | ❌ Never existed, now unified |

## User Experience Flow

### 1. New User Registration

**Trader Registration:**
1. User goes to `/login`
2. Clicks "Register as Trader" button
3. Redirected to `/register`
4. Fills trader registration form
5. After successful registration, redirected to sign-in
6. Signs in via `/login` → redirected to `/trader`

**Supplier Registration:**
1. User goes to `/login`
2. Clicks "Register as Supplier" button
3. Redirected to `/supplier/register`
4. Fills supplier registration form (company details)
5. After successful registration, redirected to sign-in
6. Signs in via `/login` → redirected to `/supplier/dashboard`

### 2. Existing User Login

**All Users (Trader, Supplier, or Admin):**
1. User goes to `/login`
2. Enters email and password
3. Clicks "Sign In"
4. Backend determines role from user account
5. Automatic redirect based on role:
   - Admin → `/admin`
   - Supplier → `/supplier/dashboard`
   - Trader → `/trader`

## Implementation Details

### UnifiedLoginPage Component

**Location**: `sys/Front-end/connectsphere/src/pages/UnifiedLoginPage.tsx`

**Key Features:**
- Single email/password form
- No role selection needed (automatic detection)
- Visual indicators for all three user types
- Direct API call to `/api/auth/login`
- Reads `is_admin` and `is_supplier` from response
- Automatic role-based redirection
- Loading states and error handling

**Authentication Logic:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

// Role detection
if (data.is_admin) {
  navigate('/admin');
} else if (data.is_supplier) {
  navigate('/supplier/dashboard');
} else {
  navigate('/trader');
}
```

### Backend Response Structure

The `/api/auth/login` endpoint returns:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "is_admin": false,
  "is_supplier": true,
  "location_zone": "HARARE",
  "full_name": "John Supplier",
  "email": "john@supplier.com",
  "company_name": "Supplier Inc."
}
```

## Benefits

### 1. **Simplified User Experience**
- ✅ One URL to remember: `/login`
- ✅ No confusion about which login page to use
- ✅ Automatic role detection
- ✅ Consistent branding across all user types

### 2. **Better Security**
- ✅ Single authentication endpoint to secure
- ✅ Role-based access control enforced at both frontend and backend
- ✅ Reduced attack surface (fewer login endpoints)

### 3. **Easier Maintenance**
- ✅ One login form to maintain
- ✅ Consistent authentication logic
- ✅ Simpler routing structure

### 4. **Flexible Role Management**
- ✅ Easy to add new roles in the future
- ✅ Role changes handled automatically
- ✅ No need to change login URLs

## Navigation Updates

### Landing Pages

**Main Landing Page** (`/`)
- "Sign In" button → `/login`
- "Get Started" button → `/login`

**Supplier Landing Page** (`/supplier`)
- "Sign In" button → `/login` (updated from `/supplier/login`)
- "Register" button → `/supplier/register`

### Registration Pages

**Trader Registration** (`/register`)
- Shows only registration form
- "Already have an account? Sign In Here" → `/login`

**Supplier Registration** (`/supplier/register`)
- Shows only supplier registration form
- "Already have an account? Sign In Here" → `/login`

## Testing the Unified Login

### Test Credentials

**Admin:**
```
Email: admin@mbare.co.zw
Password: admin123
Expected redirect: /admin
```

**Supplier:**
```
Email: fresh@produce.co.zw
Password: supplier123
Expected redirect: /supplier/dashboard
```

**Trader:**
```
Email: tino@gmail.com
Password: tinashe123
Expected redirect: /trader
```

### Test Scenarios

#### ✅ Scenario 1: Admin Login
1. Go to `/login`
2. Enter admin credentials
3. Click "Sign In"
4. **Expected**: Redirect to `/admin` dashboard
5. **Verify**: See admin navigation (Users, Moderation, ML Analytics, etc.)

#### ✅ Scenario 2: Supplier Login
1. Go to `/login`
2. Enter supplier credentials
3. Click "Sign In"
4. **Expected**: Redirect to `/supplier/dashboard`
5. **Verify**: See supplier dashboard with Overview, Orders, Groups, Payments tabs

#### ✅ Scenario 3: Trader Login
1. Go to `/login`
2. Enter trader credentials
3. Click "Sign In"
4. **Expected**: Redirect to `/trader`
5. **Verify**: See personalized recommendations page

#### ✅ Scenario 4: Registration Flow
1. Go to `/login`
2. Click "Register as Trader"
3. Fill registration form at `/register`
4. Submit form
5. **Expected**: Redirect back to `/login` with success message
6. Login with new credentials
7. **Expected**: Redirect to `/trader`

#### ✅ Scenario 5: Wrong Credentials
1. Go to `/login`
2. Enter invalid email/password
3. Click "Sign In"
4. **Expected**: Error message displayed
5. **Verify**: User stays on login page

## Error Handling

### Common Errors

| Error | Message | Solution |
|-------|---------|----------|
| Invalid credentials | "Invalid credentials. Please check your email and password." | Check email/password |
| Network error | "An unexpected error occurred. Please try again." | Check internet connection |
| Server error | Backend error message | Contact support |

### Error Display

- Errors shown in red alert box above form
- Success messages shown in green alert box
- Loading state shows spinner in submit button
- Form inputs highlight red when invalid

## Future Enhancements

### Planned Features

1. **Remember Me** - Already implemented, persists login session
2. **Forgot Password** - Button present, needs backend implementation
3. **Social Login** - OAuth integration (Google, Facebook)
4. **Two-Factor Authentication** - For admin accounts
5. **Email Verification** - For new registrations
6. **Password Strength Indicator** - Visual feedback on registration

### Potential Improvements

- Add CAPTCHA for bot prevention
- Implement rate limiting for failed login attempts
- Add "Login with QR Code" for mobile apps
- Support for multiple sessions across devices
- Login history tracking

## Migration Notes

### For Developers

If you had bookmarks or hardcoded links to old login pages:

- Replace `/trader/login` → `/login`
- Replace `/supplier/login` → `/login`
- Replace `/admin/login` → `/login`
- Update any email templates with login links

### For Users

- **Old bookmarks still work**: Old login URLs redirect to `/login`
- **Single login URL**: Remember only `/login` or use the homepage
- **No role selection needed**: System detects your role automatically

## Technical Notes

### Components Modified

| File | Changes |
|------|---------|
| `UnifiedLoginPage.tsx` | **New** - Main unified login page |
| `App.tsx` | Updated routes, added UnifiedLoginPage |
| `LoginPage.tsx` | Now used only for trader registration |
| `SupplierLoginPage.tsx` | Now used only for supplier registration |
| `SupplierLandingPage.tsx` | Updated links to use `/login` |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Unified login for all roles |
| `/api/auth/register` | POST | Trader registration |
| `/api/auth/register-supplier` | POST | Supplier registration |

## Security Considerations

### Frontend Security

- ✅ Passwords never logged or stored unencrypted
- ✅ JWT tokens stored in localStorage
- ✅ Role checks on protected pages
- ✅ Automatic logout on token expiration

### Backend Security

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Token expiration (24 hours)
- ✅ HTTPS required in production

## Support

### Common Questions

**Q: Can I still register as a trader or supplier?**  
A: Yes! Click the appropriate "Register as Trader" or "Register as Supplier" button on the unified login page.

**Q: What if I forgot which type of account I have?**  
A: It doesn't matter! Just login with your email and password, and you'll be automatically redirected to the correct dashboard.

**Q: Can an admin also be a trader?**  
A: No, each account has a single primary role. Role hierarchy: Admin > Supplier > Trader.

**Q: How do I switch from trader to supplier?**  
A: You need to register a new supplier account. Contact support if you need to migrate your data.

---

**Last Updated**: November 20, 2024  
**Version**: 1.0.0  
**Author**: ConnectSphere Development Team

