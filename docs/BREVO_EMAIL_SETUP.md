# Brevo Email Service Setup Instructions

## ✅ Your Brevo Credentials

You have been provided with Brevo (formerly Sendinblue) SMTP credentials. Here's how to configure them:

---

## Step 1: Update Your `.env` File

Open or create the file: `sys/backend/.env`

Add these lines:

```bash
# Email Configuration - Brevo (Sendinblue)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9bc95c001@smtp-brevo.com
SMTP_PASSWORD=mZVArabxWvwR2qCI
FROM_EMAIL=9bc95c001@smtp-brevo.com
FROM_NAME=ConnectSphere
```

**Important**: Make sure there are no extra spaces before or after the `=` sign.

---

## Step 2: Install Required Package (if not already installed)

```bash
cd sys/backend
pip install python-dotenv
```

---

## Step 3: Update `main.py` to Load Environment Variables

Open `sys/backend/main.py` and add these lines **at the very top** (after imports):

```python
from dotenv import load_dotenv
load_dotenv()  # Load .env file
```

Example:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  # Add this
import os

load_dotenv()  # Add this at the top

# ... rest of your code
```

---

## Step 4: Test Your Email Configuration

Run the test script:

```bash
cd sys/backend
python test_email_brevo.py
```

**What to expect**:
1. Script will show your configuration
2. It will ask for your email address
3. It will send you a test email
4. Check your inbox (and spam folder)

**Success**: You should receive an email from ConnectSphere via Brevo!

---

## Step 5: Restart Your Backend

After updating `.env` and `main.py`:

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd sys/backend
python main.py
```

---

## Verification

To verify the email service is configured correctly, check the console output when backend starts:

You should see:
```
Email service initialized
Mode: PRODUCTION
SMTP Host: smtp-relay.brevo.com
```

If you see "SIMULATION MODE", the `.env` file isn't being loaded properly.

---

## Troubleshooting

### Issue: Still showing "Simulation Mode"

**Solution 1**: Make sure `.env` file is in the correct location
```bash
# Should be here:
sys/backend/.env  ✅

# NOT here:
sys/.env  ❌
.env      ❌
```

**Solution 2**: Make sure `load_dotenv()` is called in `main.py`

**Solution 3**: Restart the backend server completely

### Issue: Email not received

**Check**:
1. Spam/Junk folder
2. Brevo account is active (check https://app.brevo.com)
3. FROM_EMAIL matches your verified sender in Brevo
4. No firewall blocking port 587

### Issue: Authentication Error

**Check**:
- Credentials are copied exactly (no extra spaces)
- Password: `mZVArabxWvwR2qCI`
- Username: `9bc95c001@smtp-brevo.com`

---

## What Emails Will Be Sent?

Once configured, the system will automatically send:

1. **Group Deletion Notifications**
   - When admin deletes a group with participants
   - Includes refund details
   - CSV export of participants

2. **Refund Confirmations**
   - When supplier rejects an order
   - When admin processes manual refunds
   - Includes transaction reference

3. **Payment Notifications** (future)
   - Order confirmations
   - Payment receipts
   - Delivery updates

---

## Brevo Dashboard

Monitor your emails at: https://app.brevo.com

You can see:
- Emails sent
- Delivery rate
- Opens and clicks
- Bounce rate
- Daily limits (300 emails/day on free plan)

---

## Quick Test via Python

```python
from services.email_service import email_service

# Check mode
print(f"Mode: {'SIMULATION' if email_service.simulation_mode else 'PRODUCTION'}")

# Send test email
result = email_service.send_email(
    to_email="your_email@example.com",
    subject="Test",
    body_html="<h1>Test Email</h1>",
    body_text="Test Email"
)

print(f"Status: {result['status']}")
```

---

## Security Notes

⚠️ **Never commit `.env` file to git!**

Your `.gitignore` should include:
```
.env
*.env
.env.local
.env.production
```

---

## Support

If emails still don't work:
1. Check Brevo dashboard for errors
2. Verify sender email is verified in Brevo
3. Check Brevo account status
4. Review logs: `sys/backend/logs/backend.log`

---

## Summary

✅ SMTP Host: `smtp-relay.brevo.com`  
✅ Port: `587`  
✅ User: `9bc95c001@smtp-brevo.com`  
✅ Password: `mZVArabxWvwR2qCI`  
✅ Free tier: 300 emails/day  
✅ Production-ready  

Your email service is now ready for real email delivery! 🚀

