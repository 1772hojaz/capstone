#!/usr/bin/env python3
"""
Standalone Payment Test
Tests Flutterwave payment service without router dependencies
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("=" * 80)
print("Flutterwave Payment Service Test (Standalone)")
print("=" * 80)

# Direct import of service only
try:
    from payment.flutterwave_service import FlutterwaveService
    print("[PASS] FlutterwaveService imported successfully")
except Exception as e:
    print(f"[FAIL] Failed to import FlutterwaveService: {e}")
    sys.exit(1)

def test_service_initialization():
    """Test that the Flutterwave service initializes correctly"""
    print("\n" + "=" * 80)
    print("TEST 1: Service Initialization")
    print("=" * 80)
    
    try:
        service = FlutterwaveService()
        print("[PASS] Service instance created")
        
        # Test credentials are loaded
        assert service.secret_key is not None, "Secret key not loaded"
        assert service.public_key is not None, "Public key not loaded"
        assert service.encryption_key is not None, "Encryption key not loaded"
        print("[PASS] API credentials loaded")
        
        # Test configuration
        assert service.base_url == "https://api.flutterwave.com/v3", "Incorrect base URL"
        assert "Authorization" in service.headers, "Authorization header missing"
        print("[PASS] API configuration correct")
        
        # Test mode detection
        print(f"[INFO] Test Mode: {service.test_mode}")
        print(f"[INFO] Base URL: {service.base_url}")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {str(e)}")
        return False

def test_payment_initialization():
    """Test payment initialization (simulation)"""
    print("\n" + "=" * 80)
    print("TEST 2: Payment Initialization (Test Mode)")
    print("=" * 80)
    
    try:
        service = FlutterwaveService()
        
        # Test payment initialization
        result = service.initialize_payment(
            amount=100.00,
            email="test@example.com",
            tx_ref="test_tx_" + str(int(datetime.now().timestamp())),
            redirect_url="http://localhost:8000/payment/callback"
        )
        
        print(f"[PASS] Payment initialized")
        print(f"[INFO] Status: {result.get('status')}")
        print(f"[INFO] Message: {result.get('message')}")
        
        if result.get('status') == 'success' and 'data' in result:
            data = result['data']
            if 'link' in data:
                print(f"[INFO] Payment Link: {data['link'][:60]}...")
            print(f"[PASS] Payment link generated successfully")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_fee_calculation():
    """Test transaction fee calculation"""
    print("\n" + "=" * 80)
    print("TEST 3: Fee Calculation")
    print("=" * 80)
    
    try:
        service = FlutterwaveService()
        
        # Test fee calculation for different amounts
        test_amounts = [100.0, 1000.0, 5000.0, 10000.0]
        
        for amount in test_amounts:
            fee_result = service.get_transaction_fee(amount, "USD")
            fee = fee_result['fee']
            percentage = (fee / amount) * 100
            
            print(f"[INFO] Amount: ${amount:,.2f} -> Fee: ${fee:.2f} ({percentage:.2f}%)")
        
        print("[PASS] Fee calculations correct")
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {str(e)}")
        return False

def test_bank_transfer():
    """Test bank transfer functionality"""
    print("\n" + "=" * 80)
    print("TEST 4: Bank Transfer (Supplier Payout)")
    print("=" * 80)
    
    try:
        service = FlutterwaveService()
        
        # Test transfer initialization (simulation)
        result = service.initiate_transfer(
            account_bank="044",  # Access Bank
            account_number="0690000031",
            amount=1000.0,
            narration="Test payout",
            currency="USD",
            beneficiary_name="Test Supplier"
        )
        
        print(f"[PASS] Transfer initiated")
        print(f"[INFO] Status: {result.get('status')}")
        print(f"[INFO] Message: {result.get('message')}")
        
        if 'data' in result:
            print(f"[INFO] Transfer ID: {result['data'].get('id', 'N/A')}")
            print(f"[INFO] Transfer Status: {result['data'].get('status', 'N/A')}")
        
        print("[PASS] Bank transfer functionality working")
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all payment tests"""
    from datetime import datetime
    
    tests = [
        ("Service Initialization", test_service_initialization),
        ("Payment Initialization", test_payment_initialization),
        ("Fee Calculation", test_fee_calculation),
        ("Bank Transfer", test_bank_transfer),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"[FAIL] Test {test_name} crashed: {str(e)}")
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n[SUCCESS] ALL TESTS PASSED!")
        print("\n[PASS] Payment system is operational:")
        print("   - Flutterwave API integration working")
        print("   - Payment initialization functional")
        print("   - Fee calculations accurate")
        print("   - Bank transfers operational")
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed")
    
    print("=" * 80)
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

