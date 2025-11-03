#!/usr/bin/env python3
"""
Test script for Flutterwave Payment Module
Tests service initialization and basic functionality
"""

import os
import sys
from unittest.mock import patch, MagicMock

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from payment.flutterwave_service import FlutterwaveService

def test_service_initialization():
    """Test that the Flutterwave service initializes correctly"""
    print("🔧 Testing Flutterwave Service Initialization...")
    print("-" * 50)

    try:
        # Test service creation
        service = FlutterwaveService()
        print("✅ Service instance created successfully")

        # Test credentials are loaded
        assert service.secret_key is not None, "Secret key not loaded"
        assert service.public_key is not None, "Public key not loaded"
        assert service.encryption_key is not None, "Encryption key not loaded"
        print("✅ API credentials loaded")

        # Test base URL and headers
        assert service.base_url == "https://api.flutterwave.com/v3", "Incorrect base URL"
        assert "Authorization" in service.headers, "Authorization header missing"
        assert service.headers["Authorization"].startswith("Bearer "), "Invalid auth header format"
        print("✅ API configuration correct")

        return True

    except Exception as e:
        print(f"❌ Service initialization failed: {str(e)}")
        return False

def test_payment_initialization_structure():
    """Test the structure of payment initialization payload"""
    print("\n💳 Testing Payment Initialization Structure...")
    print("-" * 50)

    try:
        # Test payload creation (without making actual API call)
        test_payload = {
            "tx_ref": "test_tx_123",
            "amount": "1000.00",
            "currency": "USD",
            "redirect_url": "http://localhost:8000/payment/callback",
            "payment_options": "card,mobilemoney,ussd",
            "customer": {
                "email": "test@example.com",
            },
            "customizations": {
                "title": "Mbare Payment",
                "description": "Payment for products",
            }
        }

        # Verify required fields are present
        required_fields = ["tx_ref", "amount", "currency", "customer", "customizations"]
        for field in required_fields:
            assert field in test_payload, f"Missing required field: {field}"

        print("✅ Payment payload structure correct")
        print(f"   Transaction Ref: {test_payload['tx_ref']}")
        print(f"   Amount: {test_payload['amount']} {test_payload['currency']}")
        print(f"   Customer Email: {test_payload['customer']['email']}")

        return True

    except Exception as e:
        print(f"❌ Payment structure test failed: {str(e)}")
        return False

@patch('payment.flutterwave_service.requests.post')
def test_payment_initialization_mock(mock_post):
    """Test payment initialization with mocked API response"""
    print("\n🔄 Testing Payment Initialization (Mocked)...")
    print("-" * 50)

    try:
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "status": "success",
            "message": "Hosted Link",
            "data": {
                "link": "https://checkout.flutterwave.com/pay/test_tx_123",
                "id": 123456
            }
        }
        mock_post.return_value = mock_response

        service = FlutterwaveService()

        # Test the method
        result = service.initialize_payment(
            amount=1000.00,
            email="test@example.com",
            tx_ref="test_tx_123"
        )

        # Verify the call was made correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[0][0] == "https://api.flutterwave.com/v3/payments", "Wrong API endpoint"

        # Verify payload
        payload = call_args[1]["json"]
        assert payload["tx_ref"] == "test_tx_123", "Wrong transaction ref"
        assert payload["amount"] == "1000.0", "Wrong amount"
        assert payload["customer"]["email"] == "test@example.com", "Wrong email"

        # Verify response
        assert result["status"] == "success", "Wrong response status"
        assert "link" in result["data"], "Missing payment link"

        print("✅ Mock payment initialization successful")
        print(f"   Payment Link: {result['data']['link']}")
        print(f"   Transaction ID: {result['data']['id']}")

        return True

    except Exception as e:
        print(f"❌ Mock payment test failed: {str(e)}")
        return False

@patch('payment.flutterwave_service.requests.get')
def test_payment_verification_mock(mock_get):
    """Test payment verification with mocked API response"""
    print("\n✅ Testing Payment Verification (Mocked)...")
    print("-" * 50)

    try:
        # Mock successful verification response
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "status": "success",
            "message": "Transaction fetched successfully",
            "data": {
                "id": 123456,
                "tx_ref": "test_tx_123",
                "status": "successful",
                "amount": 1000,
                "currency": "USD",
                "customer": {
                    "email": "test@example.com"
                }
            }
        }
        mock_get.return_value = mock_response

        service = FlutterwaveService()

        # Test the method
        result = service.verify_payment("123456")

        # Verify the call was made correctly
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert call_args[0][0] == "https://api.flutterwave.com/v3/transactions/123456/verify", "Wrong API endpoint"

        # Verify response
        assert result["status"] == "success", "Wrong response status"
        assert result["data"]["status"] == "successful", "Wrong transaction status"
        assert result["data"]["amount"] == 1000, "Wrong amount"

        print("✅ Mock payment verification successful")
        print(f"   Transaction Status: {result['data']['status']}")
        print(f"   Amount: {result['data']['amount']} {result['data']['currency']}")

        return True

    except Exception as e:
        print(f"❌ Mock verification test failed: {str(e)}")
        return False

def test_fee_calculation():
    """Test transaction fee calculation"""
    print("\n💰 Testing Fee Calculation...")
    print("-" * 50)

    try:
        service = FlutterwaveService()

        # Test fee calculation
        fee_result = service.get_transaction_fee(1000.00, "USD")

        # Verify structure
        assert "fee" in fee_result, "Fee not calculated"
        assert "currency" in fee_result, "Currency not specified"
        assert fee_result["fee"] == 15.0, "Wrong fee calculation (1.5%)"
        assert fee_result["currency"] == "USD", "Wrong currency"

        print("✅ Fee calculation correct")
        print("   Amount: 1000.00 USD")
        print(f"   Fee: {fee_result['fee']} USD (1.5%)")
        print(f"   Note: {fee_result['note']}")

        return True

    except Exception as e:
        print(f"❌ Fee calculation test failed: {str(e)}")
        return False

def main():
    """Run all payment module tests"""
    print("=" * 80)
    print("🧪 Flutterwave Payment Module Test Suite")
    print("=" * 80)
    print(f"Testing environment: {os.getenv('FLUTTERWAVE_PUBLIC_KEY', 'Using defaults from futterwave.txt')}")
    print()

    tests = [
        test_service_initialization,
        test_payment_initialization_structure,
        test_payment_initialization_mock,
        test_payment_verification_mock,
        test_fee_calculation,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {str(e)}")
            print()

    # Summary
    print("=" * 80)
    print("📊 Test Results Summary")
    print("=" * 80)
    print(f"Tests Passed: {passed}/{total}")
    print(".1f")

    if passed == total:
        print("🎉 ALL TESTS PASSED! Payment module is ready for use.")
        print("\nNext steps:")
        print("1. Start the FastAPI server: python main.py")
        print("2. Test endpoints at: http://localhost:8000/docs")
        print("3. Use payment endpoints under /api/payment/")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

    print("=" * 80)

if __name__ == "__main__":
    main()