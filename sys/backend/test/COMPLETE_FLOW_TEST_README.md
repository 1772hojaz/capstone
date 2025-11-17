# Complete Backend Flow Test

## Overview
This test script validates the entire group-buy workflow from creation to completion, including payment integration, refunds, and fund transfers.

## Test Scenario

The test covers the following workflow:

### 1. Setup Phase
- Create three test users:
  - Supplier (`supplier_test@example.com`)
  - Trader (`trader_test@example.com`)
  - Admin (`admin_test@example.com`)

### 2. Group Creation & Deletion Flow
- Supplier creates a test group buy
- Admin deletes the group
  - Tests CSV export of participants
  - Tests automatic email notifications
  - Tests automatic refund processing

### 3. Main Purchase Flow
- Supplier creates a second group buy
- Trader joins the group with full payment (Flutterwave integration)
- Trader completes the MOQ (Minimum Order Quantity)
- System automatically creates supplier order

### 4. Rejection Flow
- Supplier views pending order
- Supplier rejects the order
- System automatically processes refunds
- System sends refund confirmation emails

### 5. Acceptance Flow
- Supplier creates a third group buy
- Trader joins and completes MOQ
- Supplier accepts the order
- Admin transfers funds to supplier (Flutterwave transfer)
- Platform fee deducted (10%)

## Prerequisites

### 1. Backend Server Running
Make sure the backend server is running:
```bash
cd sys/backend
python main.py
```

The server should be accessible at `http://localhost:8000`

### 2. Database Setup
Ensure the database is properly initialized:
```bash
cd sys/backend
python create_tables.py
```

### 3. Environment Variables (Optional)
For full Flutterwave integration (not required for test):
```bash
# .env file
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_public_key
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
```

**Note**: The test runs in simulation mode by default if Flutterwave keys are not provided.

## Running the Test

### Method 1: Direct Execution
```bash
cd sys/backend
python test/test_complete_flow.py
```

### Method 2: From Test Directory
```bash
cd sys/backend/test
python test_complete_flow.py
```

## Expected Output

The test will print detailed output for each step:

```
================================================================================
 COMPLETE BACKEND FLOW TEST
================================================================================
Testing against: http://localhost:8000
Started at: 2024-01-15T10:30:00.000000

[STEP 1] Setup: Create Test Users
--------------------------------------------------------------------------------
[OK] Created supplier: supplier_test@example.com
[OK] Created trader: trader_test@example.com
[OK] Created admin: admin_test@example.com

[STEP 2] Supplier Creates Group Buy
--------------------------------------------------------------------------------
[OK] Created group ID: 123

[STEP 3] Admin Deletes Group (CSV Export & Refunds)
--------------------------------------------------------------------------------
[OK] Deleted group 123
  - Participants: 0
  - Emails sent: 0
  - CSV generated: Yes

... (additional steps)

================================================================================
 TEST SUMMARY
================================================================================
Total Tests: 12
Passed: 12 (100.0%)
Failed: 0 (0.0%)
Completed at: 2024-01-15T10:32:00.000000

[SUCCESS] All tests passed!
```

## Test Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed
- `130`: Test interrupted by user (Ctrl+C)

## Verifying Results

### 1. Check Database
You can verify the test data in the database:
```python
from db.database import SessionLocal
from models.models import User, SupplierOrder, AdminGroup

db = SessionLocal()

# Check users
users = db.query(User).filter(User.email.like('%test@example.com')).all()
print(f"Test users: {len(users)}")

# Check orders
orders = db.query(SupplierOrder).all()
print(f"Orders: {len(orders)}")

db.close()
```

### 2. Check Email Logs
If SMTP is configured, check email delivery logs:
```bash
# Check console output for email simulation messages
grep "SIMULATION" test_output.log
```

### 3. Check Payment Logs
Review Flutterwave transaction logs:
```bash
# Check for payment initialization messages
grep "Payment initialized" backend.log
```

## Simulation Mode

The test runs in **simulation mode** by default, which means:

1. **Payment Initialization**: Flutterwave API calls are simulated
   - Payments are auto-approved
   - Transaction IDs are generated locally

2. **Refunds**: Refund API calls are simulated
   - Refunds are marked as successful immediately

3. **Bank Transfers**: Transfer API calls are simulated
   - Transfers to suppliers are marked as successful

4. **Emails**: Email sending is simulated
   - Email content is logged to console
   - No actual emails are sent

## Production Mode

To run with real Flutterwave and email services:

1. Set environment variables:
```bash
export FLUTTERWAVE_SECRET_KEY="your_real_key"
export FLUTTERWAVE_PUBLIC_KEY="your_real_public_key"
export SMTP_USER="your_email@domain.com"
export SMTP_PASSWORD="your_password"
```

2. Run the test
3. **WARNING**: This will create real payment transactions and send real emails

## Troubleshooting

### Test Fails at User Creation
- **Issue**: Users already exist from previous test run
- **Solution**: Delete test users from database or use different emails

### Test Fails at Group Creation
- **Issue**: Supplier authentication failed
- **Solution**: Check if supplier account was created successfully

### Test Fails at Order Creation
- **Issue**: Group didn't complete (MOQ not reached)
- **Solution**: Check if trader joined with sufficient quantity

### Payment Errors
- **Issue**: Flutterwave API errors
- **Solution**: Verify API keys or run in simulation mode

## Cleanup

After testing, you may want to clean up test data:

```python
from db.database import SessionLocal
from models.models import User, AdminGroup, SupplierOrder

db = SessionLocal()

# Delete test users (cascades to related data)
db.query(User).filter(User.email.like('%test@example.com')).delete()
db.commit()

print("Test data cleaned up")
db.close()
```

## Integration with CI/CD

To integrate this test into your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd sys/backend
          pip install -r requirements.txt
      - name: Start backend
        run: |
          cd sys/backend
          python main.py &
          sleep 10
      - name: Run complete flow test
        run: |
          cd sys/backend
          python test/test_complete_flow.py
```

## Support

If you encounter issues:
1. Check the backend logs: `sys/backend/logs/`
2. Verify database schema: `python validate_db.py`
3. Review API endpoints: Visit `http://localhost:8000/docs`

## Related Documentation

- [Cold Start Handler Implementation](COLD_START_IMPLEMENTATION_SUMMARY.md)
- [Recommendation System Tests](RECOMMENDATION_TEST_RESULTS.md)
- [New Trader Cold Start](NEW_TRADER_COLD_START.md)

