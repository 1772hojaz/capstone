"""
Complete Backend Flow Test
Tests the entire group-buy workflow from creation to completion

Test Flow:
1. Setup: Create supplier, trader, and admin users
2. Supplier creates group
3. Admin deletes group (tests CSV export, emails, refunds)
4. Supplier creates new group
5. Trader joins and buys to complete MOQ
6. Verify group completion and order creation
7. Test rejection flow (supplier rejects, admin processes refunds)
8. Test acceptance flow (supplier accepts, admin transfers funds)
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from datetime import datetime, timedelta
import json

# API Base URL
BASE_URL = "http://localhost:8000"

# Test data
test_users = {}
test_groups = {}
test_orders = {}


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)


def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n[STEP {step_num}] {description}")
    print("-" * 80)


def print_result(success, message):
    """Print test result"""
    status = "[OK]" if success else "[FAIL]"
    print(f"{status} {message}")


def login_user(email, password, role="trader"):
    """Login as a test user"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            test_users[role] = {
                "id": data.get("user_id"),
                "email": data.get("email"),
                "token": data.get("access_token"),
                "full_name": data.get("full_name", "Test User")
            }
            print_result(True, f"Logged in as {role}: {email}")
            return True
        else:
            print_result(False, f"Failed to login as {role}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error logging in as {role}: {e}")
        return False


def supplier_create_group():
    """Supplier creates a group buy"""
    try:
        supplier = test_users["supplier"]
        end_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        
        response = requests.post(
            f"{BASE_URL}/api/supplier/groups/create",
            headers={"Authorization": f"Bearer {supplier['token']}"},
            json={
                "name": "Test Bulk Rice - 50kg Bags",
                "description": "Premium quality rice for bulk purchase",
                "long_description": "High-quality rice suitable for restaurants and families",
                "category": "Food & Groceries",
                "price": 45.00,
                "original_price": 60.00,
                "image": "https://example.com/rice.jpg",
                "max_participants": 10,
                "end_date": end_date,
                "shipping_info": "Free delivery to Mbare",
                "estimated_delivery": "3-5 days after group completion",
                "features": ["Premium quality", "50kg bags", "Long grain"],
                "requirements": ["Minimum 10 participants"]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            test_groups["first"] = {
                "id": data.get("group_id") or data.get("id"),
                "name": data.get("name", "Test Group")
            }
            print_result(True, f"Created group ID: {test_groups['first']['id']}")
            return True
        else:
            print_result(False, f"Failed to create group: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error creating group: {e}")
        return False


def admin_delete_group_with_csv():
    """Admin deletes group and tests CSV export + refunds"""
    try:
        admin = test_users["admin"]
        group_id = test_groups["first"]["id"]
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/groups/{group_id}",
            headers={"Authorization": f"Bearer {admin['token']}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            participants_count = data.get("participants_count", 0)
            emails_sent = data.get("emails_sent", 0)
            csv_data = data.get("csv_data", "")
            
            print_result(True, f"Deleted group {group_id}")
            print(f"  - Participants: {participants_count}")
            print(f"  - Emails sent: {emails_sent}")
            print(f"  - CSV generated: {'Yes' if csv_data else 'No'}")
            
            if csv_data:
                print(f"  - CSV preview:\n{csv_data[:200]}...")
            
            return True
        else:
            print_result(False, f"Failed to delete group: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error deleting group: {e}")
        return False


def supplier_create_second_group():
    """Supplier creates a second group for main test flow"""
    try:
        supplier = test_users["supplier"]
        end_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        
        response = requests.post(
            f"{BASE_URL}/api/supplier/groups/create",
            headers={"Authorization": f"Bearer {supplier['token']}"},
            json={
                "name": "Test Cooking Oil - 5L Bottles",
                "description": "Quality cooking oil for bulk purchase",
                "long_description": "Pure vegetable cooking oil, 5L bottles",
                "category": "Food & Groceries",
                "price": 25.00,
                "original_price": 35.00,
                "image": "https://example.com/oil.jpg",
                "max_participants": 5,  # Small MOQ for easy testing
                "end_date": end_date,
                "shipping_info": "Free delivery to Mbare",
                "estimated_delivery": "3-5 days after group completion",
                "features": ["Pure vegetable oil", "5L bottles", "Food grade"],
                "requirements": ["Minimum 5 participants"]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            test_groups["second"] = {
                "id": data.get("group_id") or data.get("id"),
                "name": data.get("name", "Test Group 2")
            }
            print_result(True, f"Created second group ID: {test_groups['second']['id']}")
            return True
        else:
            print_result(False, f"Failed to create second group: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error creating second group: {e}")
        return False


def trader_join_group(group_key, quantity=5):
    """Trader joins a group and makes payment"""
    try:
        trader = test_users["trader"]
        group_id = test_groups[group_key]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/join",
            headers={"Authorization": f"Bearer {trader['token']}"},
            json={
                "quantity": quantity,
                "delivery_method": "pickup",
                "payment_method": "flutterwave"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            payment_amount = data.get("payment_amount", 0)
            payment_status = data.get("payment_status", "unknown")
            group_progress = data.get("group_progress", "N/A")
            group_status = data.get("group_status", "active")
            
            print_result(True, f"Joined group {group_id}")
            print(f"  - Quantity: {quantity}")
            print(f"  - Payment: ${payment_amount} ({payment_status})")
            print(f"  - Progress: {group_progress}")
            print(f"  - Status: {group_status}")
            
            # Store whether group is completed
            if group_status == "completed":
                test_groups[group_key]["completed"] = True
            
            return True, group_status
        else:
            print_result(False, f"Failed to join group: {response.text}")
            return False, None
    except Exception as e:
        print_result(False, f"Error joining group: {e}")
        return False, None


def get_supplier_orders():
    """Get supplier's pending orders"""
    try:
        supplier = test_users["supplier"]
        
        response = requests.get(
            f"{BASE_URL}/api/supplier/orders?status_filter=pending",
            headers={"Authorization": f"Bearer {supplier['token']}"}
        )
        
        if response.status_code == 200:
            orders = response.json()
            print_result(True, f"Retrieved {len(orders)} pending order(s)")
            
            if orders:
                # Store the first order for testing
                test_orders["current"] = orders[0]
                order = orders[0]
                print(f"  - Order ID: {order.get('id')}")
                print(f"  - Order #: {order.get('order_number')}")
                print(f"  - Value: ${order.get('total_value', 0)}")
                print(f"  - Status: {order.get('status')}")
            
            return True, orders
        else:
            print_result(False, f"Failed to get orders: {response.text}")
            return False, []
    except Exception as e:
        print_result(False, f"Error getting orders: {e}")
        return False, []


def supplier_reject_order():
    """Supplier rejects an order (triggers automatic refunds)"""
    try:
        supplier = test_users["supplier"]
        order_id = test_orders["current"]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/supplier/orders/{order_id}/action",
            headers={"Authorization": f"Bearer {supplier['token']}"},
            json={
                "action": "reject",
                "reason": "Out of stock - testing refund flow"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            message = data.get("message", "")
            refund_summary = data.get("refund_summary", {})
            
            print_result(True, f"Rejected order {order_id}")
            print(f"  - Message: {message}")
            
            if refund_summary:
                refunds_processed = refund_summary.get("refunds_processed", 0)
                refunds_failed = refund_summary.get("refunds_failed", 0)
                print(f"  - Refunds processed: {refunds_processed}")
                print(f"  - Refunds failed: {refunds_failed}")
            
            return True
        else:
            print_result(False, f"Failed to reject order: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error rejecting order: {e}")
        return False


def supplier_accept_order():
    """Supplier accepts an order"""
    try:
        supplier = test_users["supplier"]
        order_id = test_orders["current"]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/supplier/orders/{order_id}/action",
            headers={"Authorization": f"Bearer {supplier['token']}"},
            json={
                "action": "confirm",
                "delivery_method": "delivery",
                "special_instructions": "Handle with care"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            message = data.get("message", "")
            
            print_result(True, f"Accepted order {order_id}")
            print(f"  - Message: {message}")
            
            return True
        else:
            print_result(False, f"Failed to accept order: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error accepting order: {e}")
        return False


def admin_transfer_funds():
    """Admin transfers funds to supplier"""
    try:
        admin = test_users["admin"]
        order_id = test_orders["current"]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/orders/{order_id}/transfer-funds",
            headers={"Authorization": f"Bearer {admin['token']}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            supplier_payout = data.get("supplier_payout", 0)
            platform_fee = data.get("platform_fee", 0)
            transfer_status = data.get("transfer_status", "unknown")
            transfer_reference = data.get("transfer_reference", "")
            
            print_result(True, f"Transferred funds for order {order_id}")
            print(f"  - Supplier payout: ${supplier_payout}")
            print(f"  - Platform fee: ${platform_fee}")
            print(f"  - Transfer status: {transfer_status}")
            print(f"  - Reference: {transfer_reference}")
            
            return True
        else:
            print_result(False, f"Failed to transfer funds: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Error transferring funds: {e}")
        return False


def run_complete_flow_test():
    """Run the complete backend flow test"""
    print_section("COMPLETE BACKEND FLOW TEST")
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.utcnow().isoformat()}")
    
    # Track test results
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0
    }
    
    # STEP 1: Setup Users (Login)
    print_step(1, "Setup: Login Test Users")
    results["total"] += 3
    if login_user("supplier1@mbare.co.zw", "supplier123", "supplier"):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    if login_user("q8hwpu2rjm@wnbaldwy.com", "password123", "trader"):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    if login_user("admin@groupbuy.com", "admin123", "admin"):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # STEP 2: Supplier Creates Group
    print_step(2, "Supplier Creates Group Buy")
    results["total"] += 1
    if supplier_create_group():
        results["passed"] += 1
    else:
        results["failed"] += 1
        print("Cannot continue test without group creation")
        return results
    
    # STEP 3: Admin Deletes Group (Test CSV + Refunds)
    print_step(3, "Admin Deletes Group (CSV Export & Refunds)")
    results["total"] += 1
    if admin_delete_group_with_csv():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # STEP 4: Supplier Creates Second Group
    print_step(4, "Supplier Creates Second Group for Main Flow")
    results["total"] += 1
    if supplier_create_second_group():
        results["passed"] += 1
    else:
        results["failed"] += 1
        print("Cannot continue test without second group")
        return results
    
    # STEP 5: Trader Joins and Completes Group
    print_step(5, "Trader Joins Group and Completes MOQ")
    results["total"] += 1
    # Join with full MOQ to complete the group
    success, status = trader_join_group("second", quantity=5)
    if success:
        results["passed"] += 1
        if status == "completed":
            print("  [INFO] Group automatically completed (MOQ reached)")
        else:
            print(f"  [INFO] Group status: {status}")
    else:
        results["failed"] += 1
        print("Cannot continue test without joining group")
        return results
    
    # STEP 6: Verify Order Creation
    print_step(6, "Verify Supplier Order Created")
    results["total"] += 1
    success, orders = get_supplier_orders()
    if success and orders:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print("No orders found - group may not have completed")
        return results
    
    # STEP 7: Test Rejection Flow
    print_step(7, "Test Rejection Flow (Supplier Rejects → Auto Refunds)")
    results["total"] += 1
    if supplier_reject_order():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # STEP 8: Create Third Group for Acceptance Flow
    print_step(8, "Create Third Group for Acceptance Flow")
    results["total"] += 1
    # Reuse second group creation logic but with different name
    try:
        supplier = test_users["supplier"]
        end_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        
        response = requests.post(
            f"{BASE_URL}/api/supplier/groups/create",
            headers={"Authorization": f"Bearer {supplier['token']}"},
            json={
                "name": "Test Sugar - 2kg Packets",
                "description": "Quality sugar for bulk purchase",
                "long_description": "Pure white sugar, 2kg packets",
                "category": "Food & Groceries",
                "price": 15.00,
                "original_price": 20.00,
                "image": "https://example.com/sugar.jpg",
                "max_participants": 3,
                "end_date": end_date,
                "shipping_info": "Free delivery",
                "estimated_delivery": "3-5 days",
                "features": ["Pure sugar", "2kg packets"],
                "requirements": ["Minimum 3 participants"]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            test_groups["third"] = {
                "id": data.get("group_id") or data.get("id"),
                "name": "Test Sugar"
            }
            print_result(True, f"Created third group ID: {test_groups['third']['id']}")
            results["passed"] += 1
        else:
            print_result(False, f"Failed to create third group")
            results["failed"] += 1
            return results
    except Exception as e:
        print_result(False, f"Error creating third group: {e}")
        results["failed"] += 1
        return results
    
    # STEP 9: Trader Joins Third Group
    print_step(9, "Trader Joins Third Group")
    results["total"] += 1
    success, status = trader_join_group("third", quantity=3)
    if success:
        results["passed"] += 1
    else:
        results["failed"] += 1
        return results
    
    # STEP 10: Get New Order
    print_step(10, "Get New Pending Order")
    results["total"] += 1
    success, orders = get_supplier_orders()
    if success and orders:
        results["passed"] += 1
    else:
        results["failed"] += 1
        return results
    
    # STEP 11: Supplier Accepts Order
    print_step(11, "Test Acceptance Flow (Supplier Accepts Order)")
    results["total"] += 1
    if supplier_accept_order():
        results["passed"] += 1
    else:
        results["failed"] += 1
        return results
    
    # STEP 12: Admin Transfers Funds
    print_step(12, "Admin Transfers Funds to Supplier")
    results["total"] += 1
    if admin_transfer_funds():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Print Summary
    print_section("TEST SUMMARY")
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']} ({results['passed']/results['total']*100:.1f}%)")
    print(f"Failed: {results['failed']} ({results['failed']/results['total']*100:.1f}%)")
    print(f"Completed at: {datetime.utcnow().isoformat()}")
    
    return results


if __name__ == "__main__":
    try:
        results = run_complete_flow_test()
        
        # Exit with appropriate code
        if results["failed"] == 0:
            print("\n[SUCCESS] All tests passed!")
            sys.exit(0)
        else:
            print(f"\n[FAILURE] {results['failed']} test(s) failed")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED] Test cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

