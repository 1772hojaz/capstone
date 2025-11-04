# Front-end Payment Integration

This document describes the Flutterwave payment integration in the ConnectSphere front-end application.

## Overview

The payment system integrates Flutterwave for secure card payments in USD. Users can make payments for group purchases through a seamless checkout experience.

## Components

### PaymentButton
A simple button component that initiates payment and opens Flutterwave checkout in a new tab.

```tsx
<PaymentButton
  amount={100.00}
  currency="USD"
  txRef="unique_transaction_ref"
  email="user@example.com"
  onSuccess={(data) => console.log('Payment successful', data)}
  onError={(error) => console.log('Payment failed', error)}
/>
```

### PaymentModal
A comprehensive payment modal with fee calculation, transaction details, and status tracking.

```tsx
<PaymentModal
  isOpen={true}
  onClose={() => setShowModal(false)}
  amount={250.00}
  currency="USD"
  txRef="group_123_1234567890"
  email="user@example.com"
  description="Payment for group purchase"
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>
```

### PaymentStatusChecker
Component to check and display payment status with automatic polling.

```tsx
<PaymentStatusChecker
  transactionId="123456789"
  onStatusUpdate={(status, data) => console.log(status, data)}
  autoCheck={true}
  checkInterval={5000}
/>
```

## API Integration

The payment system uses the following API endpoints:

- `POST /api/payment/initialize` - Initialize payment transaction
- `POST /api/payment/verify` - Verify payment status
- `GET /api/payment/fee` - Calculate transaction fees

## Group Purchase Flow

1. User selects "Card payment" in the group join form
2. Payment modal opens with calculated amount (including delivery fees)
3. User completes payment on Flutterwave checkout
4. Payment success triggers group join with transaction details
5. User receives confirmation and can track group progress

## Test Environment

The integration uses Flutterwave's test environment. Use these test credentials:

- **Card Number**: 5531 8866 5214 2950
- **CVV**: 564
- **Expiry**: 09/32
- **PIN**: 3310

## Error Handling

The system includes comprehensive error handling:

- Network failures
- Payment failures
- Invalid transaction references
- Authentication errors

## Security

- All payment data is handled securely through Flutterwave
- No sensitive card information is stored on our servers
- JWT authentication required for all payment operations
- HTTPS encryption for all communication

## Configuration

Payment settings are configured in the back-end service. The front-end automatically uses:

- USD as default currency
- Flutterwave test/sandbox environment
- Automatic fee calculation
- Secure transaction references

## Demo

A payment demo component is available at `/src/components/PaymentDemo.tsx` for testing and development purposes.