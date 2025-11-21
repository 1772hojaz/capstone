# How to Find Your Flutterwave API Keys

## 🚨 IMPORTANT: You Need Different Keys!

The credentials you have (Client ID and Client Secret) are **OAuth credentials** used for different purposes.

For our payment integration, you need **Standard API Keys**.

---

## 📍 Step-by-Step Guide

### Step 1: Login to Flutterwave
- Go to: **https://dashboard.flutterwave.com**
- Enter your email and password
- Complete 2FA if enabled

### Step 2: Navigate to Settings
Once logged in:
1. Look at the **left sidebar**
2. Click the **gear icon** (⚙️) or **"Settings"** at the bottom
3. In the Settings menu, click **"API"** or **"API Keys"**

### Step 3: Choose Environment
You'll see two tabs at the top:
- **🧪 Test (Sandbox)** - For testing without real money
- **💰 Live (Production)** - For real transactions

Start with **Test** to make sure everything works!

### Step 4: Find Your Keys

On the API Keys page, you should see:

```
┌─────────────────────────────────────────────────────────┐
│  Test API Keys                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Public Key (Client)                                    │
│  FLWPUBK_TEST-1234567890abcdef1234567890abcdef-X       │
│  [📋 Copy]                                              │
│                                                         │
│  Secret Key (Server)                                    │
│  FLWSECK_TEST-1234567890abcdef1234567890abcdef-X       │
│  [📋 Copy] [👁️ Show]                                   │
│                                                         │
│  Encryption Key                                         │
│  FLWSECK_TEST1234567890ab                              │
│  [📋 Copy]                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 5: Copy the Keys

**Look for these specific formats:**

✅ **Public Key** - Should look like:
```
FLWPUBK_TEST-************************************************-X
```

✅ **Secret Key** - Should look like:
```
FLWSECK_TEST-************************************************-X
```

✅ **Encryption Key** - Should look like:
```
FLWSECK_TEST****************
```

---

## ❌ What You Currently Have (Won't Work)

```
Client ID:         12a8c4c6-9bc6-4f80-9ea9-5a26842f2d53
                   ↑ This is a UUID format (OAuth)
                   ↑ NOT the Public Key we need

Client Secret:     6nCZym5JnoZBhmYBFhMve34qcNiIkpou
                   ↑ Too short (OAuth)
                   ↑ NOT the Secret Key we need

Encryption Key:    d5A347B9ixcJpAd6j7KCVSNKnGNNwdP1rKZLPJqp08o=
                   ↑ Might be correct, but needs the other keys too
```

---

## ✅ What You Need to Find

**Public Key Format:**
```
FLWPUBK_TEST-[48 characters]-X
or
FLWPUBK-[48 characters]-X (for live)
```

**Secret Key Format:**
```
FLWSECK_TEST-[48 characters]-X
or
FLWSECK-[48 characters]-X (for live)
```

---

## 🎯 Quick Checklist

Before sharing keys with me, verify:
- [ ] Public Key starts with `FLWPUBK_TEST-` or `FLWPUBK-`
- [ ] Secret Key starts with `FLWSECK_TEST-` or `FLWSECK-`
- [ ] Both keys are very long (about 50+ characters each)
- [ ] You copied them from "Settings → API → Test/Live"

---

## 🆘 Can't Find the Keys?

### Option 1: Look in Different Places
Some Flutterwave dashboards show keys in:
- Settings → **API**
- Settings → **Developers**
- Settings → **API Keys**

### Option 2: Check Your Account Type
- Make sure you have a **merchant/business account**
- Personal accounts might have limited access

### Option 3: Contact Flutterwave Support
- Email: **support@flutterwave.com**
- Live Chat: Available in the dashboard (bottom right)
- Phone: Check their website for your region

Tell them: *"I need my Standard API Keys (Public and Secret) for direct API integration"*

---

## 🧪 Temporary Solution: Use Test Keys

If you want to test the payment flow immediately, I can configure test keys temporarily:

**Test Keys** (Public, work for testing only):
- Public: `FLWPUBK_TEST-SANDBOXSTART-**************-SANDBOXEND`
- Secret: `FLWSECK_TEST-SANDBOXSTART-**************-SANDBOXEND`

Would you like me to set up test keys so you can test the flow while you locate your production keys?

---

## 📞 Need More Help?

1. **Take a screenshot** of your API Keys page (blur sensitive parts)
2. **Tell me** what sections you see in Settings
3. **Let me know** if you see "OAuth" or "Standard" or "Direct" API options

I'm here to help you find the right keys! 🔑

---

**Last Updated**: November 21, 2024

