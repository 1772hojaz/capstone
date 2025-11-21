# Visual Guide: Finding Flutterwave Standard API Keys

## 🚨 You're in the Wrong Section!

You're currently viewing **"Test webhooks"** which shows **OAuth credentials**.

You need **"API Keys"** or **"API"** section for **Standard API keys**.

---

## 📱 Navigation Steps

### Step 1: Look at Your Left Sidebar

In your Flutterwave dashboard, find these menu items:

```
┌─────────────────────────┐
│ 🏠 Home                 │
│ 💳 Transactions         │
│ 💰 Settlements          │
│ 👥 Customers            │
│ 📊 Reports              │
│ 🔧 Developers           │ ← Click here!
│ ⚙️  Settings             │
└─────────────────────────┘
```

### Step 2: In "Developers" or "Settings"

Click on **"Developers"** or go to **"Settings"**, then look for:

**Option A: Under "Developers"**
```
Developers
├── API Keys        ← Click here!
├── Webhooks        ← NOT here (you're here now)
└── SDKs
```

**Option B: Under "Settings"**
```
Settings
├── Profile
├── Business
├── API             ← Click here!
├── Webhooks        ← NOT here
└── Security
```

### Step 3: Look for "Standard Integration"

Once in the correct section, you should see:

```
┌──────────────────────────────────────────────┐
│  Test Environment                            │
├──────────────────────────────────────────────┤
│                                              │
│  Standard Integration                        │
│  ────────────────────                        │
│                                              │
│  Public Key (Client)                         │
│  FLWPUBK_TEST-abc123def456...                │
│  [📋 Copy]                                   │
│                                              │
│  Secret Key (Server)                         │
│  FLWSECK_TEST-xyz789ghi012...                │
│  [📋 Copy] [👁️ Show]                        │
│                                              │
│  Encryption Key                              │
│  FLWSECK_TEST789012345...                    │
│  [📋 Copy]                                   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🔍 Key Differences

### What You're Seeing (Webhooks - OAuth):
```
Section: "Test webhooks"
Client ID:     12a8c4c6-9bc6-4f80-9ea9-5a26842f2d53  (UUID)
Client Secret: 6nCZym5JnoZBhmYBFhMve34qcNiIkpou      (28 chars)
```

### What You Should See (API Keys - Standard):
```
Section: "API Keys" or "Standard Integration"
Public Key:  FLWPUBK_TEST-[long string]-X            (50+ chars)
Secret Key:  FLWSECK_TEST-[long string]-X            (50+ chars)
```

---

## 🎯 Exact Menu Path

### Try These Paths:

**Path 1:**
```
Settings → API → Test Keys → Standard Integration
```

**Path 2:**
```
Developers → API Keys → Test Environment
```

**Path 3:**
```
Settings → Developers → API Keys
```

---

## 📸 What the Correct Page Looks Like

### Page Title Should Say:
- "API Keys"
- "API"
- "Developers - API Keys"

### NOT:
- ❌ "Webhooks"
- ❌ "Test webhooks"
- ❌ "Webhook endpoints"

### Keys Should Start With:
- ✅ `FLWPUBK_TEST-` (Public Key)
- ✅ `FLWSECK_TEST-` (Secret Key)
- ✅ `FLWSECK_TEST` (Encryption Key - shorter)

### NOT:
- ❌ UUID format: `12a8c4c6-9bc6-...`
- ❌ Short string: `6nCZym5JnoZ...`

---

## 🆘 Still Can't Find It?

### Option 1: Use Flutterwave Search
Look for a **search bar** at the top of your dashboard and search for:
- "API Keys"
- "Standard API"
- "Integration keys"

### Option 2: Check Documentation
Visit: https://developer.flutterwave.com/docs/integration-guides/authentication

This will show you where the API keys are located.

### Option 3: Contact Support
In your dashboard:
1. Look for **"Help"** or **"Support"** button (usually bottom right)
2. Click **"Live Chat"**
3. Say: *"I need to find my Standard API Keys (Public and Secret) for direct payment integration"*

### Option 4: Ask for Screenshots
If you can:
1. Take a screenshot of your left sidebar menu
2. Take a screenshot of what's under "Developers" menu
3. Share them here (blur any sensitive data)

I'll point you to exactly where to click!

---

## 💡 Quick Test

Once you find keys, verify they're correct:

**Correct API Keys:**
- Public Key: 50+ characters, starts with `FLWPUBK`
- Secret Key: 50+ characters, starts with `FLWSECK`

**Wrong (OAuth):**
- Client ID: 36 characters, UUID format
- Client Secret: ~28 characters, alphanumeric

---

**You're close! Just need to find the right section in your dashboard.** 🔑

Last Updated: November 21, 2024

