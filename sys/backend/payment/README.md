# Payment Module - Flutterwave Integration

This module provides payment processing capabilities using Flutterwave for the Mbare group-buy system.

## Features

- Initialize payments for group-buy transactions
- Verify payment status
- Handle payment callbacks
- Calculate transaction fees (approximate)

## API Endpoints

### POST /api/payment/initialize
Initialize a new payment transaction.

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "email": "user@example.com",
  "tx_ref": "unique_transaction_ref_123",
  "redirect_url": "https://yourapp.com/payment/success"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Hosted Link",
  "data": {
    "link": "https://checkout.flutterwave.com/pay/unique_ref"
  }
}
```

### POST /api/payment/verify
Verify a completed payment.

**Request Body:**
```json
{
  "transaction_id": "123456789"
}
```

**Response:**
```json
**Response:**
```json
{
  "status": "success",
  "message": "Transaction fetched successfully",
  "data": {
    "status": "successful",
    "amount": 100,
    "currency": "USD",
    "customer": {
      "email": "user@example.com"
    }
  }
}
```
```

### GET /api/payment/fee
Get approximate transaction fee.

**Query Parameters:**
- `amount`: Payment amount
- `currency`: Currency code (default: USD)

### POST /api/payment/callback
Handle Flutterwave payment callback (webhook).

## Configuration

The service uses the following environment variables:

- `FLUTTERWAVE_PUBLIC_KEY`: Public key
- `FLUTTERWAVE_SECRET_KEY`: Secret key
- `FLUTTERWAVE_ENCRYPTION_KEY`: Encryption key

If not set, defaults from `futterwave.txt` are used.

## Usage Example

```python
from payment.flutterwave_service import flutterwave_service

# Initialize payment
response = flutterwave_service.initialize_payment(
    amount=100.00,
    email="customer@example.com",
    tx_ref="order_12345"
)

# Verify payment
verification = flutterwave_service.verify_payment("123456789")
```

## Testing

The integration is configured for Flutterwave's test environment. Use test card details for testing:

- Card Number: 5531886652142950
- CVV: 564
- Expiry: 09/32
- PIN: 3310

## Production

For production:
1. Set `is_test=False` in the service
2. Use live API keys
3. Update webhook URL in Flutterwave dashboard