clear
# Getting Your Flutterwave API Keys

## 🔑 Where to Find Your Keys

### Step 1: Login to Flutterwave Dashboard
- Go to: https://dashboard.flutterwave.com
- Login with your account credentials

### Step 2: Navigate to Settings
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API Keys** or **API**

### Step 3: Get Your Keys

You'll see two sets of keys:

#### Test Keys (Sandbox)
- Use these for testing
- Keys start with `_TEST-`

#### Live Keys (Production)
- Use these for real transactions
- Keys start without `_TEST-`

### Example Key Formats

**Public Key (Test):**
```
FLWPUBK_TEST-[48-character-string]-X
```

**Secret Key (Test):**
```
FLWSECK_TEST-[48-character-string]-X
```

**Encryption Key:**
```
FLWSECK_TEST[alphanumeric-string]
```

**Public Key (Live):**
```
FLWPUBK-[48-character-string]-X
```

**Secret Key (Live):**
```
FLWSECK-[48-character-string]-X
```

## ⚠️ Key Differences

### What You Have (OAuth Credentials):
- **Client ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID format)
- **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxx` (short, ~28 characters)
- **Use Case**: OAuth 2.0 authentication flow

### What You Need (API Keys):
- **Public Key**: `FLWPUBK-xxxxx` or `FLWPUBK_TEST-xxxxx`
- **Secret Key**: `FLWSECK-xxxxx` or `FLWSECK_TEST-xxxxx`
- **Use Case**: Direct API integration (what we're using)

## 🔧 How to Configure

Once you have the correct keys:

### Option A: Update the Service File

Edit `sys/backend/payment/flutterwave_service.py` and replace:

```python
self.public_key = os.getenv('FLUTTERWAVE_PUBLIC_KEY', 'YOUR_PUBLIC_KEY_HERE')
self.secret_key = os.getenv('FLUTTERWAVE_SECRET_KEY', 'YOUR_SECRET_KEY_HERE')
self.encryption_key = os.getenv('FLUTTERWAVE_ENCRYPTION_KEY', 'YOUR_ENCRYPTION_KEY_HERE')
```

### Option B: Create .env File

Create `sys/backend/.env`:

```bash
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-key-here
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-key-here
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key-here
```

## 🧪 Testing

### Test Keys
If you want to test first, Flutterwave provides test keys. Look for the "Test" environment toggle in your dashboard.

### Test Card Details
- **Card Number**: 5531886652142950
- **CVV**: 564
- **Expiry**: 09/32
- **PIN**: 3310
- **OTP**: 12345

## 📞 Need Help?

If you can't find your API keys:

1. **Check Settings → API Keys** in dashboard
2. **Contact Flutterwave Support**:
   - Email: support@flutterwave.com
   - Phone: Check their website for your region
3. **Documentation**: https://developer.flutterwave.com/docs

## 🔍 Current Issue

**Error**: "Invalid authorization key" (401)

**Cause**: The credentials provided appear to be OAuth credentials (Client ID/Secret) rather than standard API keys (Public/Secret keys).

**Solution**: 
1. Login to Flutterwave dashboard
2. Go to Settings → API Keys
3. Copy the **Public Key** and **Secret Key** (they should start with FLWPUBK- and FLWSECK-)
4. Update the configuration

---

**Last Updated**: November 21, 2024

